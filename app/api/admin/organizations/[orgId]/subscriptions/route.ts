import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: {
    orgId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // ---------------- AUTH ----------------
    const cookieStore = await cookies();
    const userSession = cookieStore.get("user_session")?.value;

    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organization_id, role } = JSON.parse(userSession);
    const { orgId } = params;

    // ---------------- AUTHORIZATION ----------------
    if (role === "TENANT_ADMIN" && organization_id !== orgId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (!["SUPER_ADMIN", "TENANT_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ---------------- FETCH SUBSCRIPTION DETAILS ----------------
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
      columns: {
        id: true,
        name: true,
        email: true,
        web_chat_plan: true,
        web_chat_subscription_id: true,
        web_chat_status: true,
        web_chat_period_end: true,
        web_chat_payment_method: true,
        web_chat_provider: true,
        web_chat_created_at: true,
        web_chat_cancelled_at: true,
        web_chat_updated_at: true,
        stripe_customer_id: true,
        paypal_customer_id: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // ---------------- CALCULATE SUBSCRIPTION METRICS ----------------
    const now = new Date();
    const periodEnd = organization.web_chat_period_end ? new Date(organization.web_chat_period_end) : null;
    
    const subscription = {
      ...organization,
      metrics: {
        is_active: organization.web_chat_status === 'active',
        days_until_renewal: periodEnd 
          ? Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        is_trial: false, // You can add trial logic if needed
        has_payment_method: !!organization.web_chat_payment_method,
      }
    };

    return NextResponse.json({ subscription });

  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}