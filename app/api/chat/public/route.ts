import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/db/client";
import { conversation, knowledge_source, chatBotMetadata, supportTickets, appointments, organizations } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { messages as messagesTable } from "@/db/schema";
import { countConversationTokens } from "@/lib/countConversationTokens";
import { summarizeConversation } from "@/lib/openAI";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, tool, stepCountIs, ToolSet } from 'ai';
import {  z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from "@/lib/rate-limiter";
import { calculateLeadScore } from "@/lib/lead-scoring";
import { sendEmailNotification, sendHotLeadNotification, sendWarmLeadNotification } from "@/lib/email-notifications";
import { calculateLeadScoreDynamic } from "@/lib/lead-scoring-dynamic";
import { checkGoogleCalendarSlot, createGoogleCalendarEvent, getAlternativeSlots, getOrgGoogleAuth } from "@/lib/appointments/google-calendar";
import { notifyOwner } from "@/lib/notifications/notifications";

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) return NextResponse.json({ error: "Missing session token" }, { status: 401 });

    let sessionId: string;
    let widgetId: string;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(token, secret);
        sessionId = payload.sessionId as string;
        widgetId = payload.widgetId as string;
        
        if (!sessionId || !widgetId) {
            throw new Error("Invalid Token Payload");
        }
    } catch (error) {
        console.error("Token Verification Failed:", error);
        return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
    }


    // Rate limit by sessionId (30 requests per minute per session)
    if (!checkRateLimit(sessionId, 30, 60000)) {
        return NextResponse.json(
            { error: "Rate limit exceeded. Please slow down." }, 
            { status: 429 }
        );
    }

    const requestSchema = z.object({
       messages: z.array(z.object({
           role: z.enum(['user', 'assistant', 'system']),
           content: z.string()
       })),
       knowledge_source_ids: z.array(z.string()).optional()
   });
   
   const body = await req.json().catch(() => null);
   if (!body) {
       return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
   }
   
   const parsed = requestSchema.safeParse(body);
   if (!parsed.success) {
       return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
   }
   
   let { messages, knowledge_source_ids } = parsed.data;

    // let { messages, knowledge_source_ids } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // Fetch chatbot config for organization_id
     
    const [chatbotConfig] = await db
        .select()
        .from(chatBotMetadata)
        .where(eq(chatBotMetadata.id, widgetId))
        .limit(1);

        if (!chatbotConfig || !chatbotConfig.organization_id) {
    console.error("Invalid or missing chatbot configuration for widgetId:", widgetId);
    return NextResponse.json(
        { error: "Invalid chatbot configuration" }, 
        { status: 403 }
    );
}
    
    const orgId = chatbotConfig?.organization_id;
    const user_email = chatbotConfig?.user_email;

 // --- PERSISTENCE LOGIC ---
try {
    const [existingConv] = await db
        .select()
        .from(conversation)
        .where(eq(conversation.id, sessionId))
        .limit(1);

    if (!existingConv) {
        const forwardedFor = req.headers.get("x-forwarded-for");
        const ip = forwardedFor ? forwardedFor.split(",")[0] : "Unknown IP";
        const visitorName = `#Visitor(${ip})`;

        // Insert conversation first
        try {
            await db.insert(conversation).values({
                id: sessionId,
                chatbot_id: widgetId,
                visitor_ip: ip,
                name: visitorName,
                organization_id: orgId,
                is_human_takeover: false, // Default to bot mode
            });
        } catch (convError: any) {
            // If conversation already exists (race condition), that's fine
            if (!convError.message?.includes('duplicate key') && !convError.message?.includes('unique constraint')) {
                throw convError;
            }
        }

        // Save all previous messages from the conversation history
        const previousMessages = messages.slice(0, -1);
        if (previousMessages.length > 0) {
            const messageValues = previousMessages.map((msg: any) => ({
                conversation_id: sessionId,
                role: msg.role as "user" | "assistant",
                content: msg.content,
            }));
            
            // Insert messages in batch (Drizzle supports this)
            await db.insert(messagesTable).values(messageValues);
        }
    }

    // Save the latest user message (outside transaction since conversation exists)
    if (lastMessage && lastMessage.role === "user") {
        await db.insert(messagesTable).values({
            conversation_id: sessionId,
            role: "user",
            content: lastMessage.content,
        });
    }

    // ========================================
    // 🚨 HUMAN TAKEOVER CHECK
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
               payload: { sessionId, reason: 'Human takeover', user_message: lastMessage.content }
           })
       });
   } catch (socketError) {
       console.error('Socket emit failed:', socketError);
       // Don't throw - this is non-critical
   }
        
        return NextResponse.json({ 
            response: "",
            mode: 'human_takeover',
            message: 'Message saved. Awaiting human response.'
        });
    }

    // Check if bot is globally disabled for this chatbot
    if (chatbotConfig.bot_enabled === false) {
        console.log(`[BOT DISABLED] Chatbot ${widgetId} has bot disabled globally.`);
        return NextResponse.json({ 
            response: "",
            mode: 'bot_disabled',
            message: 'Bot is disabled for this chatbot.'
        });
    }

} catch (error) {
    console.error("Database Persistence Error:", error);
    // Don't fail the whole request if persistence fails
    // The chat can still work, we just log the error
    // Only fail if it's a critical error
}

    // --- RAG RETRIEVAL ---
    let context = "";
    if (knowledge_source_ids && knowledge_source_ids.length > 0) {
        try {
            const sources = await db
                .select({ content: knowledge_source.content })
                .from(knowledge_source)
                .where(inArray(knowledge_source.id, knowledge_source_ids));
            
            context = sources.map((s) => s.content).filter(Boolean).join("\n\n");
        } catch (error) {
            console.error("RAG Retrieval Error:", error);
        }
    }

    // --- TOKEN MANAGEMENT & SUMMARIZATION ---
    const tokenCount = countConversationTokens(messages);
    if (tokenCount > 6000) {
        const recentMessages = messages.slice(-10);
        const olderMessages = messages.slice(0, -10);

        if (olderMessages.length > 0) {
            const summary = await summarizeConversation(olderMessages);
            context = `PREVIOUS CONVERSATION SUMMARY:\n\n${summary}\n\n` + context;
            messages = recentMessages;
        }
    }

    const systemPrompt = `Your name is Fiona, a friendly customer support specialist.

CRITICAL PROTOCOLS:
1. LEAD-FIRST BOOKING: Before calling 'bookAppointment', you MUST call 'createLead' first. Get name/email, save to CRM, then book.
2. PROACTIVE CAPTURE: If user asks about pricing, demos,  services, expresses interest in a product or wants someone to contact them, get their details and call 'createLead' immediately. Extract intent keywords like "pricing", "demo", "buy".- **IMPORTANT**: When calling 'createLead', analyze the conversation and extract 'intent_keywords' - phrases like "pricing", "demo", "buy", "interested in", etc. Pass these in the intent_keywords array.
3. ESCALATION: If you don't know the answer or user is unhappy, ask: "Would you like me to create a support ticket?" If yes, get their details name/email/phone(mostly both), call 'createLead', then MUST call 'escalateIssue'. Reply: "[ESCALATED] Support ticket created. Our team will review your case."
4. ERROR HANDLING: If any tool fails, apologize gracefully: "I'm having trouble with [system], but I've saved your details and our team will follow up manually!"

STYLE: Max 1-2 sentences. Be proactive and conversational.

Context:
${context}`;



    // --- VERCEL AI SDK WITH CRM, BOOKING AND ESCALATION TOOLS ---
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
                phone_provided: !!phoneNumber,
                notes,
                keywords_mentioned: intent_keywords,
                // Add more factors as available
            }, orgId);

            // Insert lead into database
            const { error } = await supabaseAdmin.from('contacts').insert({
                first_name,
                last_name,
                email_jsonb: [{ address: email, type: 'work' }],
                phone_jsonb: phoneNumber ? [{ address: phoneNumber, type: 'work' }] : [],
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
            console.log('Applied rules:', leadScoreResult.applied_rules);
            console.log('Reasoning:', leadScoreResult.reasoning);
            
            // Send notifications based on quality
            if (leadScoreResult.quality === 'hot') {
                try {
                    await sendHotLeadNotification({
                        organizationEmail: user_email,
                        leadName: `${first_name} ${last_name}`,
                        leadEmail: email,
                        leadPhone: phoneNumber || 'Not provided',
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
                        organizationEmail: user_email,
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
      // 1. Save ticket
      await db.insert(supportTickets).values({
        conversation_id: sessionId,
        organization_id: orgId,
        reason,
        last_message: user_message,
        status: 'open'
      });

      // 🚨 AUTOMATICALLY ENABLE HUMAN TAKEOVER
      await db
          .update(conversation)
          .set({ is_human_takeover: true })
          .where(eq(conversation.id, sessionId));

      // 2. Send email and handle response
      try {
          const emailResult = await sendEmailNotification({
            email: user_email, 
            reason, 
            user_message, 
            sessionId
          });

          if (emailResult.message === "error") {
            console.error("Email notification failed for escalation:", sessionId);
            // Still return success since ticket was created
          }
      } catch (emailError) {
          console.error("Email notification error:", emailError);
          // Continue - ticket was still created
      }

      return { success: true, message: "Ticket created and human takeover enabled" };
    } catch (error) {
      console.error("Escalation failed:", error);
      return {
          success: false,
          message: `I'm having trouble creating a support ticket right now, but I want to make sure you get help. Could you please email our support team directly at ${user_email}? I apologize for the inconvenience!`,
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

        // Save AI response to database
        try {
            await db.insert(messagesTable).values({
                conversation_id: sessionId,
                role: "assistant",
                content: result.text
            });
        } catch (error) {
            console.error("Database Persistence Error (AI):", error);
            // Don't fail the request if we can't save to DB - user still gets response
        }

        return NextResponse.json({ response: result.text });

    } catch (error) {
        console.error("Agent Error:", error);
        return NextResponse.json(
            { response: "An error occurred while processing your request." },
            { status: 500 }
        );
    }
}

// If it is to be a very production ready, we will need to implement message broker, event-driven architecture..., caching etc.







/* const systemPrompt = `Your name is Fiona. You are a friendly, human-like customer support specialist.
    
    CRITICAL RULES:
    -If asked for your name, always respond with "I'm Fiona".
    - If asked for your role, always respond with "I'm a customer support specialist."
    - Keep answers EXTREMLY SHORT (max 1-2 sentences) and conversational.
    - If the user asks a broad question. DO NOT provide a summary. Instead, ask a friendly clarifying question to understand exactly what they need help with.

    - Never dump information. Always conversationally guide the user to the specificific answer they need.
    - Mirror the user's brevity.

    ESCALATION PROTOCOL:

    - If you simply DON'T KNOW the answer from the context, or if the user indicates they are unhappy, ask: "Would you like me to create a support ticket for your specific case?"
    -If the user says "Yes" or gives permission to create a ticket, your reply MUST be: "[ESCALATED] I have created a support ticket. Our specialist team will review your case."

    LEAD GENERATION PROTOCOL:
     - If a user expresses interest in a product, asks for a demo, or wants someone to contact them, ask for their name and email.
     - Once they provide their details, use the 'createLead' tool to save them to the CRM.
     - After saving, confirm to the user: "I've passed your details to our team. They'll reach out soon!"

    Context:
    ${context}
    `; */