import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/db/client";
import { conversation, knowledge_source, chatBotMetadata } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { messages as messagesTable } from "@/db/schema";
import { countConversationTokens } from "@/lib/countConversationTokens";
import { summarizeConversation } from "@/lib/openAI";

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, tool, stepCountIs, ToolSet } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { LeadInfo } from "@/@types/types";

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

    let { messages, knowledge_source_ids } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // Fetch chatbot config for organization_id
     
    const [chatbotConfig] = await db
        .select()
        .from(chatBotMetadata)
        .where(eq(chatBotMetadata.id, widgetId))
        .limit(1);
    
    const orgId = chatbotConfig?.organization_id;

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

            await db.insert(conversation).values({
                id: sessionId,
                chatbot_id: widgetId,
                visitor_ip: ip,
                name: visitorName
            });

            // Save all previous messages from the conversation history
            const previousMessages = messages.slice(0, -1);
            if (previousMessages.length > 0) {
                for (const msg of previousMessages) {
                    await db.insert(messagesTable).values({
                        conversation_id: sessionId,
                        role: msg.role as "user" | "assistant",
                        content: msg.content,
                    });
                }
            }
        }

        // Save the latest user message
        if (lastMessage && lastMessage.role === "user") {
            await db.insert(messagesTable).values({
                conversation_id: sessionId,
                role: "user",
                content: lastMessage.content,
            });
        }
    } catch (error) {
        console.error("Database Persistence Error (User):", error);
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
    - If the user says "Yes" or gives permission to create a ticket, your reply MUST be: "[ESCALATED] I have created a support ticket. Our specialist team will review your case."

    LEAD GENERATION PROTOCOL:
    - If a user expresses interest in a product, asks for a demo, or wants someone to contact them, ask for their name and email.
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
                        notes: z.string().describe('Context of the inquiry'),
                      }),
                execute: async ({ first_name, last_name, email, notes }: LeadInfo) => {
                    const { error } = await supabaseAdmin.from('contacts').insert({
                        first_name,
                        last_name,
                        email_jsonb: [{ address: email, type: 'work' }],
                        background: notes,
                        organization_id: orgId,
                        status: 'cold'
                    });
                    
                    if (error) {
                        console.error("CRM Insert Error:", error);
                        throw error;
                    }
                    
                    return { success: true, message: "Lead saved successfully" };
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