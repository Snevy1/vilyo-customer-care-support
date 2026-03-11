"use client";

import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Building2, DollarSign,
  CreditCard, ArrowUpRight, ArrowDownRight, Activity, Calendar
} from "lucide-react";

// ─── Static Data ────────────────────────────────────────────────────────────

const monthlyGrowth = [
  { month: "Jan", orgs: 12, users: 48, revenue: 1840 },
  { month: "Feb", orgs: 19, users: 74, revenue: 2960 },
  { month: "Mar", orgs: 24, users: 95, revenue: 3720 },
  { month: "Apr", orgs: 31, users: 128, revenue: 4890 },
  { month: "May", orgs: 38, users: 159, revenue: 5940 },
  { month: "Jun", orgs: 44, users: 192, revenue: 7120 },
  { month: "Jul", orgs: 52, users: 231, revenue: 8350 },
  { month: "Aug", orgs: 61, users: 278, revenue: 9870 },
  { month: "Sep", orgs: 70, users: 324, revenue: 11200 },
  { month: "Oct", orgs: 79, users: 375, revenue: 12650 },
  { month: "Nov", orgs: 91, users: 431, revenue: 14300 },
  { month: "Dec", orgs: 104, users: 498, revenue: 16480 },
];

const revenueByProvider = [
  { name: "Stripe", value: 68400, color: "#6366f1" },
  { name: "Paystack", value: 29600, color: "#f59e0b" },
];

const planDistribution = [
  { name: "Pro", value: 67, color: "#18181b" },
  { name: "Free", value: 33, color: "#e4e4e7" },
];

const statusBreakdown = [
  { status: "Active", count: 81, color: "#10b981" },
  { status: "Inactive", count: 12, color: "#a1a1aa" },
  { status: "Past Due", count: 7, color: "#f59e0b" },
  { status: "Cancelled", count: 4, color: "#f43f5e" },
];

const topOrgs = [
  { name: "Acme Corp",        plan: "pro", users: 42, revenue: 2940, growth: 12.4 },
  { name: "Bright Ventures",  plan: "pro", users: 38, revenue: 2660, growth: 8.1  },
  { name: "Nova Systems",     plan: "pro", users: 31, revenue: 2170, growth: 21.3 },
  { name: "Orbit Labs",       plan: "pro", users: 27, revenue: 1890, growth: -3.2 },
  { name: "Stellar AI",       plan: "pro", users: 24, revenue: 1680, growth: 5.7  },
  { name: "Zenith Co",        plan: "free", users: 19, revenue: 0,   growth: 0    },
];

const weeklySignups = [
  { day: "Mon", orgs: 3, users: 14 },
  { day: "Tue", orgs: 5, users: 22 },
  { day: "Wed", orgs: 4, users: 18 },
  { day: "Thu", orgs: 7, users: 31 },
  { day: "Fri", orgs: 6, users: 26 },
  { day: "Sat", orgs: 2, users: 9  },
  { day: "Sun", orgs: 1, users: 5  },
];

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl border border-zinc-700 min-w-30">
      <p className="font-semibold text-zinc-300 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
            <span className="text-zinc-400 capitalize">{p.name}</span>
          </span>
          <span className="font-bold">{prefix}{p.value?.toLocaleString()}{suffix}</span>
        </div>
      ))}
    </div>
  );
};

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: string;
  change: number;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  delay: string;
}

const KpiCard = ({ label, value, change, sub, icon, accent, delay }: KpiProps) => {
  const up = change >= 0;
  return (
    <div className={`fade-in ${delay} bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">{label}</p>
        <div className={`p-2.5 rounded-xl ${accent}`}>{icon}</div>
      </div>
      <p className="text-[2rem] font-black text-zinc-900 leading-none tracking-tight">{value}</p>
      <div className="flex items-center gap-2 mt-2.5">
        <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(change)}%
        </span>
        <span className="text-xs text-zinc-400">{sub}</span>
      </div>
    </div>
  );
};

// ─── Section Header ──────────────────────────────────────────────────────────

const SectionHeader = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="mb-5">
    <h2 className="text-base font-bold text-zinc-900 tracking-tight">{title}</h2>
    {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = ["Overview", "Organizations", "Users", "Revenue"] as const;
type Tab = typeof TABS[number];

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "1y">("1y");

  const totalRevenue = revenueByProvider.reduce((a, b) => a + b.value, 0);
  const totalOrgs = monthlyGrowth[monthlyGrowth.length - 1].orgs;
  const totalUsers = monthlyGrowth[monthlyGrowth.length - 1].users;
  const currentRevenue = monthlyGrowth[monthlyGrowth.length - 1].revenue;
  const prevRevenue = monthlyGrowth[monthlyGrowth.length - 2].revenue;
  const revenueGrowth = (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-[#f7f7f5]" style={{ fontFamily: "'Syne', 'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        .fade-in { animation: fadeUp 0.4s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .d1{animation-delay:.04s} .d2{animation-delay:.08s} .d3{animation-delay:.12s} .d4{animation-delay:.16s}
        .d5{animation-delay:.2s}  .d6{animation-delay:.24s} .d7{animation-delay:.28s} .d8{animation-delay:.32s}
        .tab-active { background: #18181b; color: #fff; }
        .tab-inactive { background: transparent; color: #71717a; }
        .tab-inactive:hover { background: #f4f4f5; color: #3f3f46; }
        .range-active { background: #18181b; color: #fff; }
        .range-inactive { color: #71717a; }
        .range-inactive:hover { background: #f4f4f5; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 9999px; }
      `}</style>

      <div className="max-w-340 mx-auto px-6 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="fade-in flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-1.5">Admin Panel</p>
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight leading-none">Analytics</h1>
            <p className="text-sm text-zinc-400 mt-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Platform health, growth trends, and revenue overview.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl p-1 shadow-sm">
            {(["7d", "30d", "90d", "1y"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${range === r ? "range-active" : "range-inactive"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="fade-in d1 flex items-center gap-1.5 bg-white border border-zinc-200 rounded-2xl p-1.5 w-fit shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${activeTab === tab ? "tab-active shadow-sm" : "tab-inactive"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Revenue" value={`$${(totalRevenue / 1000).toFixed(1)}k`} change={+14.2} sub="vs last month" icon={<DollarSign className="h-4 w-4" />} accent="bg-violet-50 text-violet-600" delay="d1" />
          <KpiCard label="Organizations" value={String(totalOrgs)} change={+8.3} sub="vs last month" icon={<Building2 className="h-4 w-4" />} accent="bg-blue-50 text-blue-600" delay="d2" />
          <KpiCard label="Total Users" value={String(totalUsers)} change={+11.7} sub="vs last month" icon={<Users className="h-4 w-4" />} accent="bg-emerald-50 text-emerald-600" delay="d3" />
          <KpiCard label="MRR" value={`$${(currentRevenue).toLocaleString()}`} change={+Number(revenueGrowth)} sub="vs last month" icon={<CreditCard className="h-4 w-4" />} accent="bg-amber-50 text-amber-600" delay="d4" />
        </div>

        {/* ── Main Chart: Growth Over Time ── */}
        {(activeTab === "Overview" || activeTab === "Organizations" || activeTab === "Users") && (
          <div className="fade-in d5 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader
              title={activeTab === "Users" ? "User Growth" : activeTab === "Organizations" ? "Organization Growth" : "Platform Growth"}
              sub="Cumulative totals across all months"
            />
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyGrowth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradOrg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradUser" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a1a1aa", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e4e4e7", strokeWidth: 1 }} />
                {(activeTab === "Overview" || activeTab === "Organizations") && (
                  <Area type="monotone" dataKey="orgs" name="Orgs" stroke="#6366f1" strokeWidth={2} fill="url(#gradOrg)" dot={false} activeDot={{ r: 4, fill: "#6366f1" }} />
                )}
                {(activeTab === "Overview" || activeTab === "Users") && (
                  <Area type="monotone" dataKey="users" name="Users" stroke="#10b981" strokeWidth={2} fill="url(#gradUser)" dot={false} activeDot={{ r: 4, fill: "#10b981" }} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Revenue Chart ── */}
        {(activeTab === "Overview" || activeTab === "Revenue") && (
          <div className="fade-in d5 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="Monthly Recurring Revenue" sub="MRR trend across the year" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyGrowth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#a1a1aa", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ fill: "#f4f4f5", radius: 6 }} />
                <Bar dataKey="revenue" name="Revenue" fill="#18181b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Mid Row: Pie Charts + Weekly Bar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Plan distribution */}
          <div className="fade-in d6 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="Plan Split" sub="Pro vs Free organizations" />
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {planDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val}%`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-5 mt-2">
              {planDistribution.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color, border: p.color === "#e4e4e7" ? "1px solid #d4d4d8" : "none" }} />
                  <span className="text-zinc-500 font-medium">{p.name}</span>
                  <span className="font-black text-zinc-900">{p.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by provider */}
          <div className="fade-in d6 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="Revenue by Provider" sub="Stripe vs Paystack" />
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={revenueByProvider} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {revenueByProvider.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`$${val.toLocaleString()}`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-5 mt-2">
              {revenueByProvider.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="text-zinc-500 font-medium">{p.name}</span>
                  <span className="font-black text-zinc-900">${(p.value / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly signups */}
          <div className="fade-in d7 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="This Week" sub="Daily new signups" />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklySignups} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barSize={14} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#a1a1aa", fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f4f4f5" }} />
                <Bar dataKey="orgs" name="Orgs" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="users" name="Users" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Bottom Row: Status Breakdown + Top Orgs ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Status breakdown */}
          <div className="fade-in d7 lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="Subscription Status" sub="Current breakdown across all orgs" />
            <div className="space-y-3 mt-2">
              {statusBreakdown.map((s) => {
                const pct = Math.round((s.count / totalOrgs) * 100);
                return (
                  <div key={s.status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                        <span className="text-sm font-medium text-zinc-700">{s.status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400">{pct}%</span>
                        <span className="text-sm font-bold text-zinc-900 w-6 text-right">{s.count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: s.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Churn rate callout */}
            <div className="mt-6 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Churn Rate</p>
              <p className="text-2xl font-black text-zinc-900">3.8%</p>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600 font-semibold">-0.4%</span> vs last month
              </p>
            </div>
          </div>

          {/* Top organizations */}
          <div className="fade-in d8 lg:col-span-3 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="Top Organizations" sub="Ranked by revenue contribution" />
            <div className="space-y-1">
              {topOrgs.map((org, i) => (
                <div key={org.name} className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-zinc-50 transition-colors group">
                  <span className="text-xs font-black text-zinc-300 w-4 shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{org.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{org.users} users</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-zinc-900" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {org.revenue > 0 ? `$${org.revenue.toLocaleString()}` : "—"}
                    </p>
                    {org.growth !== 0 && (
                      <p className={`text-xs font-bold flex items-center justify-end gap-0.5 mt-0.5 ${org.growth > 0 ? "text-emerald-500" : "text-red-400"}`}>
                        {org.growth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(org.growth)}%
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg shrink-0 ${org.plan === "pro" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}>
                    {org.plan}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer note ── */}
        <p className="fade-in d8 text-center text-xs text-zinc-300 pb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Analytics data is static for demonstration. Connect your API endpoints to populate live data.
        </p>
      </div>
    </div>
  );
}