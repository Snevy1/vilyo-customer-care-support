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

    const {  organization_id,userId, email} = JSON.parse(userSession);

  
    // ---------------- BODY ----------------
    const body = await request.json();

    const {
      provider,
      code,
      displayName,
      logoUrl,
      environment,
      supportedCurrencies,
      credentials,
      isEnabled,
      userRole
    } = body;

     if (!["SUPER_ADMIN", "TENANT_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } 

    if (!provider || !code || !displayName || !credentials) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const tenantId = userRole === "SUPER_ADMIN" ? null : organization_id;

    // ---------------- ENCRYPT ----------------
    const encryptedCredentials = encryptJSON(credentials);

    // ---------------- FETCH EXISTING (for audit diff) ----------------
    const existing = await db.query.paymentProcessor.findFirst({
      where: and(
        eq(paymentProcessor.provider, provider),
        eq(paymentProcessor.code, code),
        tenantId
          ? eq(paymentProcessor.tenant_id, tenantId)
          : sql`${paymentProcessor.tenant_id} is null`
      ),
    });

    // ---------------- UPSERT ----------------
    if (existing) {
      // Build the changes diff — only include fields that actually changed
      const changes: Record<string, { old: unknown; new: unknown }> = {};

      if (existing.display_name !== displayName) {
        changes.display_name = { old: existing.display_name, new: displayName };
      }
      if (existing.environment !== environment) {
        changes.environment = { old: existing.environment, new: environment };
      }
      if (existing.is_enabled !== isEnabled) {
        changes.is_enabled = { old: existing.is_enabled, new: isEnabled };
      }
      if (
        JSON.stringify(existing.supported_currencies) !==
        JSON.stringify(supportedCurrencies ?? [])
      ) {
        changes.supported_currencies = {
          old: existing.supported_currencies,
          new: supportedCurrencies ?? [],
        };
      }
      // Always mark credentials as changed if provided (can't diff encrypted values)
      changes.credentials = { old: "***", new: "***" };

      const [processor] = await db
        .update(paymentProcessor)
        .set({
          display_name: displayName,
          logo_url: logoUrl,
          environment,
          supported_currencies: supportedCurrencies ?? [],
          credentials: encryptedCredentials,
          is_enabled: isEnabled ?? false,
          updated_by: userId,
          updated_at: sql`now()`,
          audit_log: sql`
            COALESCE(${paymentProcessor.audit_log}, '[]'::jsonb) || jsonb_build_array(
              jsonb_build_object(
                'changed_by', ${userId}::text,
                'changed_at', now()::text,
                'changes', ${JSON.stringify(changes)}::jsonb
              )
            )
          `,
        })
        .where(eq(paymentProcessor.id, existing.id))
        .returning();

      return NextResponse.json({ processor });
    }

    // ---------------- INSERT (new record) ----------------
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
        tenant_id: tenantId,
        created_by: userId,
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

    const {  organization_id,userId, email } = JSON.parse(userSession);

    // For now let's hardcode role check here, but ideally we should have a more flexible permissions system in place
    const role = "SUPER_ADMIN"; // This is just an example. Adjust based on your actual role management, for now only superAdmin can view payment processors: "TENANT_ADMIN" .

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
    /* if (role === "TENANT_ADMIN") {
      whereClause = or(
        eq(paymentProcessor.tenant_id, organization_id),
        isNull(paymentProcessor.tenant_id)
      );
    } */

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