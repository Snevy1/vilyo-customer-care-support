// lib/lead-scoring-dynamic.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface LeadScoringFactors {
  email_domain?: string;
  phone_provided: boolean;
  notes?: string;
  response_time_seconds?: number;
  num_questions_asked?: number;
  keywords_mentioned?: string[];
}

interface ScoringRule {
  id: number;
  rule_name: string;
  rule_type: string;
  trigger_condition: any;
  score_change: number;
  is_active: boolean;
}

// Default scoring rules template
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

    try {
        const { data, error } = await supabaseAdmin
            .from('lead_scoring_rules')
            .insert(defaultRules)
            .select();

        if (error) {
            console.error('Failed to seed default scoring rules:', error);
            throw error;
        }

        console.log(`Successfully seeded ${data?.length} default rules for org ${organizationId}`);
        return data;
    } catch (error) {
        console.error('Error seeding default rules:', error);
        throw error;
    }
}

export async function calculateLeadScoreDynamic(
  factors: LeadScoringFactors,
  organizationId: string,
  retried = false
): Promise<{
  score: number;
  quality: 'hot' | 'warm' | 'cold' | 'unqualified';
  reasoning: string[];
  applied_rules: string[];
}> {
  let score = 0;
  const reasoning: string[] = [];
  const applied_rules: string[] = [];

  try {
    // Fetch active scoring rules for this organization
    const { data: rules, error } = await supabaseAdmin
      .from('lead_scoring_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to fetch scoring rules:', error);
      return calculateLeadScoreFallback(factors);
    }

    // If no rules exist and we haven't retried yet, seed defaults
    if (!rules || rules.length === 0) {
      if (!retried) {
        console.log(`No scoring rules found for org ${organizationId}, seeding defaults...`);
        await seedDefaultScoringRules(organizationId);
        // Retry once with the newly seeded rules
        return calculateLeadScoreDynamic(factors, organizationId, true);
      }
      // If retry also failed, use fallback
      console.warn('Failed to seed or fetch rules, using fallback scoring');
      return calculateLeadScoreFallback(factors);
    }

    // Apply each rule
    for (const rule of rules as ScoringRule[]) {
      const ruleApplied = evaluateRule(rule, factors);
      
      if (ruleApplied) {
        score += rule.score_change;
        reasoning.push(`${rule.rule_name} (${rule.score_change > 0 ? '+' : ''}${rule.score_change})`);
        applied_rules.push(rule.rule_name);
      }
    }

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Determine quality based on score
    let quality: 'hot' | 'warm' | 'cold' | 'unqualified';
    if (score >= 70) {
      quality = 'hot';
    } else if (score >= 40) {
      quality = 'warm';
    } else if (score >= 20) {
      quality = 'cold';
    } else {
      quality = 'unqualified';
    }

    return { score, quality, reasoning, applied_rules };
    
  } catch (error) {
    console.error("Critical scoring failure:", error);
    return calculateLeadScoreFallback(factors);  
  }
}

function evaluateRule(rule: ScoringRule, factors: LeadScoringFactors): boolean {
  const condition = rule.trigger_condition;

  try {
    switch (rule.rule_type) {
      case 'email_domain':
        if (!factors.email_domain) return false;
        
        if (condition.type === 'not_in_list') {
          return !condition.values.includes(factors.email_domain.toLowerCase());
        }
        if (condition.type === 'in_list') {
          return condition.values.includes(factors.email_domain.toLowerCase());
        }
        break;

      case 'phone_provided':
        return factors.phone_provided;

      case 'notes_length':
        if (!factors.notes) return false;
        
        if (condition.type === 'greater_than') {
          return factors.notes.length > condition.value;
        }
        if (condition.type === 'less_than') {
          return factors.notes.length < condition.value;
        }
        break;

      case 'keyword_match':
        if (!factors.keywords_mentioned || factors.keywords_mentioned.length === 0) return false;
        
        if (condition.type === 'contains_any') {
          return factors.keywords_mentioned.some(keyword =>
            condition.values.some((condKeyword: string) =>
              keyword.toLowerCase().includes(condKeyword.toLowerCase())
            )
          );
        }
        if (condition.type === 'contains_all') {
          return condition.values.every((condKeyword: string) =>
            factors.keywords_mentioned?.some(keyword =>
              keyword.toLowerCase().includes(condKeyword.toLowerCase())
            )
          );
        }
        break;

      case 'response_time':
        if (factors.response_time_seconds === undefined) return false;
        
        if (condition.type === 'less_than') {
          return factors.response_time_seconds < condition.value;
        }
        if (condition.type === 'greater_than') {
          return factors.response_time_seconds > condition.value;
        }
        break;

      case 'engagement':
        if (factors.num_questions_asked === undefined) return false;
        
        if (condition.type === 'greater_than_or_equal') {
          return factors.num_questions_asked >= condition.value;
        }
        if (condition.type === 'greater_than') {
          return factors.num_questions_asked > condition.value;
        }
        if (condition.type === 'equals') {
          return factors.num_questions_asked === condition.value;
        }
        break;

      default:
        console.warn(`Unknown rule type: ${rule.rule_type}`);
        return false;
    }
  } catch (error) {
    console.error(`Error evaluating rule ${rule.rule_name}:`, error);
    return false;
  }

  return false;
}

// Fallback to hardcoded scoring if database rules fail
function calculateLeadScoreFallback(factors: LeadScoringFactors): {
  score: number;
  quality: 'hot' | 'warm' | 'cold' | 'unqualified';
  reasoning: string[];
  applied_rules: string[];
} {
  let score = 0;
  const reasoning: string[] = [];
  const applied_rules: string[] = [];

  console.warn('Using fallback lead scoring (database rules unavailable)');

  // Email domain scoring
  if (factors.email_domain) {
    const freeEmailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    if (!freeEmailProviders.includes(factors.email_domain.toLowerCase())) {
      score += 20;
      reasoning.push('Corporate email domain (+20)');
      applied_rules.push('Corporate Email Domain');
    } else {
      score += 5;
      reasoning.push('Personal email domain (+5)');
      applied_rules.push('Personal Email');
    }
  }

  // Phone number provided
  if (factors.phone_provided) {
    score += 15;
    reasoning.push('Phone number provided (+15)');
    applied_rules.push('Phone Number Provided');
  }

  // Engagement level from notes
  if (factors.notes) {
    const notesLength = factors.notes.length;
    if (notesLength > 100) {
      score += 15;
      reasoning.push('Detailed inquiry (+15)');
      applied_rules.push('Detailed Inquiry');
    } else if (notesLength > 30) {
      score += 10;
      reasoning.push('Moderate inquiry (+10)');
      applied_rules.push('Moderate Inquiry');
    } else {
      score += 5;
      reasoning.push('Brief inquiry (+5)');
      applied_rules.push('Brief Inquiry');
    }
  }

  // Response time
  if (factors.response_time_seconds !== undefined) {
    if (factors.response_time_seconds < 30) {
      score += 15;
      reasoning.push('Quick responses (+15)');
      applied_rules.push('Quick Response Time');
    } else if (factors.response_time_seconds < 120) {
      score += 10;
      reasoning.push('Moderate response time (+10)');
      applied_rules.push('Moderate Response Time');
    }
  }

  // Number of questions asked
  if (factors.num_questions_asked !== undefined) {
    if (factors.num_questions_asked >= 3) {
      score += 20;
      reasoning.push('Highly engaged (3+ questions) (+20)');
      applied_rules.push('High Engagement');
    } else if (factors.num_questions_asked >= 2) {
      score += 10;
      reasoning.push('Engaged (2+ questions) (+10)');
      applied_rules.push('Moderate Engagement');
    }
  }

  // Intent keywords
  if (factors.keywords_mentioned && factors.keywords_mentioned.length > 0) {
    const highIntentKeywords = ['pricing', 'demo', 'trial', 'buy', 'purchase', 'quote', 'contract'];
    const mediumIntentKeywords = ['learn more', 'interested', 'information', 'details'];
    
    const hasHighIntent = factors.keywords_mentioned.some(k => 
      highIntentKeywords.some(hik => k.toLowerCase().includes(hik))
    );
    
    const hasMediumIntent = factors.keywords_mentioned.some(k => 
      mediumIntentKeywords.some(mik => k.toLowerCase().includes(mik))
    );

    if (hasHighIntent) {
      score += 25;
      reasoning.push('High purchase intent keywords (+25)');
      applied_rules.push('High Intent Keywords');
    } else if (hasMediumIntent) {
      score += 15;
      reasoning.push('Medium interest keywords (+15)');
      applied_rules.push('Medium Intent Keywords');
    }
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine quality based on score
  let quality: 'hot' | 'warm' | 'cold' | 'unqualified';
  if (score >= 70) {
    quality = 'hot';
  } else if (score >= 40) {
    quality = 'warm';
  } else if (score >= 20) {
    quality = 'cold';
  } else {
    quality = 'unqualified';
  }

  return { score, quality, reasoning, applied_rules };
}