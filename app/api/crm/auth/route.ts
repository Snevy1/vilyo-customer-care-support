import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let { 
      organizationId,
      // Receive these from the frontend instead of fetching them
      subscription,
      connection,
      userEmail,
      userId
    } = await req.json();

    
    
    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
    }

    if (!userEmail || !userId) {
      // Fallback to session cookie if not provided
      const sessionCookie = req.cookies.get("user_session")?.value;
      if (!sessionCookie) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const sessionData = JSON.parse(sessionCookie);
      userEmail = userEmail || sessionData.email;
      userId = userId || sessionData.userId;
    }

    // **OPTIONAL: Verify user belongs to organization (can skip if frontend already verified)**
    // Only verify if you want extra security
    /* const { data: userOrg, error: userOrgError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (userOrgError || userOrg?.organization_id !== organizationId) {
      return NextResponse.json({ 
        error: "You don't have permission to access this organization's CRM" 
      }, { status: 403 });
    }
 */
    
    // **Use the subscription data passed from frontend**
    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json({ 
        error: "No active subscription found",
        details: "Please subscribe to access the CRM"
      }, { status: 402 });
    }

    // Check if CRM access is included in their plan
    // Use features from subscription_plans table instead of subscription.features
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('features')
      .eq('id', subscription.plan_id)
      .single();

    if (planError) {
      console.error("Error fetching plan features:", planError);
    } else if (plan && !plan.features?.includes('basic_dashboard')) {
      return NextResponse.json({
        error: "CRM integration not included in your plan",
        upgradeUrl: `/dashboard/finance?feature=crm`
      }, { status: 403 });
    }

    // **Optional: Check CRM connection status if provided**
    // If you want to allow connection even if CRM isn't connected yet (first-time setup)
    // if (connection && !connection.is_crm_active) {
    //   return NextResponse.json({ 
    //     error: "CRM is not connected for this organization" 
    //   }, { status: 404 });
    // }

    // **Generate magic link for THIS user's email**
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
      options: {
        redirectTo: `https://atomic-crm-tau.vercel.app/bridge?org=${organizationId}&user=${userId}`
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // **If CRM is not connected yet, mark it as connected now**
    if (!connection?.is_crm_active) {
      await supabaseAdmin
        .from('organization_connections')
        .upsert({
          organization_id: organizationId,
          is_crm_active: true,
          connected_at: new Date().toISOString(),
          crm_type: 'atomic', // or whatever CRM you're using
          created_by_user_id: userId,
          metadata: {
            connected_via: 'magic_link',
            first_connected_by: userId,
            first_connected_at: new Date().toISOString()
          }
        }, {
          onConflict: 'organization_id'
        });
    }

    // **Log this access for analytics (optional)**
    await supabaseAdmin
      .from('crm_access_logs')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        accessed_at: new Date().toISOString(),
        user_email: userEmail,
        action: connection?.is_crm_active ? 'access' : 'first_connect'
      });

    return NextResponse.json({ 
      url: data.properties.action_link,
      subscription: {
        plan_id: subscription.plan_id,
        status: subscription.status
      },
      // Optionally return updated connection status
      connection_updated: !connection?.is_crm_active
    });

  } catch (error) {
    console.error('CRM auth error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}