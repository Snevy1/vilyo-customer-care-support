import { NextResponse } from 'next/server';
import { whatsappClient} from '@/lib/whatsapp/whatsapp-client';
import { getWhatsAppTenant } from '@/lib/whatsapp/get-tenant';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const { mediaId } = await params;

  
  try {

    // Get phone number from tenant

    const tenant = await getWhatsAppTenant();

    if (!tenant?.whatsappPhoneNumberId) {
      return NextResponse.json(
        { error: 'WhatsApp phone number ID not found for this tenant' },
        { status: 400 }
      );
    }
    const phoneNumberId = tenant.whatsappPhoneNumberId;
    
    // Get metadata for mime type
    const metadata = await whatsappClient.media.get({
      mediaId,
      phoneNumberId: phoneNumberId
    });

    const buffer = await whatsappClient.media.download({
      mediaId,
      phoneNumberId: phoneNumberId,
      auth: 'never' // Force no auth headers for CDN
    });

    // If buffer is a Response, return it directly
    if (buffer instanceof Response) {
      return buffer;
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': metadata.mimeType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch media',
        details: error instanceof Error ? error.message : 'Unknown error',
        mediaId
      },
      { status: 500 }
    );
  }
}
