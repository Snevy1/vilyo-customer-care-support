

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, isNull, or } from "drizzle-orm";

import { db } from "@/db/client";
import { paymentProcessor } from "@/db/schema";
import { defaultLimiter } from "@/lib/subscriptions/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get("user_session")?.value;

    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, organization_id } = JSON.parse(userSession);

    try {
      await defaultLimiter.check(email, 1);
    } catch {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const [mpesaProcessor] = await db
      .select({
        id: paymentProcessor.id,
        displayName: paymentProcessor.display_name,
        logoUrl: paymentProcessor.logo_url,
      })
      .from(paymentProcessor)
      .where(
        and(
          eq(paymentProcessor.provider, "mpesa"),
          eq(paymentProcessor.is_enabled, true),
          isNull(paymentProcessor.deleted_at),
          or(
            eq(paymentProcessor.tenant_id, organization_id),
            isNull(paymentProcessor.tenant_id)
          )
        )
      )
      .limit(1);

    if (!mpesaProcessor) {
      return NextResponse.json(
        { error: "Mpesa not configured" },
        { status: 404 }
      );
    }

    return NextResponse.json({ mpesa: mpesaProcessor });
  } catch (error) {
    console.error("Error fetching Mpesa config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
