
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend for sending emails
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature for security
    const signature = request.headers.get('paypal-transmission-id');
    const timestamp = request.headers.get('paypal-transmission-time');
    const webhookId = process.env.PAYPAL_WEBHOOK_ID!;
    
    // Validate webhook signature (optional but recommended)
    if (process.env.NODE_ENV === 'production') {
      const isValid = await verifyPayPalWebhook(request, webhookId);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }
    
    const event = await request.json();
    
    // Log the incoming webhook for debugging
    console.log('PayPal Webhook Received:', {
      event_type: event.event_type,
      resource_id: event.resource?.id,
      timestamp: new Date().toISOString(),
    });
    
    // Handle subscription expired event
    if (event.event_type === 'BILLING.SUBSCRIPTION.EXPIRED') {
      const subscriptionId = event.resource.id;
      
      // Extract organizationId from custom_id or subscription metadata
      // PayPal usually stores custom data in custom_id field
      const organizationId = event.resource.custom_id || 
                            event.resource.custom || 
                            'unknown';
      
      console.log(`Subscription Expired - ID: ${subscriptionId}, Organization: ${organizationId}`);
      
      // Send notification email
      await sendExpirationNotification(organizationId, subscriptionId);
      
      // You could also add other notification methods here:
      // - Send to Slack
      // - Send SMS
      // - Log to monitoring service
      
      return NextResponse.json({ 
        success: true, 
        message: 'Expiration notification sent',
        organizationId,
        subscriptionId
      });
    }
    
    // Log other event types (optional)
    console.log(`Unhandled PayPal event type: ${event.event_type}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received but no action taken',
      event_type: event.event_type 
    });
    
  } catch (error: any) {
    console.error('Error processing PayPal webhook:', error);
    
    // Send error notification to admin
    await sendErrorNotification(error.message);
    
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error.message },
      { status: 500 }
    );
  }
}

// Function to verify PayPal webhook signature
async function verifyPayPalWebhook(
  request: NextRequest, 
  webhookId: string
): Promise<boolean> {
  try {
    // In a real implementation, you would:
    // 1. Get the transmission signature, timestamp, and webhook ID from headers
    // 2. Verify using PayPal's SDK or API
    // 3. For now, we'll skip verification in development
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Skipping webhook verification in development');
      return true;
    }
    
    // TODO: Implement actual PayPal webhook verification
    // This would involve:
    // - Getting PAYPAL_WEBHOOK_SECRET from environment
    // - Using PayPal's verification API
    // - Returning true/false based on verification
    
    return true; // Placeholder - implement actual verification
    
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return false;
  }
}

// Function to send expiration notification email
async function sendExpirationNotification(
  organizationId: string, 
  subscriptionId: string
): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'simiyunevily@gmail.com';
    const fromEmail = process.env.FROM_EMAIL || 'simiyunevily@gmail.com';
    
    const emailData = {
      from: `Subscription Monitor <${fromEmail}>`,
      to: adminEmail,
      subject: `🚨 Subscription Expired - Organization: ${organizationId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f8f9fa; padding: 20px; border-radius: 5px; }
                .content { padding: 20px; background: white; border-radius: 5px; margin-top: 20px; }
                .info-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🚨 Subscription Expiration Alert</h2>
                </div>
                <div class="content">
                    <p>A PayPal subscription has expired and requires manual attention.</p>
                    
                    <div class="info-box">
                        <h3>Subscription Details:</h3>
                        <p><strong>Organization ID:</strong> ${organizationId}</p>
                        <p><strong>Subscription ID:</strong> ${subscriptionId}</p>
                        <p><strong>Expiration Time:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Payment Provider:</strong> PayPal</p>
                    </div>
                    
                    <h3>Required Actions:</h3>
                    <ol>
                        <li>Contact the organization to notify them of expiration</li>
                        <li>Check if they want to renew their subscription</li>
                        <li>Process renewal if requested</li>
                        <li>Update their subscription status in your system</li>
                    </ol>
                    
                    <p><strong>Note:</strong> This is an automated alert. Please handle this manually.</p>
                </div>
                <div class="footer">
                    <p>This notification was sent from your Subscription Monitoring System.</p>
                    <p>Do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
Subscription Expiration Alert
=============================

A PayPal subscription has expired and requires manual attention.

Subscription Details:
- Organization ID: ${organizationId}
- Subscription ID: ${subscriptionId}
- Expiration Time: ${new Date().toLocaleString()}
- Payment Provider: PayPal

Required Actions:
1. Contact the organization to notify them of expiration
2. Check if they want to renew their subscription
3. Process renewal if requested
4. Update their subscription status in your system

Note: This is an automated alert. Please handle this manually.

This notification was sent from your Subscription Monitoring System.
Do not reply to this email.
      `
    };
    
    const result = await resend.emails.send(emailData);
    console.log('Expiration notification email sent:', result);
    
  } catch (error: any) {
    console.error('Failed to send expiration notification email:', error);
    
    // Fallback: Log to console with clear formatting
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  SUBSCRIPTION EXPIRED - MANUAL ACTION REQUIRED');
    console.log('='.repeat(80));
    console.log(`Organization ID: ${organizationId}`);
    console.log(`Subscription ID: ${subscriptionId}`);
    console.log(`Provider: PayPal`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('='.repeat(80));
    console.log('ACTION: Contact the organization and handle renewal manually.');
    console.log('='.repeat(80) + '\n');
  }
}

// Function to send error notification
async function sendErrorNotification(errorMessage: string): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@yourdomain.com';
    
    await resend.emails.send({
      from: 'Subscription Monitor <notifications@yourdomain.com>',
      to: adminEmail,
      subject: '⚠️ PayPal Webhook Processing Error',
      html: `
        <h2>PayPal Webhook Error</h2>
        <p>An error occurred while processing a PayPal webhook:</p>
        <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px;">${errorMessage}</pre>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p>Please check the server logs for more details.</p>
      `
    });
    
    console.log('Error notification email sent to admin');
    
  } catch (error) {
    console.error('Failed to send error notification:', error);
  }
}

// Optional: GET endpoint to verify webhook is working
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'PayPal Webhook endpoint is active',
    status: 'operational',
    timestamp: new Date().toISOString(),
    supported_events: ['BILLING.SUBSCRIPTION.EXPIRED'],
    instructions: 'Configure this URL in PayPal webhook settings'
  });
}