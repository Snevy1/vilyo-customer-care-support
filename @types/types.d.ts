type SourceType = "website" | "docs" | "upload" | "text";

type SourceStatus = "active" | "training" | "error" | "excluded";


interface SectionFormData {
    name: string;
    description: string;
    tone: Tone;
    allowedTopics:string;
    blockedTopics: string;
    fallbackBehavior: string;
}

interface Section {
    id: string;
    name: string;
    description: string;
    sourceCount: number;
    source_ids?: string[];
    tone: Tone;
    scopeLabel: string;
    allowed_topics?:string;
    blocked_topics?: string;
    status: SectionStatus;
}


interface LeadInfo {
    first_name?: string; 
    last_name?:string,
     email?:string;
     notes?:string
     phoneNumber?: string;
}

interface NotificationProps{
    email?: string, 
    phone?: string,
    reason:string,
    user_message:string,
    sessionId:string

}

export interface KnowledgeSource {
    id: string;
    user_email: string;
    type:string;
    name:string;
    status: string;
    source_url: string | null;
    content: string | null;
    meta_data: string | null;
    last_updated: string | null;
    created_at: string | null;
}

 type SectionStatus = "active" | "draft" | "disabled";
type Tone = "strict" | "neutral" | "friendly" | "empathetic";






// TypeScript types
export type WhatsAppPlan = typeof whatsAppPlans.$inferSelect;
export type NewWhatsAppPlan = typeof whatsAppPlans.$inferInsert;

// Limits interface for better type safety
export interface WhatsAppPlanLimits {
  messages_per_month?: number;
  whatsapp_numbers?: number;
  ai_responses?: boolean;
  custom_ai_training?: boolean;
  support_type?: 'email' | 'priority' | '24/7';
  analytics?: string[];
  custom_integrations?: boolean;
  max_users?: number;
}



export type WebchatPlan = typeof webchatPlans.$inferSelect;
export type NewWebchatPlan = typeof webchatPlans.$inferInsert;

export interface WebchatPlanLimits {
  max_chats_per_month?: number;
  max_agents?: number;
  ai_automation?: boolean;
  custom_branding?: boolean;
  custom_domains?: number;
  file_sharing?: boolean;
  chat_history_days?: number;
  response_time_guarantee?: boolean;
  priority_support?: boolean;
}



// Pricing


interface PricingCardProps {
  plan: Plan;
  isSelected: boolean;
  onSelect: () => void;
  highlightColor?: string;
  showSavings?: number;
}



interface ProductSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  plans: Plan[];
  selectedPlanId?: string;
  onSelect: (planId: string) => void;
  color: string;
}



interface Plan {
  id: string;
  plan_id: string;
  name: string;
  display_name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: string;
  features: string[];
  product_type: 'webchat' | 'whatsapp' | 'crm' | 'bundle';
  is_popular?: boolean;
  is_default?: boolean;
}

interface SelectedPlan {
  webchat?: string; // plan_id
  whatsapp?: string; // plan_id
  crm?: string; // plan_id
  bundle?: string; // plan_id
}


// Web chat



interface WebChatPlan {
  id: string;
  plan_id: string;
  name: string;
  display_name: string;
  description: string;
  price: number; // In dollars
  currency: string;
  billing_interval: string;
  trial_period_days: number;
  features: string[];
  limits: Record<string, any>;
  max_chats_per_month?: number;
  max_agents?: number;
  ai_automation?: boolean;
  custom_branding?: boolean;
  custom_domains?: number;
  integrations: string[];
  is_active: boolean;
  is_default: boolean;
}

interface WebChatPlanSelectionProps {
  organizationId: string;
  organizationName: string;
  userEmail: string;
  onBack?: () => void;
}