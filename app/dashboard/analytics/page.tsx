
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
    TrendingUp, 
    TrendingDown, 
    Users, 
    MessageSquare, 
    Target, 
    Clock, 
    DollarSign,
    Flame,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsData {
    total_leads: number;
    hot_leads: number;
    warm_leads: number;
    cold_leads: number;
    unqualified_leads: number;
    avg_score: number;
    total_conversations: number;
    conversion_rate: number;
    avg_response_time: number;
    weekly_trend: number;
    daily_breakdown: { date: string; leads: number; hot: number }[];
    estimated_value: number;
}


interface OrganizationData {
  id:string;
  business_name:string;
  website_url:string;
  created_at:string;
}


const AnalyticsPage = () => {
    

    

    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch(`/api/analytics/fetch`);
                const analyticsData = await res.json();
                setData(analyticsData);
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    },[]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-black">
                <p className="text-zinc-500">Failed to load analytics</p>
            </div>
        );
    }

    const formatResponseTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h`;
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-black p-6 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Analytics Overview</h1>
                        <p className="text-sm text-zinc-500 mt-1">Last 30 days performance</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full",
                            data.weekly_trend > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        )}>
                            {data.weekly_trend > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : (
                                <TrendingDown className="w-3 h-3" />
                            )}
                            <span>{Math.abs(data.weekly_trend)}% vs last week</span>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Conversations"
                        value={data.total_conversations}
                        icon={<MessageSquare className="w-5 h-5" />}
                        iconBg="bg-blue-500/10"
                        iconColor="text-blue-500"
                        trend={`${data.conversion_rate}% convert to leads`}
                    />
                    <MetricCard
                        title="Leads Captured"
                        value={data.total_leads}
                        icon={<Users className="w-5 h-5" />}
                        iconBg="bg-indigo-500/10"
                        iconColor="text-indigo-500"
                        trend={`${data.weekly_trend > 0 ? '+' : ''}${data.weekly_trend}% this week`}
                        trendUp={data.weekly_trend > 0}
                    />
                    <MetricCard
                        title="Hot Leads"
                        value={data.hot_leads}
                        icon={<Flame className="w-5 h-5" />}
                        iconBg="bg-red-500/10"
                        iconColor="text-red-500"
                        trend={`${Math.round((data.hot_leads / data.total_leads) * 100 || 0)}% of total`}
                    />
                    <MetricCard
                        title="Avg Response Time"
                        value={formatResponseTime(data.avg_response_time)}
                        icon={<Clock className="w-5 h-5" />}
                        iconBg="bg-emerald-500/10"
                        iconColor="text-emerald-500"
                        trend="Average bot response"
                    />
                </div>

                {/* Lead Quality Distribution & Daily Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* Lead Quality Card */}
                    <div className="bg-[#0A0A0E] border border-white/5 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Lead Quality Distribution</h2>
                        <div className="space-y-4">
                            <QualityBar
                                label="🔥 Hot Leads"
                                count={data.hot_leads}
                                total={data.total_leads}
                                color="bg-red-500"
                                score={data.avg_score}
                            />
                            <QualityBar
                                label="💼 Warm Leads"
                                count={data.warm_leads}
                                total={data.total_leads}
                                color="bg-yellow-500"
                            />
                            <QualityBar
                                label="❄️ Cold Leads"
                                count={data.cold_leads}
                                total={data.total_leads}
                                color="bg-blue-500"
                            />
                            <QualityBar
                                label="❌ Unqualified"
                                count={data.unqualified_leads}
                                total={data.total_leads}
                                color="bg-zinc-600"
                            />
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400">Average Lead Score</span>
                                <span className="text-white font-semibold text-lg">{data.avg_score}/100</span>
                            </div>
                        </div>
                    </div>

                    {/* Daily Breakdown Chart */}
                    <div className="bg-[#0A0A0E] border border-white/5 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">7-Day Lead Trend</h2>
                        <div className="space-y-3">
                            {data.daily_breakdown.map((day, idx) => {
                                const maxLeads = Math.max(...data.daily_breakdown.map(d => d.leads));
                                const barWidth = maxLeads > 0 ? (day.leads / maxLeads) * 100 : 0;
                                
                                return (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-zinc-400 w-12">{day.date}</span>
                                            <div className="flex items-center gap-2">
                                                {day.hot > 0 && (
                                                    <span className="text-red-500 text-[10px]">
                                                        {day.hot} 🔥
                                                    </span>
                                                )}
                                                <span className="text-white font-medium">
                                                    {day.leads}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-zinc-900 rounded-full h-2">
                                            <div
                                                className="bg-linear-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ROI Estimator */}
                <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg p-6 border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-5 h-5 text-white" />
                                <h2 className="text-lg font-semibold text-white">Estimated Pipeline Value</h2>
                            </div>
                            <p className="text-4xl font-bold text-white mb-2">
                                ${data.estimated_value.toLocaleString()}
                            </p>
                            <p className="text-sm text-white/80">
                                Based on {data.hot_leads} hot leads (avg $500) + {data.warm_leads} warm leads (avg $200) + {data.cold_leads} cold leads (avg $50)
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <Target className="w-24 h-24 text-white/20" />
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-white/60 text-xs mb-1">Conversion Rate</p>
                            <p className="text-white font-semibold">{data.conversion_rate}%</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-xs mb-1">Total Leads</p>
                            <p className="text-white font-semibold">{data.total_leads}</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-xs mb-1">High Quality</p>
                            <p className="text-white font-semibold">
                                {Math.round(((data.hot_leads + data.warm_leads) / data.total_leads) * 100 || 0)}%
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// MetricCard Component
function MetricCard({
    title,
    value,
    icon,
    iconBg,
    iconColor,
    trend,
    trendUp
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    trend?: string;
    trendUp?: boolean;
}) {
    return (
        <div className="bg-[#0A0A0E] border border-white/5 rounded-lg p-5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-400 text-sm">{title}</span>
                <div className={cn("p-2 rounded-lg", iconBg, iconColor)}>
                    {icon}
                </div>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{value}</p>
            {trend && (
                <p className={cn(
                    "text-xs flex items-center gap-1",
                    trendUp === undefined ? "text-zinc-500" :
                    trendUp ? "text-emerald-500" : "text-red-500"
                )}>
                    {trendUp !== undefined && (
                        trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                    )}
                    {trend}
                </p>
            )}
        </div>
    );
}

// QualityBar Component
function QualityBar({
    label,
    count,
    total,
    color,
    score
}: {
    label: string;
    count: number;
    total: number;
    color: string;
    score?: number;
}) {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
        <div>
            <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-zinc-300">{label}</span>
                <span className="text-white font-semibold">
                    {count} <span className="text-zinc-500 font-normal">({percentage.toFixed(0)}%)</span>
                </span>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-2.5">
                <div
                    className={cn(color, "h-2.5 rounded-full transition-all duration-500")}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export default AnalyticsPage;