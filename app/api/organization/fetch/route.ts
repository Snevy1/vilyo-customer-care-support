
// app/api/organization/fetch/route.ts
import { db } from "@/db/client";
import { metadata, whatsAppSubscription } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Get user from your session cookie (from your auth flow)
    const cookieStore = await cookies();
    const userSession = cookieStore.get('user_session')?.value;
    
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { email, organization_id } = JSON.parse(userSession);
    
    // Get metadata from your main DB
    const [metadataRecord] = await db.select()
      .from(metadata)
      .where(eq(metadata.user_email, email));

    // Get WhatsappSubscription 

  const [WhatsappSubscription] = await db
  .select()
  .from(whatsAppSubscription)
  .where(eq(whatsAppSubscription.organization_id, organization_id))
  .limit(1);

    // Create Supabase admin client (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch subscription using admin client
    const { data: subscription } = await supabaseAdmin
      .from('organization_subscriptions')
      .select('status, plan_id, current_period_end')
      .eq('organization_id', organization_id)
      .maybeSingle();

    // Fetch CRM connection status
    const { data: connection } = await supabaseAdmin
      .from('organization_connections')
      .select('is_crm_active, crm_type')
      .eq('organization_id', organization_id)
      .maybeSingle();

    const organization = {
      ...(metadataRecord || {}),
      id: organization_id
    };

    return NextResponse.json({ 
      organization, 
      subscription,
      connection,
      WhatsappSubscription
    });
    
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}












// Original code;

/* import { db } from "@/db/client";
import { metadata } from "@/db/schema";
import { isAuthorized } from "@/lib/isAuthorized";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function GET(){
    try {
        const user = await isAuthorized();

        if(!user){
           return NextResponse.json({error: "Unauthorized"},{status:401})  
        }

        const [metadataRecod] = await db.select().from(metadata).where(eq(metadata.user_email, user.email))

        const organization = {
            ...(metadataRecod || []),
            id: user.organization_id
        };

        return NextResponse.json({organization})
        
    } catch (error) {
        return new Response("Internal Server Error", {status: 500})
        
    }
} */