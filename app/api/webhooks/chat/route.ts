import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { whatsAppTenant, messages as messagesTable, conversation, knowledge_source, supportTickets } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { whatsappClient } from "@/lib/whatsapp/whatsapp-client";
import { generateText, tool, stepCountIs, ToolSet } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import { calculateLeadScoreDynamic } from "@/lib/lead-scoring-dynamic";
import { countConversationTokens } from "@/lib/countConversationTokens";
import { summarizeConversation } from "@/lib/openAI";
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from "@/lib/rate-limiter";
import { sendEmailNotification, sendHotLeadNotification, sendWarmLeadNotification } from "@/lib/email-notifications";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const payload = await req.json();
    
    // Only process actual message events
    if (payload.event !== 'whatsapp.message.created') {
        return NextResponse.json({ received: true });
    }

    const { data } = payload;
    const customerPhone = data.from;
    const phoneNumberId = data.phoneNumberId;
    const userMessage = data.content;

    // 1. Identify Tenant
    const [tenant] = await db
        .select()
        .from(whatsAppTenant)
        .where(eq(whatsAppTenant.whatsappPhoneNumberId, phoneNumberId))
        .limit(1);

    if (!tenant) {
        console.error("Tenant not found for phoneNumberId:", phoneNumberId);
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const orgId = tenant.organization_id;
    const sessionId = customerPhone;

    // 2. Rate Limiting (30 messages per minute per user)
    if (!checkRateLimit(sessionId, 30, 60000)) {
        await whatsappClient.messages.sendText({
            phoneNumberId: phoneNumberId,
            to: customerPhone,
            body: "You're sending messages too quickly. Please slow down."
        });
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    // 3. Persistence: Ensure Conversation exists
    try {
        const [existingConv] = await db
            .select()
            .from(conversation)
            .where(eq(conversation.id, sessionId))
            .limit(1);

        if (!existingConv) {
            await db.insert(conversation).values({
                id: sessionId,
                chatbot_id: tenant.id,
                name: customerPhone,
                organization_id: orgId,
                visitor_ip: "WhatsApp User"
            });
        }

        // Save user message
        await db.insert(messagesTable).values({
            conversation_id: sessionId,
            role: "user",
            content: userMessage,
        });
    } catch (error) {
        console.error("Database Persistence Error:", error);
        // Continue even if persistence fails
    }

    // 4. Fetch Conversation History
    let messages: Array<{ role: 'user' | 'assistant', content: string }> = [];
    try {
        const conversationHistory = await db
            .select()
            .from(messagesTable)
            .where(eq(messagesTable.conversation_id, sessionId))
            .orderBy(messagesTable.created_at);

        messages = conversationHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
        }));
    } catch (error) {
        console.error("Failed to fetch conversation history:", error);
        // Fallback to current message only
        messages = [{ role: 'user', content: userMessage }];
    }

    // 5. RAG Retrieval (if tenant has knowledge sources configured)
    let context = "";
    try {
        // You'll need to link knowledge sources to WhatsApp tenants
        // For now, fetch all knowledge sources for the org (you may want to filter)
        const sources = await db
            .select({ content: knowledge_source.content })
            .from(knowledge_source)
            .where(eq(knowledge_source.organization_id, orgId))
            .limit(10); // Limit to avoid token overflow

        context = sources.map(s => s.content).filter(Boolean).join("\n\n");
    } catch (error) {
        console.error("RAG Retrieval Error:", error);
    }

    // 6. Token Management & Summarization
    const tokenCount = countConversationTokens(messages);
    if (tokenCount > 6000) {
        const recentMessages = messages.slice(-10);
        const olderMessages = messages.slice(0, -10);

        if (olderMessages.length > 0) {
            try {
                const summary = await summarizeConversation(olderMessages);
                context = `PREVIOUS CONVERSATION SUMMARY:\n\n${summary}\n\n` + context;
                messages = recentMessages;
            } catch (error) {
                console.error("Summarization Error:", error);
            }
        }
    }

    // 7. System Prompt (Full version from web bot)
    const systemPrompt = `Your name is Fiona. You are a friendly, human-like customer support specialist.

CRITICAL RULES:
- If asked for your name, always respond with "I'm Fiona".
- If asked for your role, always respond with "I'm a customer support specialist."
- Keep answers EXTREMELY SHORT (max 1-2 sentences) and conversational.
- If the user asks a broad question, DO NOT provide a summary. Instead, ask a friendly clarifying question to understand exactly what they need help with.
- Never dump information. Always conversationally guide the user to the specific answer they need.
- Mirror the user's brevity.

ESCALATION PROTOCOL:
- If you simply DON'T KNOW the answer from the context, or if the user indicates they are unhappy, ask: "Would you like me to create a support ticket for your specific case?"
- If the user says "Yes" or gives permission to create a ticket, ask them their name and email/phone number. Once they provide their details use the 'createLead' tool to save them to the CRM.
- Wait for successful creation of the lead or lack thereof and then MUST call the 'escalateIssue' tool before responding to the user.
- Your reply MUST be: "[ESCALATED] I have created a support ticket. Our specialist team will review your case."

LEAD GENERATION PROTOCOL:
- If a user expresses interest in a product, asks for a demo, or wants someone to contact them, ask for their name and email.
- **IMPORTANT**: When calling 'createLead', analyze the conversation and extract 'intent_keywords' - phrases like "pricing", "demo", "buy", "interested in", etc. Pass these in the intent_keywords array.
- Once they provide their details, use the 'createLead' tool to save them to the CRM.
- After the tool confirms success, tell the user: "I've passed your details to our team. They'll reach out soon!"

Context:
${context}
`;

    // 8. AI Agent with Full Tools
    try {
        const MAX_TOOL_STEPS = 5;

        const tools = {
            createLead: tool({
                description: 'Saves user contact info to the CRM for follow-up.',
                inputSchema: z.object({
                    first_name: z.string().describe('First name'),
                    last_name: z.string().describe('Last name'),
                    email: z.string().email().describe('Email address'),
                    phoneNumber: z.string().optional().describe('Phone Number'),
                    notes: z.string().describe('Context of the inquiry'),
                    intent_keywords: z.array(z.string()).optional().describe('Keywords indicating purchase intent'),
                }),
                execute: async ({ first_name, last_name, email, phoneNumber, notes, intent_keywords }) => {
                    try {
                        const emailDomain = email.split('@')[1];
                        
                        // Use dynamic scoring engine
                        const leadScoreResult = await calculateLeadScoreDynamic({
                            email_domain: emailDomain,
                            phone_provided: !!phoneNumber || !!customerPhone, // WhatsApp always has phone
                            notes,
                            keywords_mentioned: intent_keywords,
                        }, orgId);

                        // Insert lead into database
                        const { error } = await supabaseAdmin.from('contacts').insert({
                            first_name,
                            last_name,
                            email_jsonb: [{ address: email, type: 'work' }],
                            phone_jsonb: [{ address: phoneNumber || customerPhone, type: 'work' }],
                            background: notes,
                            organization_id: orgId,
                            status: 'cold',
                            lead_score: leadScoreResult.score,
                            lead_quality: leadScoreResult.quality,
                        });
                        
                        if (error) {
                            console.error("CRM Insert Error:", error);
                            throw error;
                        }
                        
                        console.log(`Lead scored: ${leadScoreResult.score}/100 (${leadScoreResult.quality})`);
                        console.log('Applied rules:', leadScoreResult.applied_rules);
                        console.log('Reasoning:', leadScoreResult.reasoning);
                        
                        // Send notifications based on quality
                        if (leadScoreResult.quality === 'hot') {
                            await sendHotLeadNotification({
                                organizationEmail: tenant.user_email,
                                leadName: `${first_name} ${last_name}`,
                                leadEmail: email,
                                leadPhone: phoneNumber || customerPhone,
                                notes,
                                score: leadScoreResult.score,
                                reasoning: leadScoreResult.reasoning,
                                sessionId,
                            });
                        } else if (leadScoreResult.quality === 'warm') {
                            await sendWarmLeadNotification({
                                organizationEmail: tenant.user_email,
                                leadName: `${first_name} ${last_name}`,
                                leadEmail: email,
                                score: leadScoreResult.score,
                            });
                        }
                        
                        return { 
                            success: true, 
                            message: "Lead saved successfully",
                            score: leadScoreResult.score,
                            quality: leadScoreResult.quality
                        };
                    } catch (error) {
                        console.error("Lead creation failed:", error);
                        throw new Error("Failed to save lead");
                    }
                }
            }),
            
            escalateIssue: tool({
                description: 'Escalates a conversation to a human support agent.',
                inputSchema: z.object({
                    reason: z.string().describe('Why the issue was escalated'),
                    user_message: z.string().describe("The user's last message"),
                }),
                execute: async ({ reason, user_message }) => {
                    try {
                        // Save ticket
                        await db.insert(supportTickets).values({
                            conversation_id: sessionId,
                            organization_id: orgId,
                            reason,
                            last_message: user_message,
                            status: 'open'
                        });

                        // Send email notification
                        const emailResult = await sendEmailNotification({
                            email: tenant.user_email,
                            reason,
                            user_message,
                            sessionId
                        });

                        if (emailResult.message === "error") {
                            console.error("Email notification failed for escalation:", sessionId);
                        }

                        return { success: true, message: "Ticket created and notification sent" };
                    } catch (error) {
                        console.error("Escalation failed:", error);
                        throw new Error("Failed to escalate issue");
                    }
                }
            })
        } satisfies ToolSet;

        const result = await generateText({
            model: openrouter('openai/gpt-4o-mini'),
            system: systemPrompt,
            messages,
            stopWhen: stepCountIs(MAX_TOOL_STEPS),
            tools
        });

        // 9. Send AI Response via WhatsApp
        await whatsappClient.messages.sendText({
            phoneNumberId: phoneNumberId,
            to: customerPhone,
            body: result.text
        });

        // 10. Save AI Response to Database
        try {
            await db.insert(messagesTable).values({
                conversation_id: sessionId,
                role: "assistant",
                content: result.text,
            });
        } catch (error) {
            console.error("Database Persistence Error (AI):", error);
        }

    } catch (error) {
        console.error("WhatsApp AI Error:", error);
        
        // Send error message to user
        try {
            await whatsappClient.messages.sendText({
                phoneNumberId: phoneNumberId,
                to: customerPhone,
                body: "Sorry, I encountered an error. Please try again."
            });
        } catch (sendError) {
            console.error("Failed to send error message:", sendError);
        }
    }

    return NextResponse.json({ received: true });
}