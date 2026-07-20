'use client';

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { UsageProgressBar } from '@/components/subscription/UsageProgressBar';
import { ShieldCheck, Calendar, ShieldAlert, Sparkles, RefreshCcw, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionData {
  plan: {
    id: string;
    name: string;
    slug: string;
    price_monthly: number;
    price_yearly: number | null;
    max_orders_per_month: number | null;
    max_users: number | null;
    max_pickup_addresses: number | null;
  };
  pending_plan: {
    name: string;
  } | null;
  status: 'active' | 'grace_period' | 'suspended' | 'cancelled';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  grace_period_ends_at: string | null;
  auto_renew: boolean;
  usage: {
    orders_count: number;
    orders_limit: number | null;
    users_count: number;
    users_limit: number | null;
    pickup_addresses_limit: number | null;
  };
}

export default function TenantSubscriptionDashboardPage() {
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/v1/subscription', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to load subscription details');
      }

      const body = await res.json();
      setSubData(body.data);
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!subData || toggling) return;
    try {
      setToggling(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/v1/subscription/auto-renew', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const body = await res.json();
        setSubData({ ...subData, auto_renew: body.data.auto_renew });
      }
    } catch (err) {
      alert('Failed to toggle auto renewal status.');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !subData) {
    return (
      <div className="max-w-md mx-auto bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-5 space-y-2">
        <ShieldAlert className="h-5 w-5 shrink-0" />
        <p>{error || 'No subscription data found.'}</p>
      </div>
    );
  }

  const cycleText = subData.billing_cycle === 'yearly' ? 'Yearly billing cycle' : 'Monthly billing cycle';
  const renewalDate = new Date(subData.current_period_end).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Subscription Plan</h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Monitor your usage allocations, auto-renewals status, and change subscription tiers.
        </p>
      </div>

      {/* Plan Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Current Plan Card (2 cols wide on desktop) */}
        <Card className="md:col-span-2 bg-white dark:bg-[#131620] border border-gray-200/80 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">{subData.plan.name} Tier</h3>
              </div>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                subData.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
              }`}>
                {subData.status.toUpperCase()}
              </span>
            </div>

            {/* Grace period notice */}
            {subData.status === 'grace_period' && subData.grace_period_ends_at && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl p-3.5 text-xs">
                <strong>Attention Required:</strong> Wallet auto-debit failed. Recharge before{' '}
                {new Date(subData.grace_period_ends_at).toLocaleDateString('en-IN')} to prevent workspace suspension.
              </div>
            )}

            {/* Pending plan check */}
            {subData.pending_plan && (
              <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-800 dark:text-purple-300 rounded-xl p-3.5 text-xs">
                <strong>Scheduled:</strong> Workspace will downgrade to **{subData.pending_plan.name}** at the end of the current period ({renewalDate}).
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center space-x-2 text-slate-500">
                <Calendar className="h-4 w-4 shrink-0 text-blue-500" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{renewalDate}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Next renewal date</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-slate-500">
                <RefreshCcw className="h-4 w-4 shrink-0 text-blue-500" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{cycleText}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Cycle type</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoRenew"
                checked={subData.auto_renew}
                onChange={handleToggleAutoRenew}
                disabled={toggling}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
              />
              <label htmlFor="autoRenew" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                Enable subscription auto-renewal
              </label>
            </div>
            
            <Link
              href="/settings/subscription/plans"
              className="inline-flex items-center justify-center space-x-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-2.5 shadow-md transition shrink-0"
            >
              <span>Explore Plans</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>

        {/* Usage meters side-card (1 col wide) */}
        <Card className="bg-white dark:bg-[#131620] border border-gray-200/80 dark:border-white/[0.06] rounded-2xl shadow-sm p-5 space-y-5">
          <h3 className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Current Period Usage</h3>
          
          <UsageProgressBar
            label="Shipment Volume"
            current={subData.usage.orders_count}
            limit={subData.usage.orders_limit}
          />
          
          <UsageProgressBar
            label="Team User Seats"
            current={subData.usage.users_count}
            limit={subData.usage.users_limit}
          />
        </Card>

      </div>
    </div>
  );
}
