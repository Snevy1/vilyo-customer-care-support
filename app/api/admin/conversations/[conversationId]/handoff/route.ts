

import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { conversation, agentActivity } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

// Enable human takeover for a specific conversation
export async function POST(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  
      

  

  try {
    // Update conversation to human mode

    const cookieStore = await cookies();
      const userSession = cookieStore.get('user_session')?.value;
      
      if (!userSession) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { conversationId } = params;
      const { agentId } = await req.json();

      const { email, organization_id } = JSON.parse(userSession);


    await db
      .update(conversation)
      .set({
        is_human_takeover: true,
        human_agent_id: agentId || email,
        takeover_started_at: new Date(),
      })
      .where(eq(conversation.id, conversationId));

    // Log activity
    await db.insert(agentActivity).values({
      conversation_id: conversationId,
      agent_id: agentId || email,
      action: 'takeover',
    });

    return NextResponse.json({
      success: true,
      message: "Human takeover enabled",
      conversationId,
    });
  } catch (error) {
    console.error("Handoff error:", error);
    return NextResponse.json({ error: "Failed to enable handoff" }, { status: 500 });
  }
}

// Release conversation back to bot
export async function DELETE(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
   

  try {

    const cookieStore = await cookies();
      const userSession = cookieStore.get('user_session')?.value;
      
      if (!userSession) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { email, organization_id } = JSON.parse(userSession);


  const { conversationId } = params;
    await db
      .update(conversation)
      .set({
        is_human_takeover: false,
        human_agent_id: null,
        takeover_started_at: null,
      })
      .where(eq(conversation.id, conversationId));

    await db.insert(agentActivity).values({
      conversation_id: conversationId,
      agent_id: email,
      action: 'release',
    });

    return NextResponse.json({
      success: true,
      message: "Bot re-enabled",
      conversationId,
    });
  } catch (error) {
    console.error("Release error:", error);
    return NextResponse.json({ error: "Failed to release conversation" }, { status: 500 });
  }
}

// Get handoff status
export async function GET(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  

  try {

    const cookieStore = await cookies();
      const userSession = cookieStore.get('user_session')?.value;
      
      if (!userSession) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }


  const { conversationId } = params;
    const [conv] = await db
      .select()
      .from(conversation)
      .where(eq(conversation.id, conversationId))
      .limit(1);

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({
      conversationId: conv.id,
      isHumanTakeover: conv.is_human_takeover,
      humanAgentId: conv.human_agent_id,
      takeoverStartedAt: conv.takeover_started_at,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}