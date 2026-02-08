import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { whatsAppTenant, messages as messagesTable, conversation, knowledge_source, supportTickets, appointments, organizations, sections } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
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
import { checkGoogleCalendarSlot, createGoogleCalendarEvent, getAlternativeSlots, getOrgGoogleAuth } from "@/lib/appointments/google-calendar";
import { notifyOwner } from "@/lib/notifications/notifications";

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {

    const text = await req.text();

    if (!text) {
        return NextResponse.json({ message: "Empty body received" }, { status: 200 });
    }
    let payload;
    try {
        payload = JSON.parse(text);
    } catch (e) {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Kapso sends the message details inside the 'message' and 'conversation' keys
    const messageData = payload.message;
    const conversationData = payload.conversation;

    // Check if this is actually a message (to avoid errors on other hook types)
    if (!messageData || !messageData.from) {
        console.log("No message data found in payload");
        return NextResponse.json({ received: true });
    }
    
    

    const customerPhone = messageData.from; // "254746358820"
    const phoneNumberId = payload.phone_number_id; // "597907523413541"
    const userMessage = messageData.text?.body || ""; // "Kuku"
    const contactName = conversationData?.contact_name || "";

    console.log(`Processing message from ${customerPhone} for tenant ${phoneNumberId}`);

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

    // 2. Fetch the "Active" Knowledge Section for this Organization
// We look for sections owned by the user who owns this organization
const [activeSection] = await db
    .select()
    .from(sections)
    .where(and(
        eq(sections.user_email, tenant.email), // Mapping back to the owner
        eq(sections.status, 'active')         // Only use the active knowledge
    ))
    .limit(1);

    const sourceIds = activeSection?.source_ids || [];

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
                contact_name: contactName,
                visitor_ip: "WhatsApp User",
                is_human_takeover: false, // Default to bot mode
            });
        }

        // Save user message FIRST
        await db.insert(messagesTable).values({
            conversation_id: sessionId,
            role: "user",
            content: userMessage,
        });

        // ========================================
        // HUMAN TAKEOVER CHECK
        // ========================================
        const [currentConv] = await db
            .select()
            .from(conversation)
            .where(eq(conversation.id, sessionId))
            .limit(1);

        if (currentConv?.is_human_takeover) {
            console.log(`[HUMAN MODE] Conversation ${sessionId} is in human takeover. Bot skipping.`);
            

try {
       await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/socket/emit`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
               event: `org_${orgId}_escalation`,
               payload: { sessionId, reason: 'Human takeover', user_message: 'Message saved. Awaiting human response.' }
           })
       });
   } catch (socketError) {
       console.error('Socket emit failed:', socketError);
       // Don't throw - this is non-critical
   }
            
            
            return NextResponse.json({ 
                received: true, 
                mode: 'human_takeover',
                message: 'Message saved. Awaiting human response.'
            });
        }

        // Check if bot is globally disabled for this tenant
        if (tenant.bot_enabled === false) {
            console.log(`[BOT DISABLED] Tenant ${tenant.id} has bot disabled globally.`);
            return NextResponse.json({ 
                received: true, 
                mode: 'bot_disabled',
                message: 'Bot is disabled for this tenant.'
            });
        }

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
        messages = [{ role: 'user', content: userMessage }];
    }

    // 5. RAG Retrieval 
    let context = "";

        if (sourceIds.length > 0) {
    const sources = await db
        .select({ content: knowledge_source.content })
        .from(knowledge_source)
        .where(inArray(knowledge_source.id, sourceIds));
    
    context = sources.map((s) => s.content).filter(Boolean).join("\n\n");
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

    // 7. System Prompt
     const systemPrompt = `Your name is Fiona, a friendly customer support specialist.

CRITICAL PROTOCOLS:
1. LEAD-FIRST BOOKING: Before calling 'bookAppointment', you MUST call 'createLead' first. Get name/email, save to CRM, then book.
2. PROACTIVE CAPTURE: If user asks about pricing, demos,  services, expresses interest in a product or wants someone to contact them, get their details and call 'createLead' immediately. Extract intent keywords like "pricing", "demo", "buy".- **IMPORTANT**: When calling 'createLead', analyze the conversation and extract 'intent_keywords' - phrases like "pricing", "demo", "buy", "interested in", etc. Pass these in the intent_keywords array.
3. ESCALATION: If you don't know the answer or user is unhappy, ask: "Would you like me to create a support ticket?" If yes, get their details name/email/phone(mostly both), call 'createLead', then MUST call 'escalateIssue'. Reply: "[ESCALATED] Support ticket created. Our team will review your case."
4. ERROR HANDLING: If any tool fails, apologize gracefully: "I'm having trouble with [system], but I've saved your details and our team will follow up manually!"

STYLE: Max 1-2 sentences. Be proactive and conversational.

Context:
${context}`;

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
                        
                        const leadScoreResult = await calculateLeadScoreDynamic({
                            email_domain: emailDomain,
                            phone_provided: !!phoneNumber || !!customerPhone,
                            notes,
                            keywords_mentioned: intent_keywords,
                        }, orgId);

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
                            return {
                                success: false,
                                message: "I'm having trouble saving your information to our system right now. But don't worry - I've noted your details and our team will reach out to you manually!",
                                error_type: "database_error"
                            };
                        }
                        
                        console.log(`Lead scored: ${leadScoreResult.score}/100 (${leadScoreResult.quality})`);
                        
                        if (leadScoreResult.quality === 'hot') {
                            try {
                                await sendHotLeadNotification({
                                    organizationEmail: tenant.email,
                                    leadName: `${first_name} ${last_name}`,
                                    leadEmail: email,
                                    leadPhone: phoneNumber || customerPhone,
                                    notes,
                                    score: leadScoreResult.score,
                                    reasoning: leadScoreResult.reasoning,
                                    sessionId,
                                });

                                await notifyOwner({
           orgId,
           type: 'LEAD_GENERATED',
           title: '🔥 Hot Lead Captured!',
           message: `${first_name} ${last_name} (${email}) - Score: ${leadScoreResult.score}/100`,
           data: {
               lead_name: `${first_name} ${last_name}`,
               email,
               phone: phoneNumber,
               score: leadScoreResult.score,
               reasoning: leadScoreResult.reasoning,
           }
       });
                            } catch (notifError) {
                                console.error("Hot lead notification failed:", notifError);
                                // Continue - lead was saved successfully
                            }
                        } else if (leadScoreResult.quality === 'warm') {
                            try {
                                await sendWarmLeadNotification({
                                    organizationEmail: tenant.email,
                                    leadName: `${first_name} ${last_name}`,
                                    leadEmail: email,
                                    score: leadScoreResult.score,
                                });
                            } catch (notifError) {
                                console.error("Warm lead notification failed:", notifError);
                                // Continue - lead was saved successfully
                            }
                        }
                        
                        return { 
                            success: true, 
                            message: "Lead saved successfully",
                            score: leadScoreResult.score,
                            quality: leadScoreResult.quality
                        };
                    } catch (error) {
                        console.error("Lead creation failed:", error);
                        return {
                            success: false,
                            message: "I'm having trouble connecting to our CRM right now. However, I've noted your interest and our team will follow up with you shortly!",
                            error_type: "crm_failure"
                        };
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

            // AUTOMATICALLY ENABLE HUMAN TAKEOVER
            await db
                .update(conversation)
                .set({ is_human_takeover: true })
                .where(eq(conversation.id, sessionId));

            // Send email notification
            try {
                const emailResult = await sendEmailNotification({
                    email: tenant.email,
                    reason,
                    user_message,
                    sessionId
                });

                if (emailResult.message === "error") {
                    console.error("Email notification failed for escalation:", sessionId);
                    // Continue - ticket was still created
                }
            } catch (emailError) {
                console.error("Email notification error:", emailError);
                // Continue - ticket was still created
            }

            
            try {
                await notifyOwner({
                    orgId,
                    type: 'ESCALATION',
                    title: `Support Escalation: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}`,
                    message: `A conversation has been escalated.\n\nReason: ${reason}\n\nUser's last message: ${user_message}`,
                    data: {
                        sessionId,
                        conversation_id: sessionId,
                        reason,
                        user_message
                    }
                });
            } catch (notifyError) {
                console.error("Failed to notify owner via socket:", notifyError);
                // Don't fail the escalation if notification fails
            }

            return { success: true, message: "Ticket created and human takeover enabled" };
        } catch (error) {
            console.error("Escalation failed:", error);
            return {
                success: false,
                message: "I'm having trouble creating a support ticket right now, but I want to make sure you get help. Could you please email our support team directly? I apologize for the inconvenience!",
                error_type: "escalation_failure"
            };
        }
    }
}),
              bookAppointment: tool({
              description: 'Books an appointment with the business',
              inputSchema: z.object({
                customer_name: z.string().describe('Full name of the customer'),
                customer_email: z.string().email().describe('Email address for confirmation'),
                customer_phone: z.string().optional().describe('Phone number for reminders'),
                preferred_date: z.string().describe('Preferred date in YYYY-MM-DD format'),
                preferred_time: z.string().describe('Preferred time in HH:MM format (24-hour)'),
                service_type: z.string().describe('Type of service: demo, consultation, support, etc.'),
                duration_minutes: z.number().default(30).describe('Duration of appointment in minutes'),
                notes: z.string().optional().describe('Additional notes or requirements')
              }),
              execute: async (input) => {
                try {
                    if (!orgId) {
                      return { 
                          success: false, 
                          message: "I'm having trouble identifying your organization. I've saved your details though, and someone will reach out to schedule your appointment!",
                          error_type: "org_not_found"
                      };
                    }
                
                    // 1. Fetch Org and Timezone
                    const org = await db.query.organizations.findFirst({
                      where: eq(organizations.id, orgId),
                    });
                
                    if (!org) {
                        return { 
                            success: false, 
                            message: "I'm having trouble accessing organization settings. Don't worry - I've saved your information and our team will contact you to schedule manually!",
                            error_type: "org_fetch_failed"
                        };
                    }
                    const timezone = org.timezone || 'UTC'; 
                
                    // 2. Get organization's Google auth
                    const auth = await getOrgGoogleAuth(orgId);
                    if (!auth) {
                      return { 
                        success: false, 
                        message: "Our calendar system isn't connected right now. I've saved your details and our team will reach out to schedule your appointment manually!",
                        error_type: "calendar_not_connected"
                      };
                    }
                
                    // 3. Check availability using the Org's timezone
                    const isAvailable = await checkGoogleCalendarSlot(
                      auth,
                      input.preferred_date, 
                      input.preferred_time,
                      timezone,
                      input.duration_minutes
                    );
                    
                    if (!isAvailable) {
                      // Use the improved single-call alternative slot helper
                      try {
                          const alternatives = await getAlternativeSlots(
                            auth,
                            input.preferred_date,
                            timezone,
                            input.duration_minutes
                          );
                          
                          const altMessage = alternatives.length > 0 
                            ? `I'm sorry, that time is taken. How about one of these?\n${alternatives.map(alt => `• ${alt.time}`).join('\n')}`
                            : "That slot is unavailable. Could you try a different date?";
                          
                          return { 
                            success: false, 
                            message: altMessage,
                            alternatives
                          };
                      } catch (altError) {
                          console.error("Alternative slots fetch failed:", altError);
                          return {
                              success: false,
                              message: "That time slot appears to be taken, but I'm having trouble checking alternatives. Could you suggest a different time, or I can have our team call you to find a good slot?",
                              error_type: "availability_check_failed"
                          };
                      }
                    }
                    
                    // 4. Create event
                    const startDateTime = new Date(`${input.preferred_date}T${input.preferred_time}:00`);
                    const endDateTime = new Date(startDateTime.getTime() + input.duration_minutes * 60000);
                    
                    const event = await createGoogleCalendarEvent(auth, timezone, {
                      summary: `${input.service_type} - ${input.customer_name}`,
                      description: `Customer: ${input.customer_name}\nPhone: ${input.customer_phone || 'N/A'}\nNotes: ${input.notes || 'None'}`,
                      start: startDateTime,
                      end: endDateTime,
                      attendees: [{ email: input.customer_email, displayName: input.customer_name }],
                    });
                
                    // 5. Save to DB
                    await db.insert(appointments).values({
                      id: crypto.randomUUID(),
                      organization_id: orgId,
                      customer_email: input.customer_email,
                      customer_name: input.customer_name,
                      customer_phone: input.customer_phone,
                      service_type: input.service_type,
                      google_event_id: event.id,
                      google_meet_link: event.hangoutLink,
                      scheduled_at: startDateTime,
                      duration_minutes: input.duration_minutes.toString(),
                      status: 'confirmed',
                      notes: input.notes
                    });

                    

                    
                    // 6. Format response using Org's locale/timezone preferences
                    const formattedTime = startDateTime.toLocaleTimeString('en-US', {
                      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone
                    });

                await notifyOwner({
                    orgId,
              type: 'APPOINTMENT_BOOKED',
              title: "📅 New Appointment!",
             message: `${input.customer_name} booked a ${input.service_type} for ${formattedTime}`,
             data: {
             customer: input.customer_name,
             time: formattedTime,
             meet_link: event.hangoutLink
              }
});
                    
                    return { 
                      success: true, 
                      message: `✅ **Confirmed!** I've scheduled your ${input.service_type} for ${formattedTime}. A Google Meet link has been sent to ${input.customer_email}.`,
                      details: {
                        meet_link: event.hangoutLink,
                        calendar_link: event.htmlLink
                      }
                    };
                } catch (error) {
                    console.error("Booking Tool Error:", error);
                    return {
                      success: false,
                      message: "I encountered a technical glitch while connecting to the calendar. However, I have saved your contact info, and our team will reach out to schedule this manually!",
                      error_type: "api_failure"
                    };
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
        try {
            await whatsappClient.messages.sendText({
                phoneNumberId: phoneNumberId,
                to: customerPhone,
                body: result.text
            });
        } catch (sendError) {
            console.error("WhatsApp send message error:", sendError);
            // Don't throw - we still want to save the message to DB
        }

        // 10. Save AI Response to Database
        try {
            await db.insert(messagesTable).values({
                conversation_id: sessionId,
                role: "assistant",
                content: result.text,
            });
        } catch (error) {
            console.error("Database Persistence Error (AI):", error);
            // Don't fail the request - message was still sent
        }

    } catch (error) {
        console.error("WhatsApp AI Error:", error);
        
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