import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { db } from "@/db/client";
import { conversation, messages } from "@/db/schema";
import { and, asc, eq, gte } from "drizzle-orm";
import { cookies } from "next/headers";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {

         // Get user from your session cookie (from your auth flow)
            const cookieStore = await cookies();
            const userSession = cookieStore.get('user_session')?.value;
            
            if (!userSession) {
              return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            
            const {  organization_id } = JSON.parse(userSession);

        // Use Date objects instead of ISO strings for Drizzle
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // For Supabase, convert to ISO string
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
        const sevenDaysAgoISO = sevenDaysAgo.toISOString();

        // Fetch leads data
        const { data: leads } = await supabaseAdmin
            .from('contacts')
            .select('lead_score, lead_quality, created_at')
            .eq('organization_id',  organization_id)
            .gte('created_at', thirtyDaysAgoISO);

        // Fetch leads from last 7 days for comparison
        const { data: recentLeads } = await supabaseAdmin
            .from('contacts')
            .select('lead_score, lead_quality, created_at')
            .eq('organization_id',  organization_id)
            .gte('created_at', sevenDaysAgoISO);


        // Fetch conversations - use Date object for Drizzle
        const conversations = await db
          .select({
            id: conversation.id,
            created_at: conversation.created_at,
            chatbot_id: conversation.chatbot_id,
          })
          .from(conversation)
          .where(
            and(
              eq(conversation.chatbot_id,  organization_id),
              gte(conversation.created_at, thirtyDaysAgo)
            )
          );

        // Fetch messages - use Date object for Drizzle
        const messagesData = await db
          .select({
            role: messages.role,
            created_at: messages.created_at,
            conversation_id: messages.conversation_id,
          })
          .from(messages)
          .where(gte(messages.created_at, thirtyDaysAgo))
          .orderBy(asc(messages.created_at));

        

        if (!leads) {
            return NextResponse.json({
                total_leads: 0,
                hot_leads: 0,
                warm_leads: 0,
                cold_leads: 0,
                unqualified_leads: 0,
                avg_score: 0,
                total_conversations: 0,
                conversion_rate: 0,
                avg_response_time: 0,
                weekly_trend: 0,
                daily_breakdown: [],
                estimated_value: 0
            });
        }

        // Calculate metrics
        const totalLeads = leads.length;
        const hotLeads = leads.filter(l => l.lead_quality === 'hot').length;
        const warmLeads = leads.filter(l => l.lead_quality === 'warm').length;
        const coldLeads = leads.filter(l => l.lead_quality === 'cold').length;
        const unqualifiedLeads = leads.filter(l => l.lead_quality === 'unqualified').length;
        const avgScore = totalLeads > 0 ? leads.reduce((acc, l) => acc + (l.lead_score || 0), 0) / totalLeads : 0;

        // Calculate weekly trend
        const recentLeadsCount = recentLeads?.length || 0;
        const previousWeekCount = totalLeads - recentLeadsCount;
        const weeklyTrend = previousWeekCount > 0 
            ? ((recentLeadsCount - previousWeekCount) / previousWeekCount) * 100 
            : 0;

        // Calculate conversion rate
        const totalConversations = conversations?.length || 0;
        const conversionRate = totalConversations > 0 
            ? (totalLeads / totalConversations) * 100 
            : 0;

        // Calculate average response time (in seconds)
        let avgResponseTime = 0;
        if (messagesData && messagesData.length > 0) {
            const conversationMap = new Map();
            messagesData.forEach(msg => {
                if (!conversationMap.has(msg.conversation_id)) {
                    conversationMap.set(msg.conversation_id, []);
                }
                conversationMap.get(msg.conversation_id).push(msg);
            });

            let totalResponseTime = 0;
            let responseCount = 0;

            conversationMap.forEach(msgs => {
                for (let i = 0; i < msgs.length - 1; i++) {
                    if (msgs[i].role === 'user' && msgs[i + 1].role === 'assistant') {
                        const userTime = new Date(msgs[i].created_at).getTime();
                        const assistantTime = new Date(msgs[i + 1].created_at).getTime();
                        totalResponseTime += (assistantTime - userTime) / 1000; // Convert to seconds
                        responseCount++;
                    }
                }
            });

            avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
        }

        // Daily breakdown for chart
        const dailyBreakdown = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString();
            const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString();

            const dayLeads = leads.filter(l => {
                const created = new Date(l.created_at);
                return created >= new Date(dayStart) && created <= new Date(dayEnd);
            });

            dailyBreakdown.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                leads: dayLeads.length,
                hot: dayLeads.filter(l => l.lead_quality === 'hot').length,
            });
        }

        // Estimated pipeline value
        const estimatedValue = (hotLeads * 500) + (warmLeads * 200) + (coldLeads * 50);

        return NextResponse.json({
            total_leads: totalLeads,
            hot_leads: hotLeads,
            warm_leads: warmLeads,
            cold_leads: coldLeads,
            unqualified_leads: unqualifiedLeads,
            avg_score: Math.round(avgScore),
            total_conversations: totalConversations,
            conversion_rate: Math.round(conversionRate * 10) / 10,
            avg_response_time: Math.round(avgResponseTime * 10) / 10,
            weekly_trend: Math.round(weeklyTrend * 10) / 10,
            daily_breakdown: dailyBreakdown,
            estimated_value: estimatedValue
        });

    } catch (error) {
        console.error('Analytics fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}