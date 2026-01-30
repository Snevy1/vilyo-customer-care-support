import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface HotLeadNotificationProps {
    organizationEmail: string;
    leadName: string;
    leadEmail: string;
    leadPhone: string;
    notes: string;
    score: number;
    reasoning: string[];
    sessionId: string;
}

interface WarmLeadNotificationProps {
    organizationEmail: string;
    leadName: string;
    leadEmail: string;
    score: number;
}

export async function sendHotLeadNotification({
    organizationEmail,
    leadName,
    leadEmail,
    leadPhone,
    notes,
    score,
    reasoning,
    sessionId,
}: HotLeadNotificationProps) {
    try {
        const { error } = await resend.emails.send({
            from: 'Fiona AI <alerts@resend.dev>', // Update this to your verified domain
            to: organizationEmail,
            subject: `🔥 HOT Lead Alert: ${leadName} (Score: ${score}/100)`,
            html: generateHotLeadEmailHTML({
                leadName,
                leadEmail,
                leadPhone,
                notes,
                score,
                reasoning,
                sessionId,
            }),
        });

        if (error) {
            console.error("Hot lead email notification failed:", error);
            return { success: false, error };
        }

        console.log(`✅ Hot lead notification sent to ${organizationEmail}`);
        return { success: true };
    } catch (error) {
        console.error("Hot lead notification error:", error);
        return { success: false, error };
    }
}

function generateHotLeadEmailHTML({
    leadName,
    leadEmail,
    leadPhone,
    notes,
    score,
    reasoning,
    sessionId,
}: Omit<HotLeadNotificationProps, 'organizationEmail'>): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .score-badge {
            display: inline-block;
            background: #ff6b6b;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            margin-top: 10px;
            font-size: 18px;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
        }
        .info-block {
            background: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-block strong {
            color: #667eea;
        }
        .reasoning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .reasoning h3 {
            margin-top: 0;
            color: #856404;
        }
        .reasoning ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .reasoning li {
            margin: 5px 0;
            color: #856404;
        }
        .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin-top: 20px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
            border-radius: 0 0 8px 8px;
        }
        .contact-info {
            margin: 10px 0;
        }
        .contact-info a {
            color: #667eea;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔥 Hot Lead Alert!</h1>
        <div class="score-badge">Lead Score: ${score}/100</div>
    </div>
    
    <div class="content">
        <p style="font-size: 16px; margin-top: 0;">
            <strong>Action Required:</strong> A high-quality lead just came through your chatbot. This person is showing strong buying signals.
        </p>

        <div class="info-block">
            <h3 style="margin-top: 0;">👤 Lead Information</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${leadName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${leadEmail}">${leadEmail}</a></p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${leadPhone}</p>
        </div>

        <div class="info-block">
            <h3 style="margin-top: 0;">💬 Conversation Context</h3>
            <p style="margin: 5px 0; white-space: pre-wrap;">${notes}</p>
        </div>

        <div class="reasoning">
            <h3>🎯 Why This Lead is Hot</h3>
            <ul>
                ${reasoning.map(reason => `<li>${reason}</li>`).join('')}
            </ul>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="https://yourapp.com/conversations/${sessionId}" class="cta-button">
                View Full Conversation →
            </a>
        </div>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #6c757d; font-size: 14px;">
            <strong>💡 Pro Tip:</strong> Hot leads are 3x more likely to convert when contacted within 5 minutes. Strike while the iron is hot!
        </p>
    </div>

    <div class="footer">
        <p>This is an automated notification from your Fiona AI chatbot.</p>
        <p>Conversation ID: ${sessionId}</p>
        <p style="margin-top: 10px;">
            <a href="https://yourapp.com/settings/notifications" style="color: #667eea;">Manage notification preferences</a>
        </p>
    </div>
</body>
</html>
    `;
}

// Keep your existing sendEmailNotification function for escalations
interface NotificationProps {
    email: string;
    reason: string;
    user_message: string;
    sessionId: string;
}

export async function sendEmailNotification({
    email,
    reason,
    user_message,
    sessionId
}: NotificationProps) {
    try {
        const { error } = await resend.emails.send({
            from: 'Support Bot <onboarding@resend.dev>',
            to: email,
            subject: '🚨 New Escalated Support Issue',
            html: `
                <p><strong>Reason:</strong> ${reason}</p>
                <p><strong>Last user message:</strong></p>
                <blockquote>${user_message}</blockquote>
                <p>Conversation ID: ${sessionId}</p>
            `
        });

        if (error) {
            return { message: "error" };
        }

        return { message: "success" };
    } catch (error) {
        return { message: "error" };
    }
}





export async function sendWarmLeadNotification({
    organizationEmail,
    leadName,
    leadEmail,
    score,
}: WarmLeadNotificationProps) {
    try {
        const { error } = await resend.emails.send({
            from: 'Support bot AI <alerts@resend.dev>',
            to: organizationEmail,
            subject: `💼 New Qualified Lead: ${leadName} (Score: ${score}/100)`,
            html: `
                <h2>New Warm Lead</h2>
                <p><strong>Name:</strong> ${leadName}</p>
                <p><strong>Email:</strong> ${leadEmail}</p>
                <p><strong>Score:</strong> ${score}/100</p>
                <p>This lead shows moderate interest. Follow up within 24 hours for best results.</p>
            `,
        });

        if (error) {
            console.error("Warm lead email notification failed:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error("Warm lead notification error:", error);
        return { success: false, error };
    }
}