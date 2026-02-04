import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { db } from "@/db/client";
import { paymentProcessor } from "@/db/schema"; 
import { encryptJSON } from "@/lib/crypto";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // ---------------- AUTH ----------------
    const cookieStore = await cookies();
    const userSession = cookieStore.get("user_session")?.value;

    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, organization_id, user_id } = JSON.parse(userSession);

    // Only superadmin or tenant admin
    if (!["SUPER_ADMIN", "TENANT_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ---------------- BODY ----------------
    const body = await request.json();

    const {
      provider,           // 'stripe', 'mpesa', etc.
      code,               // 'stripe_prod'
      displayName,
      logoUrl,
      environment,        // 'production' | 'test'
      supportedCurrencies,
      credentials,        // RAW keys from admin form
      isEnabled,
    } = body;

    if (!provider || !code || !displayName || !credentials) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ---------------- ENCRYPT ----------------
    const encryptedCredentials = encryptJSON(credentials);

    // ---------------- UPSERT ----------------
    const [processor] = await db
      .insert(paymentProcessor)
      .values({
        provider,
        code,
        display_name: displayName,
        logo_url: logoUrl,
        environment,
        supported_currencies: supportedCurrencies ?? [],
        credentials: encryptedCredentials,
        is_enabled: isEnabled ?? false,

        tenant_id: role === "SUPER_ADMIN" ? null : organization_id,
        created_by: user_id,
      })
      .onConflictDoUpdate({
        target: [
          paymentProcessor.provider,
          paymentProcessor.tenant_id,
          paymentProcessor.code,
        ],
        set: {
          display_name: displayName,
          logo_url: logoUrl,
          environment,
          supported_currencies: supportedCurrencies ?? [],
          credentials: encryptedCredentials,
          is_enabled: isEnabled ?? false,
          updated_by: user_id,
        audit_log: sql`
      audit_log || jsonb_build_array(
        jsonb_build_object(
          'changed_by', ${user_id},
          'changed_at', now(),
          'changes', jsonb_build_object(
            'display_name', jsonb_build_object('old', ${displayName}, 'new', ${displayName})
          )
        )
      )
    `
        },
      })
      .returning();

    return NextResponse.json({ processor });
  } catch (error) {
    console.error("Error saving payment processor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

