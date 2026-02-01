/* // lib/conversations/conversation-service.ts
import { db } from "@/db/client";
import { conversation, messages, whatsAppTenant } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export interface CreateConversationParams {
  phoneNumber?: string;
  email?: string;
  name?: string;
  organizationId: string;
  chatbotId: string;
  channel: 'web' | 'whatsapp';
  sessionToken?: string;
  visitorIp?: string;
  tenantName?: string;
}

export class ConversationService {
  async findOrCreateWhatsAppConversation(params: {
    phoneNumber: string;
    organizationId: string;
    chatbotId: string;
    tenantName?: string;
  }) {
    // Try to find existing active conversation
    let [existingConv] = await db.select()
      .from(conversation)
      .where(
        and(
          eq(conversation.whatsapp_phone, params.phoneNumber),
          eq(conversation.organization_id, params.organizationId),
          eq(conversation.channel, 'whatsapp'),
          eq(conversation.status, 'active')
        )
      )
      .orderBy(desc(conversation.created_at))
      .limit(1);
    
    // If no active conversation, check for recent resolved ones
    if (!existingConv) {
      [existingConv] = await db.select()
        .from(conversation)
        .where(
          and(
            eq(conversation.whatsapp_phone, params.phoneNumber),
            eq(conversation.organization_id, params.organizationId),
            eq(conversation.channel, 'whatsapp'),
            eq(conversation.status, 'resolved')
          )
        )
        .orderBy(desc(conversation.created_at))
        .limit(1);
      
      // If found resolved conversation, reactivate it
      if (existingConv) {
        await db.update(conversation)
          .set({
            status: 'active',
            updated_at: new Date()
          })
          .where(eq(conversation.id, existingConv.id));
        
        return existingConv;
      }
    }
    
    // Create new conversation
    if (!existingConv) {
      const [newConv] = await db.insert(conversation)
        .values({
          channel: 'whatsapp',
          chatbot_id: params.chatbotId,
          organization_id: params.organizationId,
          whatsapp_phone: params.phoneNumber,
          name: params.tenantName || `WhatsApp: ${params.phoneNumber}`,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();
      
      return newConv;
    }
    
    return existingConv;
  }
  
  async findOrCreateWebConversation(params: {
    sessionToken: string;
    organizationId: string;
    chatbotId: string;
    visitorIp?: string;
    email?: string;
    name?: string;
  }) {
    // Similar logic for web conversations
    let [existingConv] = await db.select()
      .from(conversation)
      .where(
        and(
          eq(conversation.session_token, params.sessionToken),
          eq(conversation.organization_id, params.organizationId),
          eq(conversation.channel, 'web'),
          eq(conversation.status, 'active')
        )
      )
      .limit(1);
    
    if (!existingConv) {
      const [newConv] = await db.insert(conversation)
        .values({
          channel: 'web',
          chatbot_id: params.chatbotId,
          organization_id: params.organizationId,
          session_token: params.sessionToken,
          visitor_ip: params.visitorIp,
          visitor_email: params.email,
          name: params.name || 'Web Visitor',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();
      
      return newConv;
    }
    
    return existingConv;
  }
  
  async incrementAIFailureCount(conversationId: string) {
    // Track AI failures for handoff decisions
    const [conv] = await db.select()
      .from(conversation)
      .where(eq(conversation.id, conversationId));
    
    const currentFailures = parseInt(conv.metadata?.ai_failures || '0');
    
    await db.update(conversation)
      .set({
        metadata: {
          ...conv.metadata,
          ai_failures: (currentFailures + 1).toString(),
          last_ai_failure: new Date().toISOString()
        },
        updated_at: new Date()
      })
      .where(eq(conversation.id, conversationId));
  }
  
  async notifyAgentNewMessage(conversationId: string, message: string) {
    // Get conversation details
    const [conv] = await db.select()
      .from(conversation)
      .where(eq(conversation.id, conversationId));
    
    if (!conv?.assigned_to) return;
    
    // Real-time notification logic here
    // This would connect to your WebSocket/SSE system
    console.log(`Notify agent ${conv.assigned_to}: New message in conversation ${conversationId}`);
  }
  
  async getConversationMessages(conversationId: string, limit: number = 50) {
    return await db.select()
      .from(messages)
      .where(eq(messages.conversation_id, conversationId))
      .orderBy(desc(messages.created_at))
      .limit(limit);
  }
  
  async updateConversationStatus(
    conversationId: string, 
    status: 'active' | 'human_takeover' | 'resolved' | 'archived',
    assignedTo?: string
  ) {
    const updateData: any = {
      status,
      updated_at: new Date()
    };
    
    if (assignedTo !== undefined) {
      updateData.assigned_to = assignedTo;
    }
    
    await db.update(conversation)
      .set(updateData)
      .where(eq(conversation.id, conversationId));
  }
} */