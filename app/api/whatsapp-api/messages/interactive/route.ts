import { NextResponse } from 'next/server';
import { whatsappClient } from '@/lib/whatsapp/whatsapp-client';
import { getWhatsAppTenant } from '@/lib/whatsapp/get-tenant';
import { db } from '@/db/client';
import { messages as messagesTable, conversation, agentActivity } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';


export async function POST(request: Request) {
  try {
    // Get authenticated user (the human agent sending the message)
    const cookieStore = await cookies();
                const userSession = cookieStore.get('user_session')?.value;
                
                if (!userSession) {
                  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
                }
    
       const { email, organization_id } = JSON.parse(userSession);

    const tenant = await getWhatsAppTenant();
    
    if (!tenant?.whatsappPhoneNumberId) {
      return NextResponse.json(
        { error: 'WhatsApp phone number ID not found for this tenant' },
        { status: 400 }
      );
    }

    const phoneNumberId = tenant.whatsappPhoneNumberId;
    const body = await request.json();
    const { phoneNumber, header, body: bodyText, buttons } = body;

    if (!phoneNumber || !bodyText || !buttons || buttons.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, body, buttons' },
        { status: 400 }
      );
    }

    // Validate buttons
    if (buttons.length > 3) {
      return NextResponse.json(
        { error: 'Maximum 3 buttons allowed' },
        { status: 400 }
      );
    }

    const sessionId = phoneNumber;

    // 🚨 AUTO-ENABLE HUMAN TAKEOVER (same as send route)
    try {
      const [conv] = await db
        .select()
        .from(conversation)
        .where(eq(conversation.id, sessionId))
        .limit(1);

      if (!conv) {
        await db.insert(conversation).values({
          id: sessionId,
          chatbot_id: tenant.id,
          name: phoneNumber,
          organization_id: tenant.organization_id,
          visitor_ip: "WhatsApp User",
          is_human_takeover: true,
          human_agent_id: email,
          takeover_started_at: new Date(),
        });
      } else if (!conv.is_human_takeover) {
        await db
          .update(conversation)
          .set({
            is_human_takeover: true,
            human_agent_id: email,
            takeover_started_at: new Date(),
          })
          .where(eq(conversation.id, sessionId));
      }
    } catch (dbError) {
      console.error('Failed to check/update conversation:', dbError);
    }

    // Build interactive button message payload
    const payload: {
      phoneNumberId: string;
      to: string;
      bodyText: string;
      header?: { type: 'text'; text: string };
      buttons: Array<{ id: string; title: string }>;
    } = {
      phoneNumberId: phoneNumberId,
      to: phoneNumber,
      bodyText,
      buttons: buttons.map((btn: { id: string; title: string }) => ({
        id: btn.id,
        title: btn.title.substring(0, 20) // Ensure max 20 chars
      }))
    };

    // Add header if provided
    if (header) {
      payload.header = {
        type: 'text',
        text: header
      };
    }

    // Send interactive button message
    const result = await whatsappClient.messages.sendInteractiveButtons(payload);

    // 🚨 SAVE TO DATABASE
    try {
      // Format message content for database
      const buttonsList = buttons.map((btn: { title: string }) => btn.title).join(', ');
      const messageContent = header 
        ? `[Interactive Buttons]\n${header}\n\n${bodyText}\n\nButtons: ${buttonsList}`
        : `[Interactive Buttons]\n${bodyText}\n\nButtons: ${buttonsList}`;

      await db.insert(messagesTable).values({
        conversation_id: sessionId,
        role: "assistant",
        content: messageContent,
        
         sent_by_human: true,
         agent_id: email,
         message_type: 'interactive_buttons',
         whatsapp_message_id: result.messages?.[0]?.id,
      });

      // Log agent activity
      await db.insert(agentActivity).values({
        conversation_id: sessionId,
        agent_id: email,
        action: 'message_sent',
      });

      console.log(`[INTERACTIVE MESSAGE] Saved to DB: ${sessionId}`);
    } catch (dbError) {
      console.error('Failed to save interactive message to database:', dbError);
      // Don't fail the request - message was sent successfully
    }

    return NextResponse.json({
      ...result,
      saved_to_db: true,
      conversation_mode: 'human_takeover',
    });
  } catch (error) {
    console.error('Error sending interactive message:', error);
    return NextResponse.json(
      { error: 'Failed to send interactive message' },
      { status: 500 }
    );
  }
}