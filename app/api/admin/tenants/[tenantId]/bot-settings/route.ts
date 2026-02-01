// /api/admin/tenants/[tenantId]/bot-settings/route.ts

import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { whatsAppTenant } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";


// Toggle bot globally for a tenant
export async function PATCH(
  req: Request,
  { params }: { params: { tenantId: string } }
) {
  

  try {

    const cookieStore = await cookies();
        const userSession = cookieStore.get('user_session')?.value;
        
        if (!userSession) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
  
        
        

  const { tenantId } = params;
  const { bot_enabled } = await req.json();

  if (typeof bot_enabled !== 'boolean') {
    return NextResponse.json(
      { error: "bot_enabled must be a boolean" },
      { status: 400 }
    );
  }



    await db
      .update(whatsAppTenant)
      .set({ bot_enabled })
      .where(eq(whatsAppTenant.id, tenantId));

    return NextResponse.json({
      success: true,
      message: `Bot ${bot_enabled ? 'enabled' : 'disabled'} for tenant`,
      tenantId,
      bot_enabled,
    });
  } catch (error) {
    console.error("Bot settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update bot settings" },
      { status: 500 }
    );
  }
}

// Get current bot settings
export async function GET(
  req: Request,
  { params }: { params: { tenantId: string } }
) {
  

  

  try {

    const cookieStore = await cookies();
        const userSession = cookieStore.get('user_session')?.value;
        
        if (!userSession) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { tenantId } = params;
        
    const [tenant] = await db
      .select()
      .from(whatsAppTenant)
      .where(eq(whatsAppTenant.id, tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({
      tenantId: tenant.id,
      bot_enabled: tenant.bot_enabled,
      auto_takeover_on_escalation: tenant.auto_takeover_on_escalation,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Failed to get bot settings" },
      { status: 500 }
    );
  }
}