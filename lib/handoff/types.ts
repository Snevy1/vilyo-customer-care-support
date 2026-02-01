
export type ConversationChannel = 'web' | 'whatsapp';
export type ConversationStatus = 'active' | 'human_takeover' | 'resolved' | 'archived';
export type MessageSenderType = 'ai' | 'human' | 'customer' | 'system';
export type HandoffReason = 
  | 'explicit_request' 
  | 'ai_failure' 
  | 'sentiment_negative' 
  | 'complex_issue'
  | 'pricing_inquiry'
  | 'escalation_requested';

export interface HandoffDecision {
  shouldHandoff: boolean;
  reason?: HandoffReason;
  confidence: number;
  context?: string;
}

export interface AgentAssignment {
  agentId: string;
  agentEmail: string;
  assignedAt: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ConversationContext {
  id: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    senderType?: MessageSenderType;
    timestamp: Date;
  }>;
  metadata: Record<string, any>;
}