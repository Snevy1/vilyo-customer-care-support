import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, isNull, or } from "drizzle-orm";

import { db } from "@/db/client";
import { paymentProcessor } from "@/db/schema"; 
import { defaultLimiter } from "@/lib/subscriptions/rate-limit";
import { decryptJSON } from "@/lib/crypto";  // <--  decrypt helper

export async function GET(request: NextRequest) {
  try {
    // ---------------- AUTH ----------------
    const cookieStore = await cookies();
    const userSession = cookieStore.get("user_session")?.value;

    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, organization_id } = JSON.parse(userSession);

    // ---------------- RATE LIMIT ----------------
    try {
      await defaultLimiter.check(email, 1);
    } catch {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // ---------------- FETCH STRIPE PROCESSOR ----------------
    const [stripeProcessor] = await db
      .select({
        credentials: paymentProcessor.credentials,
      })
      .from(paymentProcessor)
      .where(
        and(
          eq(paymentProcessor.provider, "stripe"),
          eq(paymentProcessor.is_enabled, true),
          isNull(paymentProcessor.deleted_at),
          or(
            // Tenant override first
            eq(paymentProcessor.tenant_id, organization_id),
            // Fallback to global
            isNull(paymentProcessor.tenant_id)
          )
        )
      )
      .limit(1);

    if (!stripeProcessor?.credentials) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 404 }
      );
    }

    // ---------------- DECRYPT & EXTRACT ----------------
    const decrypted = decryptJSON(stripeProcessor.credentials);

    const publishableKey = decrypted.publishableKey;

    if (!publishableKey) {
      return NextResponse.json(
        { error: "Stripe publishable key missing" },
        { status: 500 }
      );
    }

    // ---------------- RETURN SAFE KEY ----------------
    return NextResponse.json({ publishableKey });
  } catch (error) {
    console.error("Error fetching Stripe key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
