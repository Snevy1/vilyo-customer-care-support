// app/api/lead-scoring-rules/[orgId]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Default scoring rules template
const getDefaultScoringRules = (organizationId: string) => [
    {
        rule_name: 'Corporate Email Domain',
        rule_type: 'email_domain',
        trigger_condition: {
            type: 'not_in_list',
            values: ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
        },
        score_change: 20,
        is_active: true,
        organization_id: organizationId
    },
    {
        rule_name: 'Phone Number Provided',
        rule_type: 'phone_provided',
        trigger_condition: {
            type: 'exists',
            field: 'phone'
        },
        score_change: 15,
        is_active: true,
        organization_id: organizationId
    },
    {
        rule_name: 'Detailed Inquiry',
        rule_type: 'notes_length',
        trigger_condition: {
            type: 'greater_than',
            field: 'notes',
            value: 100
        },
        score_change: 15,
        is_active: true,
        organization_id: organizationId
    },
    {
        rule_name: 'High Intent Keywords - Buy/Purchase',
        rule_type: 'keyword_match',
        trigger_condition: {
            type: 'contains_any',
            field: 'keywords',
            values: ['pricing', 'buy', 'purchase', 'demo', 'quote', 'contract']
        },
        score_change: 25,
        is_active: true,
        organization_id: organizationId
    },
    {
        rule_name: 'Medium Intent Keywords',
        rule_type: 'keyword_match',
        trigger_condition: {
            type: 'contains_any',
            field: 'keywords',
            values: ['learn more', 'interested', 'information', 'details']
        },
        score_change: 15,
        is_active: true,
        organization_id: organizationId
    },
    {
        rule_name: 'Quick Response Time',
        rule_type: 'response_time',
        trigger_condition: {
            type: 'less_than',
            field: 'response_time_seconds',
            value: 30
        },
        score_change: 15,
        is_active: true,
        organization_id: organizationId
    },
    {
        rule_name: 'High Engagement - Multiple Questions',
        rule_type: 'engagement',
        trigger_condition: {
            type: 'greater_than_or_equal',
            field: 'num_questions',
            value: 3
        },
        score_change: 20,
        is_active: true,
        organization_id: organizationId
    }
];

export async function GET(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
    try {

         const { orgId } = await params;
        // First, check if rules exist
        const { data: rules, error: fetchError } = await supabaseAdmin
            .from('lead_scoring_rules')
            .select('*')
            .eq('organization_id', orgId)
            .order('id');

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        // If no rules exist, seed default rules
        if (!rules || rules.length === 0) {
            console.log(`No scoring rules found for org ${orgId }, seeding defaults...`);
            
            const defaultRules = getDefaultScoringRules(orgId);
            
            const { data: seededRules, error: seedError } = await supabaseAdmin
                .from('lead_scoring_rules')
                .insert(defaultRules)
                .select();

            if (seedError) {
                console.error('Failed to seed default scoring rules:', seedError);
                return NextResponse.json({ error: seedError.message }, { status: 500 });
            }

            console.log(`Successfully seeded ${seededRules?.length} default rules for org ${orgId}`);
            
            return NextResponse.json({ 
                rules: seededRules,
                seeded: true // Flag to indicate rules were just created
            });
        }

        return NextResponse.json({ rules, seeded: false });

    } catch (error: any) {
        console.error('Error in lead scoring rules GET:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
    try {
        const { rules } = await req.json();
        const { orgId } = await params;

        if (!rules || !Array.isArray(rules)) {
            return NextResponse.json({ error: 'Invalid rules data' }, { status: 400 });
        }

        // Update each rule
        for (const rule of rules) {
            if (rule.id) {
                const { error: updateError } = await supabaseAdmin
                    .from('lead_scoring_rules')
                    .update({
                        score_change: rule.score_change,
                        is_active: rule.is_active
                    })
                    .eq('id', rule.id)
                    .eq('organization_id',orgId); // Security: ensure org owns the rule

                if (updateError) {
                    console.error(`Failed to update rule ${rule.id}:`, updateError);
                    return NextResponse.json({ error: updateError.message }, { status: 500 });
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error in lead scoring rules PUT:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}