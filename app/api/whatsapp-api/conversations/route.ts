import { NextResponse } from 'next/server';
import {
  buildKapsoFields,
  type ConversationKapsoExtensions,
  type ConversationRecord
} from '@kapso/whatsapp-cloud-api';
import { whatsappClient } from '@/lib/whatsapp/whatsapp-client';
import { getWhatsAppTenant } from '@/lib/whatsapp/get-tenant';

function parseDirection(kapso?: ConversationKapsoExtensions): 'inbound' | 'outbound' {
  if (!kapso) return 'inbound';
  const inboundAt = typeof kapso.lastInboundAt === 'string' ? Date.parse(kapso.lastInboundAt) : Number.NaN;
  const outboundAt = typeof kapso.lastOutboundAt === 'string' ? Date.parse(kapso.lastOutboundAt) : Number.NaN;
  
  if (Number.isFinite(inboundAt) && Number.isFinite(outboundAt)) {
    return inboundAt >= outboundAt ? 'inbound' : 'outbound';
  }
  return Number.isFinite(outboundAt) ? 'outbound' : 'inbound';
}

export async function GET(request: Request) {
  try {
    // 1. Get the authenticated tenant using our helper
    const tenant = await getWhatsAppTenant();

    if (!tenant || !tenant.isWhatsappConnected) {
      return NextResponse.json(
        { error: 'WhatsApp not connected for this organization' },
        { status: 404 }
      );
    }

    // 2. Fetch parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const parsedLimit = Number.parseInt(searchParams.get('limit') ?? '', 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 50;

    /** * IMPORTANT: Since you are using Kapso's Multitenant flow, 
     * you use the kapsoCustomerId to scope the request.
     */
         // Ensure phone number is available first
    if (!tenant?.whatsappPhoneNumberId) {
  return NextResponse.json(
    { error: 'WhatsApp number not yet provisioned.' },
    { status: 400 }
  );
}
    const response = await whatsappClient.conversations.list({
      // Depending on your Kapso SDK version, you might use customerId 
      // or retrieve the specific phoneNumberId from your DB
      phoneNumberId: tenant.whatsappPhoneNumberId, 
      ...(status && { status: status as 'active' | 'ended' }),
      limit,
      fields: buildKapsoFields([
        'contact_name',
        'messages_count',
        'last_message_type',
        'last_message_text',
        'last_inbound_at',
        'last_outbound_at'
      ])
    });

    // 3. Transform for your Frontend Inbox
    const transformedData = response.data.map((conversation: ConversationRecord) => {
      const kapso = conversation.kapso;
      return {
        id: conversation.id,
        phoneNumber: conversation.phoneNumber ?? '',
        status: conversation.status ?? 'unknown',
        lastActiveAt: conversation.lastActiveAt,
        // We link the response to the customer ID we used
        kapsoCustomerId: tenant.kapsoCustomerId,
        metadata: conversation.metadata ?? {},
        contactName: kapso?.contactName,
        messagesCount: kapso?.messagesCount,
        lastMessage: kapso?.lastMessageText
          ? {
              content: kapso.lastMessageText,
              direction: parseDirection(kapso),
              type: kapso.lastMessageType
            }
          : undefined
      };
    });

    return NextResponse.json({
      data: transformedData,
      paging: response.paging
    });

  } catch (error: any) {
    console.error('WhatsApp Multitenant Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversations' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}