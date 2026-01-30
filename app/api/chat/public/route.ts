import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/db/client";
import { conversation, knowledge_source, chatBotMetadata, supportTickets } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { messages as messagesTable } from "@/db/schema";
import { countConversationTokens } from "@/lib/countConversationTokens";
import { summarizeConversation } from "@/lib/openAI";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, tool, stepCountIs, ToolSet } from 'ai';
import { email, z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from "@/lib/rate-limiter";
import { calculateLeadScore } from "@/lib/lead-scoring";
import { sendEmailNotification, sendHotLeadNotification, sendWarmLeadNotification } from "@/lib/email-notifications";

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

    let { messages, knowledge_source_ids } = await req.json();
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
                name: visitorName
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

    // --- VERCEL AI SDK WITH CRM TOOL ---
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
            // Calculate lead score
            const emailDomain = email.split('@')[1];
            const leadScoreResult = calculateLeadScore({
                email_domain: emailDomain,
                phone_provided: !!phoneNumber,
                notes,
                keywords_mentioned: intent_keywords,
            });

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
                throw error;
            }
            
            console.log(`Lead scored: ${leadScoreResult.score}/100 (${leadScoreResult.quality})`, leadScoreResult.reasoning);
            
            // Send instant notification for HOT leads
            if (leadScoreResult.quality === 'hot') {
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
            }else if (leadScoreResult.quality === 'warm') {

    // Optional: Send a less urgent notification for warm leads
    await sendWarmLeadNotification({
        organizationEmail: user_email,
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
      // 1. Save ticket
      await db.insert(supportTickets).values({
        conversation_id: sessionId,
        organization_id: orgId,
        reason,
        last_message: user_message,
        status: 'open'
      });

      // 2. Send email and handle response
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

        // Save AI response to database
        try {
            await db.insert(messagesTable).values({
                conversation_id: sessionId,
                role: "assistant",
                content: result.text
            });
        } catch (error) {
            console.error("Database Persistence Error (AI):", error);
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