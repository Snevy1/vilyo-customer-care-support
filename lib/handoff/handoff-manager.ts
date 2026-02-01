/* 
import { db } from "@/db/client";
import { conversation, messages, team_members } from "@/db/schema";
import { eq, and, desc, or, count, gt, lt } from "drizzle-orm";
import { HandoffDecision, HandoffReason, ConversationChannel } from "./types";
import { AgentManager } from "./agent-manager";

export class HandoffManager {
  private agentManager = new AgentManager();
  
  async evaluateHandoff(
    conversationId: string, 
    userMessage: string
  ): Promise<HandoffDecision> {
    const ctx = await this.getConversationContext(conversationId);
    
    // Rule 1: Explicit human request (highest priority)
    if (this.detectExplicitHumanRequest(userMessage)) {
      return {
        shouldHandoff: true,
        reason: 'explicit_request',
        confidence: 0.95,
        context: `User explicitly requested human: "${userMessage}"`
      };
    }
    
    // Rule 2: Check conversation history for previous handoff attempts
    const handoffHistory = await this.getHandoffHistory(conversationId);
    if (handoffHistory.attempts > 2) {
      return {
        shouldHandoff: true,
        reason: 'ai_failure',
        confidence: 0.85,
        context: `Multiple AI attempts (${handoffHistory.attempts}) failed`
      };
    }
    
    // Rule 3: Negative sentiment detection
    if (this.detectNegativeSentiment(userMessage)) {
      const sentimentScore = this.analyzeSentiment(userMessage);
      if (sentimentScore < -0.3) {
        return {
          shouldHandoff: true,
          reason: 'sentiment_negative',
          confidence: 0.75,
          context: `Negative sentiment detected (score: ${sentimentScore})`
        };
      }
    }
    
    // Rule 4: Complex inquiry detection
    const complexityScore = await this.analyzeComplexity(conversationId, userMessage);
    if (complexityScore > 0.7) {
      return {
        shouldHandoff: true,
        reason: 'complex_issue',
        confidence: 0.65,
        context: `Complex inquiry detected (score: ${complexityScore})`
      };
    }
    
    // Rule 5: Channel-specific rules
    if (ctx.channel === 'whatsapp') {
      const whatsappHandoff = await this.evaluateWhatsAppHandoff(ctx, userMessage);
      if (whatsappHandoff.shouldHandoff) return whatsappHandoff;
    }
    
    // Default: No handoff needed
    return {
      shouldHandoff: false,
      confidence: 0.9,
      context: 'AI can handle this request'
    };
  }
  
  async executeHandoff(
    conversationId: string, 
    reason: HandoffReason,
    context?: string
  ): Promise<{ success: boolean; assignedTo?: string; message: string }> {
    try {
      // 1. Update conversation status
      const [updated] = await db.update(conversation)
        .set({
          status: 'human_takeover',
          updated_at: new Date()
        })
        .where(eq(conversation.id, conversationId))
        .returning();
      
      if (!updated) {
        throw new Error('Conversation not found');
      }
      
      // 2. Assign to available agent
      const assignment = await this.agentManager.assignAgent(
        conversationId,
        updated.organization_id,
        reason
      );
      
      // 3. Add system message
      await db.insert(messages).values({
        conversation_id: conversationId,
        role: 'system',
        content: `HANDOFF: ${reason} - ${context || 'No additional context'}`,
        metadata: {
          handoff: {
            reason,
            context,
            assignedTo: assignment.agentId,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      // 4. Notify agent
      await this.agentManager.notifyAgent(assignment.agentId, {
        conversationId,
        customerInfo: {
          name: updated.name,
          phone: updated.whatsapp_phone,
          email: updated.visitor_email
        },
        reason,
        context
      });
      
      // 5. Update conversation with agent assignment
      await db.update(conversation)
        .set({
          assigned_to: assignment.agentId,
          updated_at: new Date()
        })
        .where(eq(conversation.id, conversationId));
      
      return {
        success: true,
        assignedTo: assignment.agentId,
        message: `Handoff successful. Assigned to agent: ${assignment.agentEmail}`
      };
      
    } catch (error) {
      console.error('Handoff execution failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Handoff failed'
      };
    }
  }
  
  async returnToAI(
    conversationId: string,
    agentId: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify agent owns this conversation
      const [conv] = await db.select()
        .from(conversation)
        .where(
          and(
            eq(conversation.id, conversationId),
            eq(conversation.assigned_to, agentId),
            eq(conversation.status, 'human_takeover')
          )
        );
      
      if (!conv) {
        return {
          success: false,
          message: 'Conversation not assigned to this agent or not in human takeover state'
        };
      }
      
      // Update conversation
      await db.update(conversation)
        .set({
          status: 'active',
          assigned_to: null,
          updated_at: new Date()
        })
        .where(eq(conversation.id, conversationId));
      
      // Add handback message
      await db.insert(messages).values({
        conversation_id: conversationId,
        role: 'system',
        content: `HANDBACK: Returned to AI - ${notes || 'Agent completed assistance'}`,
        metadata: {
          handback: {
            agentId,
            notes,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      // Notify AI system (optional)
      await this.notifyAIResume(conversationId);
      
      return {
        success: true,
        message: 'Successfully returned conversation to AI'
      };
      
    } catch (error) {
      console.error('Return to AI failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Return to AI failed'
      };
    }
  }
  
  // Helper methods
  private detectExplicitHumanRequest(message: string): boolean {
    const triggers = [
      'talk to human',
      'real person',
      'representative',
      'agent',
      'operator',
      'customer service',
      'support person',
      'live agent',
      'human being',
      'can I speak with'
    ];
    
    const lowerMessage = message.toLowerCase();
    return triggers.some(trigger => lowerMessage.includes(trigger));
  }
  
  private detectNegativeSentiment(message: string): boolean {
    const negativeWords = [
      'angry', 'frustrated', 'annoyed', 'upset', 'disappointed',
      'terrible', 'awful', 'horrible', 'bad', 'poor',
      'not working', 'broken', 'failed', 'useless', 'worthless'
    ];
    
    const lowerMessage = message.toLowerCase();
    return negativeWords.some(word => lowerMessage.includes(word));
  }
  
  private analyzeSentiment(message: string): number {
    // Simple sentiment analysis - implement with NLP library in production
    const positive = ['good', 'great', 'excellent', 'thanks', 'thank you', 'helpful'];
    const negative = ['bad', 'terrible', 'awful', 'horrible', 'useless'];
    
    let score = 0;
    const words = message.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      if (positive.includes(word)) score += 0.1;
      if (negative.includes(word)) score -= 0.1;
    });
    
    return Math.max(-1, Math.min(1, score));
  }
  
  private async getConversationContext(conversationId: string) {
    const [conv] = await db.select()
      .from(conversation)
      .where(eq(conversation.id, conversationId));
    
    const messageHistory = await db.select()
      .from(messages)
      .where(eq(messages.conversation_id, conversationId))
      .orderBy(desc(messages.created_at))
      .limit(20);
    
    return {
      ...conv,
      messages: messageHistory.reverse()
    };
  }
  
  private async getHandoffHistory(conversationId: string) {
    const handoffMessages = await db.select()
      .from(messages)
      .where(
        and(
          eq(messages.conversation_id, conversationId),
          eq(messages.role, 'system'),
          messages.content.like('HANDOFF:%')
        )
      );
    
    return {
      attempts: handoffMessages.length,
      lastAttempt: handoffMessages[0]?.created_at
    };
  }
  
  private async analyzeComplexity(conversationId: string, message: string): Promise<number> {
    // Analyze conversation complexity
    const [conv] = await db.select()
      .from(conversation)
      .where(eq(conversation.id, conversationId));
    
    const messageCount = await db.$count(
      messages,
      eq(messages.conversation_id, conversationId)
    );
    
    const complexityKeywords = [
      'refund', 'cancel', 'billing', 'invoice', 'pricing',
      'contract', 'legal', 'complaint', 'escalate', 'manager'
    ];
    
    let score = 0;
    const lowerMessage = message.toLowerCase();
    
    // Message count complexity
    score += Math.min(0.3, messageCount * 0.01);
    
    // Keyword complexity
    complexityKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) score += 0.1;
    });
    
    // Length complexity
    if (message.length > 200) score += 0.2;
    
    return Math.min(1, score);
  }
  
  private async evaluateWhatsAppHandoff(ctx: any, message: string) {
    // WhatsApp-specific handoff rules
    const whatsappTriggers = [
      'call me', 'phone call', 'ring me', 'speak with',
      'urgent', 'asap', 'immediately', 'now'
    ];
    
    const lowerMessage = message.toLowerCase();
    const hasWhatsAppTrigger = whatsappTriggers.some(t => lowerMessage.includes(t));
    
    if (hasWhatsAppTrigger) {
      return {
        shouldHandoff: true,
        reason: 'escalation_requested',
        confidence: 0.8,
        context: 'WhatsApp-specific escalation trigger'
      };
    }
    
    return {
      shouldHandoff: false,
      confidence: 0.9
    };
  }
  
  private async notifyAIResume(conversationId: string) {
    // Could trigger webhook or update cache
    console.log(`AI resume notified for conversation: ${conversationId}`);
  }
} */