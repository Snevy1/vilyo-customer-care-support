import { db } from "@/db/client";
import { knowledge_source } from "@/db/schema";
import { countConversationTokens } from "@/lib/countConversationTokens";
import { isAuthorized } from "@/lib/isAuthorized";
import { /* openai */ summarizeConversation } from "@/lib/openAI";
import { ContextMenuItemIndicator } from "@radix-ui/react-context-menu";
import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import OpenAI from "openai";


// This one uses openRouter....
export const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY, // Your OpenRouter API key
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": process.env.YOUR_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.YOUR_SITE_NAME || "My App",
    },
});

export async function POST(req:Request){

    const user = await isAuthorized();

    if(!user){
        return NextResponse.json({error: "Unauthorized"},{status: 401})
    }

    let {messages, knowledge_source_ids} = await req.json();


    let context = '';

    if(knowledge_source_ids && knowledge_source_ids.length > 0){
        const sources = await db.select({
            content: knowledge_source.content,
        })
        .from(knowledge_source)
        .where(inArray(knowledge_source.id, knowledge_source_ids));

         context = sources
            .map((source)=> source.content)
            .filter(Boolean)
            .join("\n\n");


    }

    const tokenCount = countConversationTokens(messages);

    if(tokenCount > 6000){
        const recentMessages = messages.slice(-10);

        const olderMessages = messages.slice(0, -10);

        if(olderMessages.length > 0){
            const summary = await summarizeConversation(olderMessages);
             context = `PREVIOUS CONVERSATION SUMMARY: \n\n${summary} \n\n` + context;

              messages = recentMessages;
        }
    }

    const systemPrompt = `Your name is Fiona. You are a friendly, human-like customer support specialist.
    
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

    Context:
    ${context}
    `;

    try {
         //=== Commented out code is openai's code, the code below it is for openRouter...
        /* const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{role:"system", content: systemPrompt},...messages],
            temperature: 0.7,
            max_tokens: 200,
        });

        const reply = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response";
 */

        const completion = await openai.chat.completions.create({
                    model: "openai/gpt-4o-mini",
                    temperature: 0.7,
                    max_tokens: 200,
                    messages: [
                        {
                            role: "system",
                            content:systemPrompt
                        },
                        ...messages,
                    ],
                });
                
                const  reply  = completion.choices[0].message.content?.trim() || "I'm sorry, I couldn't generate a response";
              return NextResponse.json({response:reply});
        
    } catch (error) {
        console.error("OpenAI Error:", error);

        return NextResponse.json({
            response: "An error occured while processing your request."
        },{status: 500})


        
    }





   




}