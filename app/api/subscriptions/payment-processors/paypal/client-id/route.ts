import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, isNull, or } from "drizzle-orm";

import { db } from "@/db/client";
import { paymentProcessor } from "@/db/schema";
import { defaultLimiter } from "@/lib/subscriptions/rate-limit";
import { decryptJSON } from "@/lib/crypto";

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
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // ---------------- FETCH PAYPAL ----------------
    const [paypalProcessor] = await db
      .select({
        credentials: paymentProcessor.credentials,
      })
      .from(paymentProcessor)
      .where(
        and(
          eq(paymentProcessor.provider, "paypal"),
          eq(paymentProcessor.is_enabled, true),
          isNull(paymentProcessor.deleted_at),
          or(
            eq(paymentProcessor.tenant_id, organization_id),
            isNull(paymentProcessor.tenant_id)
          )
        )
      )
      .limit(1);

    if (!paypalProcessor?.credentials) {
      return NextResponse.json(
        { error: "PayPal not configured" },
        { status: 404 }
      );
    }

    const decrypted = decryptJSON(paypalProcessor.credentials);
    
    const clientId = decrypted.publicKey;

    if (!clientId) {
      return NextResponse.json(
        { error: "PayPal clientId missing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ clientId });
  } catch (error) {
    console.error("Error fetching PayPal client ID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
