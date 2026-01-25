import { NextResponse } from "next/server";

import {jwtVerify} from "jose"
import { db } from "@/db/client";
import { conversation, knowledge_source } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import {messages as messagesTable} from "@/db/schema"
import { countConversationTokens } from "@/lib/countConversationTokens";
import { summarizeConversation } from "@/lib/openAI";

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
    const authHeader = req.headers.get("Authorization");

    const token = authHeader?.split(" ")[1];

    if(!token){
        return NextResponse.json({
            error: "Missing session token"
        },{
            status: 401
        })
    };

    let sessionId: string | undefined;
    let widgetId: string | undefined;

    try {

        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        const {payload} = await jwtVerify(token,secret);
   
        sessionId = payload.sessionId as string;
        widgetId = payload.widgetId as string;

           if(!sessionId || !widgetId){
            throw new Error("Invalid Token Payload")
           }


        
    } catch (error) {

        console.error("Token Verification Failed:", error);

        return NextResponse.json(
            {
                error: "Invalid or expired session token"
            },
            {
                status: 401
            }
        )
        
    }

    let {messages, knowledge_source_ids} = await req.json();

    const lastMessage =  messages[messages.length - 1];

    if(!lastMessage || lastMessage.role !== 'user'){
        // Edge case: Client might send empty or weird state, handle gracefully

        console.log("No new user message detected or invalid format")
    }

    try {

        const [existingConv] = await db.select().from(conversation).where(eq(conversation.id, sessionId)).limit(1);

        if(!existingConv){
            const forwardedFor = req.headers.get("x-forwarded-for");
            const ip = forwardedFor ? forwardedFor.split(",")[0]: "Unkown IP";
            const visitorName = `#Visitor(${ip})`;

            await db.insert(conversation).values({
                id:sessionId,
                chatbot_id: widgetId,
                visitor_ip: ip,
                name: visitorName
            });

            const previousMessages = messages.slice(0,-1);

            if(previousMessages.length > 0){
                for(const msg of previousMessages){
                    await db.insert(messagesTable).values({
                        conversation_id: sessionId,
                        role: msg.role as "user" | "assistant",
                        content: msg.content,



                    })
                }


            }
        }


        if(lastMessage && lastMessage.role === "user"){

            await db.insert(messagesTable).values({
                conversation_id: sessionId,
                role: "user",
                content:lastMessage.content,
            })

        }




        
    } catch (error) {
        console.error("Database Persistence Error (User):", error)
        
    }

    let context = "";

    if(knowledge_source_ids && knowledge_source_ids.length > 0){

        try {
            const sources = await db.select({
                content: knowledge_source.content
            }).from(knowledge_source).where(inArray(knowledge_source.id, knowledge_source_ids));

            context = sources.map((s)=>s.content).filter(Boolean).join("\n\n");
            
        } catch (error) {
            console.error("RAG Retrieval Error:", error)
            
        }
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
                        model: "openai/gpt-4o-mini", // I will need to change to use 4o for production, it is best
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



                    try {
                        await db.insert(messagesTable).values({
                            conversation_id:sessionId,
                            role: "assistant",
                            content:reply
                        })
                        
                    } catch (error) {

                        console.error("Database Persistence Error (AI):", error);

                        
                    }

                  return NextResponse.json({response:reply});
            
        } catch (error) {
            console.error("OpenAI Error:", error);
    
            return NextResponse.json({
                response: "An error occured while processing your request."
            },{status: 500})
    
    
            
        }


}


// If it is to be a very production ready, we will need to implement message broker, event-driven architecture..., caching etc.