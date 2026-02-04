import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, isNull, or } from "drizzle-orm";

import { db } from "@/db/client";
import { paymentProcessor } from "@/db/schema";
import { defaultLimiter } from "@/lib/subscriptions/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // ---------------- AUTH ----------------
    const cookieStore = await cookies();
    const userSession = cookieStore.get("user_session")?.value;

    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, organization_id, role } = JSON.parse(userSession);

    // ---------------- RATE LIMIT ----------------
    try {
      await defaultLimiter.check(email, 1);
    } catch {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // ---------------- QUERY ----------------
    const processors = await db
      .select({
        id: paymentProcessor.id,
        provider: paymentProcessor.provider,
        code: paymentProcessor.code,
        displayName: paymentProcessor.display_name,
        logoUrl: paymentProcessor.logo_url,
        supportedCurrencies: paymentProcessor.supported_currencies,
        environment: paymentProcessor.environment,
        isEnabled: paymentProcessor.is_enabled,
        tenantId: paymentProcessor.tenant_id,
      })
      .from(paymentProcessor)
      .where(
        and(
          eq(paymentProcessor.is_enabled, true),
          isNull(paymentProcessor.deleted_at),
          or(
            // Global processors (superadmin)
            isNull(paymentProcessor.tenant_id),

            // Tenant-specific processors
            eq(paymentProcessor.tenant_id, organization_id)
          )
        )
      );

    return NextResponse.json({ processors });
  } catch (error) {
    console.error("Error fetching payment processors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
