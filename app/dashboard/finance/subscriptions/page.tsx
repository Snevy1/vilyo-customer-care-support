"use client"

import React, { use, useEffect, useState } from 'react'
import { CheckCircle2, Globe, MessageSquare, Zap, CreditCard, Calendar, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { getSubscriptionData } from '@/lib/subscriptions/subscriptions';

type Organization = { id: string; name?: string };

type FullSub = {
  id: string;
  plan_tier?: string | null;
  current_period_end: Date;
};

type WaSub = {
  id: string;
  plan_tier?: string | null;
  current_period_end: Date;
};

type HistoryItem = {
  id: string;
  created_at?: Date | null;
  plan_tier?: string | null;
  provider?: string | null | undefined;
  subscription_id?: string | null | undefined;
  paystack_subscription_id?: string | null | undefined;
};

const SubscriptionPage = ({ searchParams }: { searchParams: Promise<{ success?: string }> }) => {
  const { success } = use(searchParams);
   const isNewlySuccessful = success === 'true';
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [waSubs, setWaSubs] = useState<WaSub[]>([]);
  const [fullSubs, setFullSubs] = useState<FullSub[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Step 1: Fetch subscriptions
        const subRes = await fetch("/api/subscriptions/activeSubs");
        if (!subRes.ok) throw new Error('Failed to fetch subscriptions');
         const subData = await subRes.json();
         console.log("subData", subData)
        setWaSubs(subData.waSubs);
        setFullSubs(subData.fullSubs);
        setHistory(subData.history);
      } catch (err) {
        console.error('Error loading subscription data:', err);
        setError('Failed to load billing information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const totalActivePlans = fullSubs.length + waSubs.length;

  return (
    <div className="min-h-screen bg-[#f7f7f5] font-['Geist',sans-serif] max-w-7xl mx-auto p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
        
        .plan-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .plan-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .fade-in {
          animation: fadeIn 0.4s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .success-banner {
          animation: slideDown 0.4s ease forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .shimmer {
          background: linear-gradient(90deg, #e8e8e6 25%, #f0f0ee 50%, #e8e8e6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        tr.row-hover:hover td {
          background: #f0f0ee;
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Success Banner */}
        {isNewlySuccessful && (
          <div className="success-banner flex items-center gap-3 px-5 py-4 bg-[#f0faf4] border border-[#b6e8c8] rounded-xl text-[#1a7a42]">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Payment confirmed</p>
              <p className="text-xs text-[#2d9d5a] mt-0.5">Your features are now active and ready to use.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="fade-in">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">Billing & Plans</p>
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Finance</h1>
              <p className="text-zinc-500 mt-1 text-sm">Manage subscriptions and view payment history.</p>
            </div>
            {!loading && totalActivePlans > 0 && (
              <div className="text-right">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl shadow-sm">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-zinc-700">{totalActivePlans} Active Plan{totalActivePlans !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading your billing data…</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-36 rounded-xl shimmer" />
              ))}
            </div>
            <div className="h-48 rounded-xl shimmer" />
          </div>
        )}

        {/* Subscriptions */}
        {!loading && !error && (
          <div className="fade-in space-y-8">

            {/* Active Plans */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4 text-amber-500" />
                <h2 className="text-base font-semibold text-zinc-800">Active Subscriptions</h2>
              </div>

              {totalActivePlans === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400">
                  <CreditCard className="h-8 w-8 mb-3 opacity-40" />
                  <p className="font-medium text-sm">No active subscriptions</p>
                  <p className="text-xs mt-1">Choose a plan to get started.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {fullSubs.map((sub) => {
                    const isFull = sub.plan_tier?.includes('full');
                    return (
                      <div key={sub.id} className={`plan-card border rounded-2xl p-5 bg-white shadow-sm relative overflow-hidden`}>
                        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${isFull ? 'bg-linear-to-r from-violet-500 to-purple-400' : 'bg-linear-to-r from-blue-500 to-cyan-400'}`} />
                        <div className="flex justify-between items-start mt-2 mb-5">
                          <div className={`p-2.5 rounded-xl ${isFull ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'}`}>
                            {isFull ? <Zap className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full tracking-wide">ACTIVE</span>
                        </div>
                        <h3 className="font-bold text-zinc-900 capitalize text-sm">
                          {sub.plan_tier?.replace(/-/g, ' ') || 'Plan'}
                        </h3>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Renews <span className="font-semibold text-zinc-600">
  {new Date(sub.current_period_end).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })}
</span></span>
                        </div>
                      </div>
                    );
                  })}

                  {waSubs.map((sub) => (
                    <div key={sub.id} className="plan-card border rounded-2xl p-5 bg-white shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-linear-to-r from-green-500 to-emerald-400" />
                      <div className="flex justify-between items-start mt-2 mb-5">
                        <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full tracking-wide">ACTIVE</span>
                      </div>
                      <h3 className="font-bold text-zinc-900 capitalize text-sm">
                        {sub.plan_tier?.replace(/-/g, ' ') || 'WhatsApp Plan'}
                      </h3>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Renews <span className="font-semibold text-zinc-600">
  {new Date(sub.current_period_end).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })}
</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Transaction History */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-4 w-4 text-zinc-400" />
                <h2 className="text-base font-semibold text-zinc-800">Transaction History</h2>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Date</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Plan</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Provider</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Reference</th>
                      <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {history.map((item) => (
                      <tr key={item.id} className="row-hover transition-colors cursor-default">
                        <td className="px-5 py-4 text-sm font-medium text-zinc-700">
  {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }) : 'N/A'}
</td>
                        <td className="px-5 py-4 text-sm text-zinc-700 capitalize">
                          {item.plan_tier?.replace(/-/g, ' ')}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-md">
                            {item.provider}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <code className="text-[11px] font-mono text-zinc-500 bg-zinc-50 px-2 py-1 rounded">
                            {item.subscription_id || item.paystack_subscription_id || '—'}
                          </code>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-600">Paid</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-14 text-center text-zinc-400 text-sm">
                          No transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;