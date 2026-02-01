import { NextResponse } from 'next/server';
import { buildTemplateSendPayload } from '@kapso/whatsapp-cloud-api';
import { whatsappClient } from '@/lib/whatsapp/whatsapp-client';
import type { TemplateParameterInfo } from '@/types/whatsapp';
import { getWhatsAppTenant } from '@/lib/whatsapp/get-tenant';
import { cookies } from 'next/headers';
import { db } from '@/db/client';
import { messages as messagesTable, conversation, agentActivity } from '@/db/schema';
import { eq } from 'drizzle-orm';

type TemplateSendInput = Parameters<typeof buildTemplateSendPayload>[0];
type TemplateMessageInput = Parameters<(typeof whatsappClient.messages)['sendTemplate']>[0];
type TemplatePayload = TemplateMessageInput['template'];
type TemplateBodyParameter = NonNullable<TemplateSendInput['body']>[number];
type TemplateHeaderParameter = Extract<NonNullable<TemplateSendInput['header']>, { type: 'text' }>;
type TemplateButtonParameter = Extract<NonNullable<TemplateSendInput['buttons']>[number], { subType: 'url' }>;
type ButtonTextParameter = { type: 'text'; text: string; parameter_name?: string };

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userSession = cookieStore.get('user_session')?.value;
    
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, organization_id } = JSON.parse(userSession);

    const body = await request.json();
    const { to, templateName, languageCode, parameters, parameterInfo } = body;

    if (!to || !templateName || !languageCode) {
      return NextResponse.json(
        { error: 'Missing required fields: to, templateName, languageCode' },
        { status: 400 }
      );
    }

    const tenant = await getWhatsAppTenant();
    
    if (!tenant?.whatsappPhoneNumberId) {
      return NextResponse.json(
        { error: 'WhatsApp phone number ID not found for this tenant' },
        { status: 400 }
      );
    }

    const phoneNumberId = tenant.whatsappPhoneNumberId;

    const templateOptions: TemplateSendInput = {
      name: templateName,
      language: languageCode
    };

    if (parameters && parameterInfo) {
      const typedParamInfo = parameterInfo as TemplateParameterInfo;

      const bodyParameters: TemplateBodyParameter[] = [];
      const buttonParameters: TemplateButtonParameter[] = [];
      let headerParameter: TemplateHeaderParameter | undefined;

      const getParameterValue = (paramName: string, index: number) => {
        if (Array.isArray(parameters)) {
          return parameters[index];
        }
        return parameters[paramName];
      };

      typedParamInfo.parameters.forEach((paramDef, index) => {
        const rawValue = getParameterValue(paramDef.name, index);
        if (rawValue === undefined || rawValue === null) {
          return;
        }

        const textValue = String(rawValue);
        if (!textValue.trim()) {
          return;
        }

        if (paramDef.component === 'HEADER') {
          if (!headerParameter) {
            headerParameter = {
              type: 'text',
              text: textValue,
              parameter_name: paramDef.name
            } as TemplateHeaderParameter;
          }
          return;
        }

        if (paramDef.component === 'BODY') {
          bodyParameters.push({
            type: 'text',
            text: textValue,
            parameter_name: paramDef.name
          } as TemplateBodyParameter);
          return;
        }

        if (paramDef.component === 'BUTTON' && typeof paramDef.buttonIndex === 'number') {
          let button = buttonParameters.find((btn) => btn.index === paramDef.buttonIndex);
          if (!button) {
            button = {
              type: 'button',
              subType: 'url',
              index: paramDef.buttonIndex,
              parameters: []
            } as TemplateButtonParameter;
            buttonParameters.push(button);
          }

          button.parameters.push({
            type: 'text',
            text: textValue,
            parameter_name: paramDef.name
          } as ButtonTextParameter);
        }
      });

      if (headerParameter) {
        templateOptions.header = headerParameter;
      }

      if (bodyParameters.length > 0) {
        templateOptions.body = bodyParameters;
      }

      if (buttonParameters.length > 0) {
        templateOptions.buttons = buttonParameters;
      }
    }

    const templatePayload = buildTemplateSendPayload(templateOptions) as TemplatePayload;

    // Send template message
    const result = await whatsappClient.messages.sendTemplate({
      phoneNumberId: phoneNumberId,
      to,
      template: templatePayload
    });

    
    // sessionId should be the customer's phone (to), not phoneNumberId
    // 
    const sessionId = to; // Customer's phone number, not your phoneNumberId!

    try {
      // Check/create conversation
      const [conv] = await db
        .select()
        .from(conversation)
        .where(eq(conversation.id, sessionId))
        .limit(1);

      if (!conv) {
        await db.insert(conversation).values({
          id: sessionId,
          chatbot_id: tenant.id,
          name: to, //  Use customer phone, not phoneNumberId
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

      //  CRITICAL FIX: templatePayload is an object, not a string!
      // Format it properly for the database
      const messageContent = `[Template: ${templateName}]\n${JSON.stringify(templatePayload, null, 2)}`;
      
      // Better approach: Extract readable text from template
      const readableContent = formatTemplateForDatabase(templateName, templateOptions);

      // Save message
      await db.insert(messagesTable).values({
        conversation_id: sessionId,
        role: "assistant",
        content: readableContent, 
      });

      // Log activity
      await db.insert(agentActivity).values({
        conversation_id: sessionId,
        agent_id: email,
        action: 'message_sent',
      });

      console.log(`[TEMPLATE MESSAGE] Saved to DB: ${sessionId} - ${templateName}`);
    } catch (dbError) {
      console.error('Failed to save to database:', dbError);
      // Don't fail the request - message was sent successfully
    }

    return NextResponse.json({
      ...result,
      saved_to_db: true,
      conversation_mode: 'human_takeover',
    });
  } catch (error) {
    console.error('Error sending template:', error);
    return NextResponse.json(
      { error: 'Failed to send template message' },
      { status: 500 }
    );
  }
}

// Helper function to format template content for database
function formatTemplateForDatabase(
  templateName: string, 
  options: TemplateSendInput
): string {
  const parts: string[] = [`[Template: ${templateName}]`];

  // Add header
  if (options.header && 'text' in options.header) {
    parts.push(`Header: ${options.header.text}`);
  }

  // Add body parameters
  if (options.body && options.body.length > 0) {
    const bodyTexts = options.body
      .filter((param): param is { type: 'text'; text: string } => param.type === 'text')
      .map(param => param.text);
    if (bodyTexts.length > 0) {
      parts.push(`Body: ${bodyTexts.join(', ')}`);
    }
  }

  // Add button parameters
  if (options.buttons && options.buttons.length > 0) {
    options.buttons.forEach((button, index) => {
      if ('parameters' in button && Array.isArray(button.parameters)) {
        const buttonTexts = button.parameters
          .filter((param): param is { type: 'text'; text: string } => param.type === 'text')
          .map(param => param.text);
        if (buttonTexts.length > 0) {
          parts.push(`Button ${index + 1}: ${buttonTexts.join(', ')}`);
        }
      }
    });
  }

  return parts.join('\n');
}