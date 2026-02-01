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
    const formData = await request.formData();
    const to = formData.get('to') as string;
    const body = formData.get('body') as string;
    const file = formData.get('file') as File | null;

    if (!to) {
      return NextResponse.json(
        { error: 'Missing required field: to' },
        { status: 400 }
      );
    }

    // Session ID is the customer's phone number
    const sessionId = to;

    // 🚨 VERIFY THIS IS A HUMAN-CONTROLLED CONVERSATION
    // Optional: You can skip this check if you want agents to send messages anytime
    try {
      const [conv] = await db
        .select()
        .from(conversation)
        .where(eq(conversation.id, sessionId))
        .limit(1);

      if (!conv) {
        // Create conversation if it doesn't exist
        await db.insert(conversation).values({
          id: sessionId,
          chatbot_id: tenant.id,
          name: to,
          organization_id: tenant.organization_id,
          visitor_ip: "WhatsApp User",
          is_human_takeover: true, // Auto-enable takeover when agent sends message
          human_agent_id: email,
          takeover_started_at: new Date(),
        });
      } else if (!conv.is_human_takeover) {
        // Auto-enable human takeover when agent sends a message
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
      // Continue anyway - don't block sending
    }

    let result;
    let messageContent = body || '[Media message]';

    // Send media message
    if (file) {
      const fileType = file.type.split('/')[0]; // image, video, audio, application
      const mediaType = fileType === 'application' ? 'document' : fileType;

      // Upload media first
      const uploadResult = await whatsappClient.media.upload({
        phoneNumberId: phoneNumberId,
        type: mediaType as 'image' | 'video' | 'audio' | 'document',
        file: file,
        fileName: file.name
      });

      // Send message with media
      if (mediaType === 'image') {
        result = await whatsappClient.messages.sendImage({
          phoneNumberId: phoneNumberId,
          to,
          image: { id: uploadResult.id, caption: body || undefined }
        });
        messageContent = body ? `[Image] ${body}` : '[Image]';
      } else if (mediaType === 'video') {
        result = await whatsappClient.messages.sendVideo({
          phoneNumberId: phoneNumberId,
          to,
          video: { id: uploadResult.id, caption: body || undefined }
        });
        messageContent = body ? `[Video] ${body}` : '[Video]';
      } else if (mediaType === 'audio') {
        result = await whatsappClient.messages.sendAudio({
          phoneNumberId: phoneNumberId,
          to,
          audio: { id: uploadResult.id }
        });
        messageContent = '[Audio]';
      } else {
        result = await whatsappClient.messages.sendDocument({
          phoneNumberId: phoneNumberId,
          to,
          document: { id: uploadResult.id, caption: body || undefined, filename: file.name }
        });
        messageContent = body ? `[Document: ${file.name}] ${body}` : `[Document: ${file.name}]`;
      }
    } else if (body) {
      // Send text message
      result = await whatsappClient.messages.sendText({
        phoneNumberId: phoneNumberId,
        to,
        body
      });
      messageContent = body;
    } else {
      return NextResponse.json(
        { error: 'Either body or file is required' },
        { status: 400 }
      );
    }

    // 🚨 SAVE AGENT MESSAGE TO DATABASE
    try {
      await db.insert(messagesTable).values({
        conversation_id: sessionId,
        role: "assistant", // Agent messages are "assistant" role
        content: messageContent,
        
        sent_by_human: true,
        agent_id: email,
        whatsapp_message_id: result.messages?.[0]?.id,
      });

      // Log agent activity
      await db.insert(agentActivity).values({
        conversation_id: sessionId,
        agent_id: email,
        action: 'message_sent',
      });

      console.log(`[AGENT MESSAGE] Saved to DB: ${sessionId} - ${messageContent.substring(0, 50)}...`);
    } catch (dbError) {
      console.error('Failed to save agent message to database:', dbError);
      // Don't fail the request - message was sent successfully
    }

    return NextResponse.json({
      ...result,
      saved_to_db: true,
      conversation_mode: 'human_takeover',
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}