import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { db } from "@/db/client";
import { paymentProcessor } from "@/db/schema"; 
import { encryptJSON } from "@/lib/crypto";
import { or, SQL, sql } from "drizzle-orm";
import { decryptJSON } from "@/lib/crypto";
import { eq, and, isNull } from "drizzle-orm";

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







export async function GET(request: NextRequest) {
  try {
    // ---------------- AUTH ----------------
    const cookieStore = await cookies();
    const userSession = cookieStore.get("user_session")?.value;

    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, organization_id } = JSON.parse(userSession);

    // Only superadmin or tenant admin
    if (!["SUPER_ADMIN", "TENANT_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ---------------- QUERY PARAMS ----------------
    const { searchParams } = new URL(request.url);
    const includeCredentials = searchParams.get("includeCredentials") === "true";
    
    // Cast provider to the correct enum type
    const providerParam = searchParams.get("provider");
    const provider = providerParam as "stripe" | "paypal" | "paystack" | "flutterwave" | "mpesa" | undefined;
    
    const isEnabledParam = searchParams.get("isEnabled");
    const isEnabled = isEnabledParam !== null ? isEnabledParam === "true" : undefined;

    // ---------------- FETCH ----------------
    // Build WHERE clause step by step
    let whereClause: SQL | undefined = undefined;

    // Start with tenant filter for TENANT_ADMIN
    if (role === "TENANT_ADMIN") {
      whereClause = or(
        eq(paymentProcessor.tenant_id, organization_id),
        isNull(paymentProcessor.tenant_id)
      );
    }

    // Add provider filter
    if (provider) {
      whereClause = whereClause 
        ? and(whereClause, eq(paymentProcessor.provider, provider))
        : eq(paymentProcessor.provider, provider);
    }

    // Add isEnabled filter
    if (isEnabled !== undefined) {
      whereClause = whereClause 
        ? and(whereClause, eq(paymentProcessor.is_enabled, isEnabled))
        : eq(paymentProcessor.is_enabled, isEnabled);
    }

    // Build query
    const baseQuery = db.select().from(paymentProcessor);
    const finalQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;

    const processors = await finalQuery;

    // ---------------- DECRYPT (if requested) ----------------
    const processedProcessors = processors.map((proc) => {
      const { credentials, ...rest } = proc;

      if (includeCredentials && credentials) {
        // Decrypt credentials for admin use
        return {
          ...rest,
          credentials: decryptJSON(credentials),
        };
      }

      // Don't include credentials in response by default
      return rest;
    });

    return NextResponse.json({ processors: processedProcessors });
  } catch (error) {
    console.error("Error fetching payment processors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}