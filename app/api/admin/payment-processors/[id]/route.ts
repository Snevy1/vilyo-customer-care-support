import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {db} from "@/db/client";
import { paymentProcessor } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ---------------- AUTH ----------------
    const cookieStore = await cookies();
    const userSession = cookieStore.get("user_session")?.value;

    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, organization_id, user_id } = JSON.parse(userSession);

    if (!["SUPER_ADMIN", "TENANT_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing processor id" }, { status: 400 });
    }

    // ---------------- BODY ----------------
    const body = await request.json();
    const { is_enabled } = body;

    if (typeof is_enabled !== "boolean") {
      return NextResponse.json(
        { error: "is_enabled must be a boolean" },
        { status: 400 }
      );
    }

    const tenantId = role === "SUPER_ADMIN" ? null : organization_id;

    // ---------------- OWNERSHIP CHECK ----------------
    // Ensure the processor belongs to this tenant (or is global for SUPER_ADMIN)
    const existing = await db.query.paymentProcessor.findFirst({
      where: and(
        eq(paymentProcessor.id, id),
        tenantId
          ? eq(paymentProcessor.tenant_id, tenantId)
          : sql`${paymentProcessor.tenant_id} is null`
      ),
      columns: { id: true, display_name: true, is_enabled: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Processor not found or access denied" },
        { status: 404 }
      );
    }

    // ---------------- UPDATE ----------------
    const [updated] = await db
      .update(paymentProcessor)
      .set({
        is_enabled,
        updated_by: user_id,
        updated_at: sql`now()`,
        audit_log: sql`
          COALESCE(${paymentProcessor.audit_log}, '[]'::jsonb) || jsonb_build_array(
            jsonb_build_object(
              'changed_by', ${user_id}::text,
              'changed_at', now()::text,
              'changes', jsonb_build_object(
                'is_enabled', jsonb_build_object(
                  'old', ${existing.is_enabled}::boolean,
                  'new', ${is_enabled}::boolean
                )
              )
            )
          )
        `,
      })
      .where(eq(paymentProcessor.id, id))
      .returning({
        id: paymentProcessor.id,
        display_name: paymentProcessor.display_name,
        is_enabled: paymentProcessor.is_enabled,
        updated_at: paymentProcessor.updated_at,
      });

    return NextResponse.json({ processor: updated });
  } catch (error) {
    console.error("Error toggling payment processor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}