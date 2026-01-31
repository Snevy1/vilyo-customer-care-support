// lib/seed-default-scoring-rules.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function seedDefaultScoringRules(organizationId: string) {
    const defaultRules = [
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

    const { data, error } = await supabaseAdmin
        .from('lead_scoring_rules')
        .insert(defaultRules);

    if (error) {
        console.error('Failed to seed scoring rules:', error);
        throw error;
    }

    return data;
}