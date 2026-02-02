// lib/notifications-enhanced.ts
import { db } from "@/db/client";
import { organizations, notificationSettings, webhookLogs, notificationLogs } from "@/db/schema";
import { eq} from "drizzle-orm";
import { sendEmailNotification } from "../email-notifications";
import twilio from "twilio";
import { createHmac } from "crypto";
import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import tracer from 'dd-trace';
import net from 'net';
import crypto from 'crypto';

import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';

// =====================================================
// DATADOG INIT
// =====================================================
if (process.env.DD_ENABLED === 'true') {
  tracer.init({
    service: 'notification-service',
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0',
  });
  console.log('📊 Datadog tracing enabled');
}

// =====================================================
// CONFIGURATION
// =====================================================
const config = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  webhookSecret: process.env.WEBHOOK_SECRET || 'change-in-production',
  twilioSid: process.env.TWILIO_ACCOUNT_SID,
  twilioToken: process.env.TWILIO_AUTH_TOKEN,
  twilioNumber: process.env.TWILIO_PHONE_NUMBER,
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  defaultSlaMs: parseInt(process.env.WEBHOOK_SLA_MS || '5000'),
  circuitBreakerMaxFailures: 10,
  circuitBreakerResetMinutes: 60,
};

// Validate required config
const required = ['redisUrl', 'webhookSecret', 'twilioSid', 'twilioToken', 'twilioNumber'];
required.forEach(key => {
  if (!config[key as keyof typeof config]) {
    throw new Error(`Missing required config: ${key}`);
  }
});

// =====================================================
// REDIS & QUEUE
// =====================================================
const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

const notificationQueue = new Queue("notifications", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { age: 3600 * 24, count: 2000 },
    removeOnFail: { age: 86400 * 7, count: 5000 },
  },
});

const RETRY_POLICIES = {
  sms: { attempts: 2, backoff: { type: "fixed", delay: 1000 } },
  email: { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
  webhook: { attempts: 5, backoff: { type: "exponential", delay: 2000 } },
};

const PRIORITIES = {
  sms: 1,
  email: 2,
  webhook: 3,
} as const;

// =====================================================
// TYPES
// =====================================================
type NotificationType = "APPOINTMENT_BOOKED" | "LEAD_GENERATED" | "PAYMENT_RECEIVED" | "CANCELLATION";

interface NotificationJobData {
  idempotencyKey: string;
  orgId: string;
  type: NotificationType;
  channel: 'sms' | 'email' | 'webhook';
  timestamp: string;
  metadata?: Record<string, any>;
}

interface SmsJobData extends NotificationJobData {
  channel: 'sms';
  to: string;
  body: string;
}

interface EmailJobData extends NotificationJobData {
  channel: 'email';
  to: string;
  subject: string;
  html?: string;
  text: string;
}

interface WebhookJobData extends NotificationJobData {
  channel: 'webhook';
  url: string;
  payload: any;
  template?: 'slack' | 'discord' | 'generic';
}




// =====================================================
// VALIDATION & FORMATTING
// =====================================================

async function isPublicHost(hostname: string): Promise<boolean> {
  const records = await dns.lookup(hostname, { all: true });
  return records.every(r => {
    const addr = ipaddr.parse(r.address);
    return addr.range() === 'unicast';
  });
}
const validators = {
  phone: (phone: string) => /^\+[1-9]\d{1,14}$/.test(phone),
  email: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
 url: async (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && process.env.NODE_ENV === 'production') return false;

    if (parsed.hostname === 'localhost') return false;

    return await isPublicHost(parsed.hostname);
  } catch {
    return false;
  }
},

};

const formatters = {
  sanitize: (text: string, max: number = 1000) =>
    text.substring(0, max).replace(/[^\w\s\-.,!?@]/g, '').trim(),

  webhookPayload: (data: {
    type: NotificationType;
    title: string;
    message: string;
    orgId: string;
    customData?: any;
    template?: string;
  }) => {
    const base = {
      event: data.type.toLowerCase().replace(/_/g, '.'),
      timestamp: new Date().toISOString(),
      organization_id: data.orgId,
      data: {
        title: data.title,
        message: data.message,
        ...data.customData,
      },
    };
    if (data.template === 'slack') {
      return {
        blocks: [{
          type: 'section',
          text: { type: 'mrkdwn', text: `*${data.title}*\n${data.message}` },
        }],
        metadata: base,
      };
    }
    return base;
  },
};

// =====================================================
// WEBHOOK DELIVERY WITH PERSISTENT CIRCUIT BREAKER
// =====================================================
class WebhookDelivery {
  async deliver(
    url: string,
    payload: any,
    orgId: string,
    prefs: any
  ): Promise<{ success: boolean; error?: string; statusCode?: number }> {
    const span = tracer.startSpan('webhook_delivery');
    span.addTags({ 'webhook.url': url, 'org.id': orgId });

    const timestamp = Date.now().toString();
const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;

const signature = createHmac('sha256', config.webhookSecret)
  .update(signedPayload)
  .digest('hex');


    try {
      // Check Circuit Breaker (DB Backed)
      const isThrottled = prefs.webhook_failure_count >= config.circuitBreakerMaxFailures && 
                          prefs.webhook_retry_at && new Date(prefs.webhook_retry_at) > new Date();

      if (isThrottled || !prefs.webhook_enabled) {
        span.setTag('circuit_breaker', 'open');
        return { success: false, error: 'Circuit breaker open or webhook disabled' };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const startTime = Date.now();

      const signature = createHmac('sha256', config.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
  'Content-Type': 'application/json',
  'X-Webhook-Signature': signature,
  'X-Webhook-Timestamp': timestamp,
  'X-Webhook-Id': `wh_${crypto.randomUUID()}`,
  'User-Agent': 'YourApp-Notifications/1.1',
},

        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const duration = Date.now() - startTime;
      clearTimeout(timeout);

      await this.logDelivery(orgId, url, {
        status: response.ok ? 'delivered' : 'failed',
        status_code: response.status,
        response_time: duration,
        payload,
      });

      if (!response.ok) {
        await this.recordFailure(orgId, prefs.webhook_failure_count);
        throw new Error(`HTTP ${response.status}`);
      }

      await this.recordSuccess(orgId);
      return { success: true, statusCode: response.status };
    } catch (error: any) {
      span.setTag('error', true);
      return { success: false, error: error.message };
    } finally {
      span.finish();
    }
  }

  async recordFailure(orgId: string, currentFailures: number) {
    const newCount = (currentFailures || 0) + 1;
    const retryAt = new Date(Date.now() + config.circuitBreakerResetMinutes * 60000);
    
    await db.update(notificationSettings)
      .set({ 
        webhook_failure_count: newCount,
        webhook_retry_at: retryAt,
        webhook_verification_status: 'failed'
      })
      .where(eq(notificationSettings.organization_id, orgId));
  }

  async recordSuccess(orgId: string) {
    await db.update(notificationSettings)
      .set({
        webhook_verification_status: 'verified',
        webhook_last_delivered_at: new Date(),
        webhook_failure_count: 0,
        webhook_retry_at: null,
      })
      .where(eq(notificationSettings.organization_id, orgId));
  }

  private async logDelivery(orgId: string, url: string, data: any) {
    await db.insert(webhookLogs).values({
      org_id: orgId,
      url,
      ...data,
      created_at: new Date(),
    }).catch(e => console.error('Log error:', e));
  }

  sendMetrics(metric: string, value: number, tags?: Record<string, string>) {
    if (!config.enableMetrics) return;
    console.log(`[METRIC] ${metric}=${value} ${JSON.stringify(tags)}`);
  }
}

// =====================================================
// WORKER IMPLEMENTATION
// =====================================================
const webhookDelivery = new WebhookDelivery();
const twilioClient = twilio(config.twilioSid, config.twilioToken);

export const notificationWorker = new Worker<NotificationJobData>(
  "notifications",

  
  async (job: Job<NotificationJobData>) => {
    const span = tracer.startSpan('notification_worker');
    try {
      switch (job.data.channel) {
        case 'sms': {
          const data = job.data as SmsJobData;
          await twilioClient.messages.create({
            body: formatters.sanitize(data.body),
            from: config.twilioNumber!,
            to: data.to,
          });
          break;
        }
        case 'email': {
          const data = job.data as EmailJobData;
          await sendEmailNotification({
            email: data.to,
            reason: formatters.sanitize(data.subject, 200),
            user_message: data.html || formatters.sanitize(data.text, 1000),
            sessionId: 'system',
          });
          break;
        }
        case 'webhook': {
          const data = job.data as WebhookJobData;
          // Fresh check from DB to see if we should still attempt
          const prefs = await db.query.notificationSettings.findFirst({
            where: eq(notificationSettings.organization_id, data.orgId),
          });
          if (!prefs) return;
          const res = await webhookDelivery.deliver(data.url, data.payload, data.orgId, prefs);
          if (!res.success) throw new Error(res.error);
          break;
        }
      }
    } finally {
      span.finish();
    }
  },
  { connection: redis, concurrency: 20, limiter: { max: 100, duration: 1000 } }
);

// =====================================================
// MAIN NOTIFY FUNCTION
// =====================================================
export async function notifyOwner(params: {
  orgId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}) {
  const { orgId, type, title, message, data } = params;
  if (!orgId) throw new Error('orgId is required');

  const [prefs, org] = await Promise.all([
    db.query.notificationSettings.findFirst({ where: eq(notificationSettings.organization_id, orgId) }),
    db.query.organizations.findFirst({ where: eq(organizations.id, orgId) }),
  ]);

  if (!org) throw new Error(`Organization ${orgId} not found`);

  const cleanTitle = formatters.sanitize(title, 200);
  const cleanMessage = formatters.sanitize(message, 1000);
  const idempotencyBase = `${orgId}:${type}:${data?.id ?? Date.now()}`;
  const channels: string[] = [];
  const jobs: Promise<any>[] = [];

  // SMS logic
  const phone = prefs?.notification_phone || org.owner_phone;
  if (prefs?.sms_enabled && phone && validators.phone(phone)) {
    channels.push('sms');
    jobs.push(notificationQueue.add('sms', {
      idempotencyKey: `${idempotencyBase}:sms`,
      orgId, type, channel: 'sms', timestamp: new Date().toISOString(),
      to: phone, body: `${cleanTitle}: ${cleanMessage}`,
    }, { jobId: `${idempotencyBase}:sms`, priority: PRIORITIES.sms, ...RETRY_POLICIES.sms }));
  }

  // Email logic
  const email = prefs?.notification_email || org.owner_email;
  if (prefs?.email_enabled && email && validators.email(email)) {
    channels.push('email');
    jobs.push(notificationQueue.add('email', {
      idempotencyKey: `${idempotencyBase}:email`,
      orgId, type, channel: 'email', timestamp: new Date().toISOString(),
      to: email, subject: cleanTitle, text: cleanMessage, html: data?.html,
    }, { jobId: `${idempotencyBase}:email`, priority: PRIORITIES.email, ...RETRY_POLICIES.email }));
  }

  // Webhook logic
  if (prefs?.webhook_enabled && prefs.webhook_url && await  validators.url(prefs.webhook_url)) {
    channels.push('webhook');
    const payload = formatters.webhookPayload({ type, title: cleanTitle, message: cleanMessage, orgId, customData: data, template: prefs.webhook_template as any });
    jobs.push(notificationQueue.add('webhook', {
      idempotencyKey: `${idempotencyBase}:webhook`,
      orgId, type, channel: 'webhook', timestamp: new Date().toISOString(),
      url: prefs.webhook_url, payload, template: prefs.webhook_template,
    }, { jobId: `${idempotencyBase}:webhook`, priority: PRIORITIES.webhook, ...RETRY_POLICIES.webhook }));
  }

  await Promise.all(jobs);
  await db.insert(notificationLogs).values({
    org_id: orgId, event_type: type, title: cleanTitle, message: cleanMessage,
    channels, created_at: new Date(),
  }).catch(e => console.error(e));

  return { success: true, channels };
}

// =====================================================
// UTILITIES & SHUTDOWN
// =====================================================
export async function testWebhook(orgId: string, webhookUrl: string) {
  if (!validators.url(webhookUrl)) return { success: false, error: 'Invalid URL (SSRF or Protocol check failed)' };
  const prefs = await db.query.notificationSettings.findFirst({ where: eq(notificationSettings.organization_id, orgId) });
  const testPayload = formatters.webhookPayload({ type: 'APPOINTMENT_BOOKED', title: 'Test', message: 'Test Ping', orgId });
  return await webhookDelivery.deliver(webhookUrl, testPayload, orgId, prefs || {});
}

export async function getSystemHealth() {
  try {
    const counts = await notificationQueue.getJobCounts();
    const redisPing = await redis.ping().catch(() => null);
    return {
      status: redisPing === 'PONG' ? 'healthy' : 'unhealthy',
      metrics: { queued: counts.waiting, active: counts.active, failed: counts.failed },
    };
  } catch (e) { return { status: 'error' }; }
}

process.on('SIGTERM', async () => {
  await notificationWorker.close();
  await notificationQueue.close();
  await redis.quit();
  process.exit(0);
});