'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { apiClient } from '@/lib/apiClient';
import { AlertTriangle, ShieldAlert, ArrowLeftRight, ArrowRight, Wallet, Plus, FileText, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface NdrSummary {
  total_open: number;
  aging_over_sla: number;
}

interface WalletDetails {
  balance: number;
  currency: string;
}
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [ndrSummary, setNdrSummary] = useState<NdrSummary | null>(null);
  const [wallet, setWallet] = useState<WalletDetails | null>(null);
  const [rtoCount, setRtoCount] = useState<number>(0);
  const [billingStats, setBillingStats] = useState({ this_month_spend: 0, pending_invoices: 0 });
  const [subPlan, setSubPlan] = useState<string | null>(null);
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!user) return;

    Promise.allSettled([
      apiClient.get('/ndr/summary'),
      apiClient.get('/rto', { params: { limit: 1 } }),
      apiClient.get('/wallet'),
      apiClient.get('/billing/summary'),
      apiClient.get('/subscription').catch(() => null),
      apiClient.get('/support/tickets', { params: { status: 'open', limit: 1 } }).catch(() => null),
    ]).then(([ndrRes, rtoRes, walletRes, billingRes, subRes, ticketsRes]) => {
      if (ndrRes.status === 'fulfilled') {
        setNdrSummary(ndrRes.value.data.data);
      }
      if (rtoRes.status === 'fulfilled') {
        setRtoCount(rtoRes.value.data.data.pagination.total);
      }
      if (walletRes.status === 'fulfilled') {
        setWallet(walletRes.value.data.data);
      }
      if (billingRes.status === 'fulfilled') {
        setBillingStats(billingRes.value.data.data);
      }
      if (subRes.status === 'fulfilled' && subRes.value) {
        setSubPlan(subRes.value.data.data.plan.name);
      }
      if (ticketsRes.status === 'fulfilled' && ticketsRes.value) {
        setOpenTicketsCount(ticketsRes.value.data.data.total || 0);
      }
      setLoading(false);
    });

  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      
      {/* Top Section - Welcome & Wallet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome Card (2 Cols wide on desktop) */}
        <Card className="lg:col-span-2 bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-gray-100 px-6 py-5">
            <h2 className="text-lg font-bold text-gray-900">Welcome back, {user.name}!</h2>
            <p className="text-xs text-gray-500 mt-0.5">Logged in as owner workspace · Tenant: {user.tenant_id}</p>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between">
            <div className="text-xs text-gray-600 space-y-1.5">
              <p><strong>Work Email:</strong> {user.email}</p>
              <p><strong>Privileges:</strong> Full tenant administration & shipping operations</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
              <Button onClick={() => logout()} variant="outline" className="text-xs font-semibold px-4 py-2 border rounded-xl hover:bg-gray-50">
                Sign Out Session
              </Button>
              <Link
                href="/analytics"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition flex items-center space-x-1"
              >
                <span>Analytics Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Balance Card (1 Col wide on desktop) */}
        <Card className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between relative">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-blue-50/60 rounded-full blur-2xl pointer-events-none" />
          
          <CardHeader className="border-b border-gray-100 px-6 py-5 flex flex-row items-center justify-between">
            <div>
              <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider">Wallet Balance</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Available for instant dispatch</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Wallet className="h-5 w-5" />
            </div>
          </CardHeader>
          
          <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-5">
            <div>
              <span className="text-3xl font-black text-gray-900">
                ₹{loading ? '...' : (wallet?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00')}
              </span>
              <span className="text-xs text-gray-500 font-bold ml-1">{wallet?.currency || 'INR'}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                href="/wallet/recharge"
                className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-md flex items-center justify-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Recharge Wallet</span>
              </Link>
              <Link
                href="/wallet"
                className="text-center border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold py-2.5 px-3 rounded-xl transition"
              >
                Statement
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* NDR & Returns & Tickets Operational Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Open NDR Exception count */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Unresolved NDRs</p>
              <h3 className="text-xl font-black text-gray-900 mt-1">
                {loading ? '...' : (ndrSummary?.total_open || 0)}
              </h3>
            </div>
          </div>
          <Link
            href="/ndr"
            className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* SLA Aging breaches */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">NDR SLA Breaches</p>
              <h3 className="text-xl font-black text-rose-600 mt-1">
                {loading ? '...' : (ndrSummary?.aging_over_sla || 0)}
              </h3>
            </div>
          </div>
          <Link
            href="/ndr?status=open"
            className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* RTO in Progress */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Returns In Transit</p>
              <h3 className="text-xl font-black text-gray-900 mt-1">
                {loading ? '...' : rtoCount}
              </h3>
            </div>
          </div>
          <Link
            href="/rto"
            className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Open Support Tickets */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Open Tickets</p>
              <h3 className="text-xl font-black text-gray-900 mt-1">
                {loading ? '...' : openTicketsCount}
              </h3>
            </div>
          </div>
          <Link
            href="/support"
            className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>

      {/* Billing Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">

          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">This Month's Shipping Spend</p>
              <h3 className="text-xl font-black text-gray-900 mt-1">
                ₹{loading ? '...' : (billingStats?.this_month_spend?.toFixed(2) || '0.00')}
              </h3>
            </div>
          </div>
          <Link
            href="/billing"
            className="p-2 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Pending Invoices</p>
              <h3 className="text-xl font-black text-gray-900 mt-1">
                ₹{loading ? '...' : (billingStats?.pending_invoices?.toFixed(2) || '0.00')}
              </h3>
            </div>
          </div>
          <Link
            href="/billing"
            className="p-2 bg-gray-50 hover:bg-amber-50 text-gray-400 hover:text-amber-600 rounded-xl transition"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Active Subscription Tier</p>
              <h3 className="text-xl font-black text-gray-900 mt-1">
                {loading ? '...' : (subPlan || 'Free')}
              </h3>
            </div>
          </div>
          <Link
            href="/settings/subscription"
            className="p-2 bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-xl transition"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>


    </div>
  );
}
