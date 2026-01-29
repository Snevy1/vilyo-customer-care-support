// app/api/subscribe-free/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await req.json();
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Verify the organization exists
    /* const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('organization_id', organizationId)
      .limit(1);

    if (profileError || !profile?.[0]) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    } */

    // Check if subscription already exists
    const { data: existingSub, error: checkError } = await supabaseAdmin
      .from('organization_subscriptions')
      .select('id')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking subscription:', checkError);
    }

    if (existingSub) {
      // Update existing subscription to free plan
      const { error: updateError } = await supabaseAdmin
        .from('organization_subscriptions')
        .update({
          plan_id: 'free',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }
    } else {
      // Create new free subscription
      const { error: insertError } = await supabaseAdmin
        .from('organization_subscriptions')
        .insert({
          organization_id: organizationId,
          plan_id: 'free',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { 
            source: 'self_service',
            activated_at: new Date().toISOString()
          }
        });

      if (insertError) {
        console.error('Error creating subscription:', insertError);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Free plan activated successfully' 
    });

  } catch (error) {
    console.error('Subscribe free error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}