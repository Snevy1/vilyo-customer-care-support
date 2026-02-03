import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { organizations, appointments } from '@/db/schema';
import { gte, and, eq, sql, inArray } from 'drizzle-orm';
import { sendEmailNotification } from '@/lib/email-notifications';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendBatchedEmails(emailPromises: Promise<any>[]) {
  const BATCH_SIZE = 10;
  for (let i = 0; i < emailPromises.length; i += BATCH_SIZE) {
    const batch = emailPromises.slice(i, i + BATCH_SIZE);
    await Promise.all(batch);
    if (i + BATCH_SIZE < emailPromises.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const allOrgs = await db.select().from(organizations);
    const orgIds = allOrgs.map(org => org.id);
    
    if (orgIds.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    // 1. Batch fetch weekly appointments for ALL organizations
    const weeklyAppointments = await db
      .select({
        organization_id: appointments.organization_id,
        count: sql<number>`count(*)`.as('count')
      })
      .from(appointments)
      .where(
        and(
          inArray(appointments.organization_id, orgIds),
          gte(appointments.created_at, sevenDaysAgo)
        )
      )
      .groupBy(appointments.organization_id);

    // 2. Fetch weekly leads from Supabase 
    
    const { data: weeklyLeads, error } = await supabaseAdmin
      .from('contacts')
      .select('organization_id, created_at')
      .in('organization_id', orgIds)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (error) {
      console.error('Supabase error:', error);
    }

    // Process Supabase results locally to get counts
    const leadsByOrg = new Map<string, number>();
    if (weeklyLeads) {
      weeklyLeads.forEach(lead => {
        const orgId = lead.organization_id;
        leadsByOrg.set(orgId, (leadsByOrg.get(orgId) || 0) + 1);
      });
    }

    // Convert appointments to Map
    const appointmentsMap = new Map<string, number>();
    weeklyAppointments.forEach(item => {
      // Ensure count is a number
      const count = typeof item.count === 'number' ? item.count : 
                   typeof item.count === 'bigint' ? Number(item.count) : 0;
      appointmentsMap.set(item.organization_id, count);
    });

    // 3. Prepare and send emails
    const emailPromises: Promise<any>[] = [];
    
    for (const org of allOrgs) {
      const apptCount = appointmentsMap.get(org.id) || 0;
      const leadCount = leadsByOrg.get(org.id) || 0;

      // Convert to numbers explicitly for comparison
      const apptCountNum = Number(apptCount);
      const leadCountNum = Number(leadCount);
      
      if (apptCountNum > 0 || leadCountNum > 0) {
        emailPromises.push(
          sendEmailNotification({
            email: org.owner_email,
            reason: "📊 Your Weekly Business Snapshot",
            user_message: `Hi ${org.name} team! Here is your performance for the last 7 days:
            
📅 New Appointments: ${apptCountNum}
👤 New Leads Captured: ${leadCountNum}

Log in to your dashboard to see details.`,
            sessionId: `weekly-report-${org.id}`
          }).catch(err => {
            console.error(`Failed to send email to ${org.owner_email}:`, err);
            return null; // Don't fail the entire batch if one email fails
          })
        );
      }
    }

    // Send emails in batches
    await sendBatchedEmails(emailPromises);

    return NextResponse.json({ 
      success: true, 
      processed: allOrgs.length,
      emailsSent: emailPromises.length 
    });
    
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}