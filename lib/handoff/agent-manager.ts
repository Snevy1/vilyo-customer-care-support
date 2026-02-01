/* // lib/handoff/agent-manager.ts
import { db } from "@/db/client";
import { team_members, conversation } from "@/db/schema";
import { eq, and, asc, count, or } from "drizzle-orm";
import { HandoffReason } from "./types";

export interface AgentNotification {
  conversationId: string;
  customerInfo: {
    name?: string;
    phone?: string;
    email?: string;
  };
  reason: HandoffReason;
  context?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export class AgentManager {
  async assignAgent(
    conversationId: string,
    organizationId: string,
    reason: HandoffReason
  ): Promise<{ agentId: string; agentEmail: string; priority: string }> {
    // 1. Get available agents for this organization
    const availableAgents = await db.select()
      .from(team_members)
      .where(
        and(
          eq(team_members.organization_id, organizationId),
          eq(team_members.status, 'active'),
          or(
            eq(team_members.role, 'admin'),
            eq(team_members.role, 'support'),
            eq(team_members.role, 'agent')
          )
        )
      );
    
    if (availableAgents.length === 0) {
      // Fallback to organization owner
      const [owner] = await db.select()
        .from(team_members)
        .where(
          and(
            eq(team_members.organization_id, organizationId),
            eq(team_members.role, 'admin')
          )
        );
      
      if (!owner) {
        throw new Error('No agents available for assignment');
      }
      
      return {
        agentId: owner.id,
        agentEmail: owner.user_email,
        priority: this.determinePriority(reason)
      };
    }
    
    // 2. Load balancing: find agent with least active conversations
    const agentWorkloads = await Promise.all(
      availableAgents.map(async agent => {
        const activeCount = await db.$count(
          conversation,
          and(
            eq(conversation.organization_id, organizationId),
            eq(conversation.assigned_to, agent.id),
            eq(conversation.status, 'human_takeover')
          )
        );
        
        return { agent, activeCount };
      })
    );
    
    // 3. Sort by workload (least busy first)
    agentWorkloads.sort((a, b) => a.activeCount - b.activeCount);
    
    const selectedAgent = agentWorkloads[0].agent;
    
    return {
      agentId: selectedAgent.id,
      agentEmail: selectedAgent.user_email,
      priority: this.determinePriority(reason)
    };
  }
  
  async notifyAgent(agentId: string, notification: AgentNotification) {
    const [agent] = await db.select()
      .from(team_members)
      .where(eq(team_members.id, agentId));
    
    if (!agent) {
      throw new Error('Agent not found');
    }
    
    // 1. Store notification in database
    await db.insert(messages).values({
      conversation_id: notification.conversationId,
      role: 'system',
      content: `AGENT_NOTIFICATION: New conversation assigned - ${notification.reason}`,
      metadata: {
        notification: {
          ...notification,
          agentId,
          timestamp: new Date().toISOString()
        }
      }
    });
    
    // 2. Send real-time notification (WebSocket/SSE)
    await this.sendRealtimeNotification(agent.user_email, notification);
    
    // 3. Send email notification (optional)
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      await this.sendEmailNotification(agent.user_email, notification);
    }
    
    console.log(`Agent ${agent.user_email} notified of new conversation`);
  }
  
  async getAgentConversations(agentEmail: string, organizationId: string) {
    const [agent] = await db.select()
      .from(team_members)
      .where(
        and(
          eq(team_members.user_email, agentEmail),
          eq(team_members.organization_id, organizationId)
        )
      );
    
    if (!agent) {
      return [];
    }
    
    return await db.select()
      .from(conversation)
      .where(
        and(
          eq(conversation.organization_id, organizationId),
          eq(conversation.assigned_to, agent.id),
          eq(conversation.status, 'human_takeover')
        )
      )
      .orderBy(asc(conversation.updated_at));
  }
  
  async updateAgentStatus(agentId: string, status: 'available' | 'busy' | 'offline') {
    // Update agent status in real-time system
    // This could be stored in Redis or database
    console.log(`Agent ${agentId} status updated to: ${status}`);
  }
  
  private determinePriority(reason: HandoffReason): string {
    const priorityMap: Record<HandoffReason, string> = {
      'explicit_request': 'high',
      'sentiment_negative': 'urgent',
      'ai_failure': 'medium',
      'complex_issue': 'medium',
      'pricing_inquiry': 'high',
      'escalation_requested': 'urgent'
    };
    
    return priorityMap[reason] || 'medium';
  }
  
  private async sendRealtimeNotification(agentEmail: string, notification: AgentNotification) {
    // Implement with WebSockets or Server-Sent Events
    // Example with WebSocket:
    // websocketServer.clients.forEach(client => {
    //   if (client.agentEmail === agentEmail) {
    //     client.send(JSON.stringify({
    //       type: 'new_conversation',
    //       data: notification
    //     }));
    //   }
    // });
  }
  
  private async sendEmailNotification(agentEmail: string, notification: AgentNotification) {
    // Send email using your email service
    console.log(`Email sent to ${agentEmail} about new conversation`);
  }
} */