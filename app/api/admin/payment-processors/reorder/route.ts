import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {db} from "@/db/client";
import { paymentProcessor } from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────

const reorderSchema = z.array(
  z.object({
    id: z.string().min(1),
    priority: z.number().int().min(0),
    is_top_priority: z.boolean(),
  })
);

export async function PATCH(request: NextRequest) {
  try {
    // ---------------- AUTH ----------------
    const cookieStore = await cookies();
    const userSession = cookieStore.get("user_session")?.value;

    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, organization_id, userId } = JSON.parse(userSession);

    if (!["SUPER_ADMIN", "TENANT_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ---------------- BODY ----------------
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const items = parsed.data;

    if (items.length === 0) {
      return NextResponse.json({ error: "Empty reorder list" }, { status: 400 });
    }

    // Enforce: exactly one item should be top priority
    const topPriorityCount = items.filter((i) => i.is_top_priority).length;
    if (topPriorityCount > 1) {
      return NextResponse.json(
        { error: "Only one processor can be set as top priority" },
        { status: 400 }
      );
    }

    const tenantId = role === "SUPER_ADMIN" ? null : organization_id;
    const incomingIds = items.map((i) => i.id);

    // ---------------- OWNERSHIP CHECK ----------------
    // Verify all incoming IDs belong to this tenant before touching anything
    const owned = await db.query.paymentProcessor.findMany({
      where: and(
        inArray(paymentProcessor.id, incomingIds),
        tenantId
          ? eq(paymentProcessor.tenant_id, tenantId)
          : sql`${paymentProcessor.tenant_id} is null`
      ),
      columns: { id: true },
    });

    const ownedIds = new Set(owned.map((p) => p.id));
    const unauthorized = incomingIds.filter((id) => !ownedIds.has(id));

    if (unauthorized.length > 0) {
      return NextResponse.json(
        {
          error: "Access denied for one or more processors",
          ids: unauthorized,
        },
        { status: 403 }
      );
    }

    // ---------------- BULK UPDATE (single transaction) ----------------
    await db.transaction(async (tx) => {
      await Promise.all(
        items.map((item) =>
          tx
            .update(paymentProcessor)
            .set({
              priority: item.priority,
              is_top_priority: item.is_top_priority,
              updated_by: userId,
              updated_at: sql`now()`,
            })
            .where(eq(paymentProcessor.id, item.id))
        )
      );
    });

    return NextResponse.json({ success: true, updated: items.length });
  } catch (error) {
    console.error("Error reordering payment processors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}