'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authStore';
import { apiClient } from '@/lib/apiClient';
import {
  AlertTriangle, RotateCcw, Wallet, ArrowRight,
  Plus, Package, HelpCircle, TrendingUp, ChevronRight,
  RefreshCw, FileText, Zap
} from 'lucide-react';
import Link from 'next/link';

interface NdrSummary { total_open: number; aging_over_sla: number; }
interface WalletDetails { balance: number; currency: string; }

type OrderStatus = 'pending' | 'booked' | 'in_transit' | 'delivered' | 'cancelled' | 'rto';

const STATUS_CONFIG: Record<OrderStatus | string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: '#a9720b', bg: '#fff6e0' },
  booked:     { label: 'Booked',     color: '#2f5fd6', bg: '#eef4ff' },
  in_transit: { label: 'In Transit', color: '#6b35c9', bg: '#f5f0ff' },
  delivered:  { label: 'Delivered',  color: '#1f8a4c', bg: '#eaf7ee' },
  cancelled:  { label: 'Cancelled',  color: '#9a9ca5', bg: '#f2f2f4' },
  rto:        { label: 'RTO',        color: '#c53434', bg: '#fdecec' },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function QuickStatCard({
  label, value, subtext, icon: Icon, iconBg, iconColor, href, urgent
}: {
  label: string; value: React.ReactNode; subtext?: string; icon: React.ComponentType<any>;
  iconBg: string; iconColor: string; href?: string; urgent?: boolean;
}) {
  const card = (
    <div className={`ns-stat-card group ${urgent ? 'border-[#fdecec] bg-[#fffcfc]' : ''}`}>
      <div>
        <p className="text-[11px] font-semibold text-[#9a9ca5] uppercase tracking-wide mb-1.5">{label}</p>
        <div className="text-2xl font-bold text-[#15161a] tracking-tight leading-none">{value}</div>
        {subtext && <p className="text-[11px] mt-1.5 text-[#9a9ca5] font-medium">{subtext}</p>}
      </div>
      <div className="flex flex-col items-end justify-between gap-2 self-stretch">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBg }}>
          <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} />
        </div>
        {href && (
          <span className="text-[10.5px] font-semibold text-[#9a9ca5] group-hover:text-[#2563eb] flex items-center gap-0.5 transition-colors opacity-0 group-hover:opacity-100">
            View <ChevronRight className="w-3 h-3" />
          </span>
        )}
      </div>
    </div>
  );
  if (href) return <Link href={href} className="block">{card}</Link>;
  return card;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [ndr, setNdr] = useState<NdrSummary | null>(null);
  const [wallet, setWallet] = useState<WalletDetails | null>(null);
  const [rtoCount, setRtoCount] = useState(0);
  const [billingStats, setBillingStats] = useState({ this_month_spend: 0, pending_invoices: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [openTickets, setOpenTickets] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      apiClient.get('/ndr/summary'),
      apiClient.get('/rto', { params: { limit: 1 } }),
      apiClient.get('/wallet'),
      apiClient.get('/billing/summary'),
      apiClient.get('/orders', { params: { limit: 5, sort: 'created_at:desc' } }),
      apiClient.get('/support/tickets', { params: { status: 'open', limit: 1 } }),
    ]).then(([ndrR, rtoR, walletR, billingR, ordersR, ticketsR]) => {
      if (ndrR.status === 'fulfilled') setNdr(ndrR.value.data.data);
      if (rtoR.status === 'fulfilled') setRtoCount(rtoR.value.data.data?.pagination?.total || 0);
      if (walletR.status === 'fulfilled') setWallet(walletR.value.data.data);
      if (billingR.status === 'fulfilled') setBillingStats(billingR.value.data.data);
      if (ordersR.status === 'fulfilled') {
        const d = ordersR.value.data?.data || ordersR.value.data;
        const list = Array.isArray(d) ? d : (Array.isArray(d?.orders) ? d.orders : (Array.isArray(d?.rows) ? d.rows : (Array.isArray(d?.data) ? d.data : [])));
        setRecentOrders(list);
      }
      if (ticketsR.status === 'fulfilled' && ticketsR.value)
        setOpenTickets(ticketsR.value.data?.data?.total || ticketsR.value.data?.total || 0);
      setLoading(false);
    });
  }, [user]);

  if (!user) return null;

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? 'Good morning' : greetHour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user.name?.split(' ')[0] || 'there';

  const balance = wallet?.balance || 0;
  const isLowBalance = balance < 500;

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">

      {/* Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold text-[#15161a] tracking-tight">
            {greeting}, {firstName} 👋
          </h2>
          <p className="text-xs text-[#6b6d76] mt-0.5">
            Manage your shipments, wallet, and integrations from here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/orders/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-all"
            style={{ boxShadow: '0 1px 3px rgba(255,90,31,0.3)' }}>
            <Plus className="w-3.5 h-3.5" />
            New Order
          </Link>
          <Link href="/wallet"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#e7e7ea] bg-white text-[#15161a] hover:bg-[#f5f5f7] text-xs font-semibold transition-all">
            <Wallet className="w-3.5 h-3.5 text-[#6b6d76]" />
            Add Funds
          </Link>
        </div>
      </div>

      {/* Wallet Hero Card */}
      <div className="bg-[#111] rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        style={{ boxShadow: '0 4px 20px rgba(17,17,17,0.2)' }}>
        <div>
          <p className="text-xs text-[#a9abb4] font-medium mb-1.5">Available Balance</p>
          <div className="text-3xl font-bold tracking-tight">
            {loading ? (
              <span className="text-[#444]">—</span>
            ) : (
              <>
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                <span className="text-sm text-[#6b6d76] font-medium ml-1.5">INR</span>
              </>
            )}
          </div>
          {!loading && isLowBalance && (
            <p className="text-[11px] text-[#ff8c42] font-semibold mt-2 flex items-center gap-1">
              <span>⚠</span> Low balance — recharge to avoid shipment holds
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/wallet"
            className="px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-all flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Recharge Wallet
          </Link>
          <Link href="/billing"
            className="px-4 py-2 rounded-xl border border-[#333] bg-transparent hover:bg-[#222] text-[#a9abb4] text-xs font-semibold transition-all">
            View Statement
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStatCard
          label="Unresolved NDRs"
          value={loading ? <span className="text-[#d1d5db]">—</span> : (ndr?.total_open || 0)}
          subtext={ndr?.aging_over_sla ? `${ndr.aging_over_sla} past SLA` : 'All within SLA'}
          icon={AlertTriangle}
          iconBg="#fff6e0"
          iconColor="#a9720b"
          href="/ndr"
          urgent={(ndr?.total_open || 0) > 0}
        />
        <QuickStatCard
          label="Returns in Transit"
          value={loading ? <span className="text-[#d1d5db]">—</span> : rtoCount}
          subtext="Active RTO shipments"
          icon={RotateCcw}
          iconBg="#f5f0ff"
          iconColor="#7c3aed"
          href="/rto"
        />
        <QuickStatCard
          label="This Month's Spend"
          value={loading ? <span className="text-[#d1d5db]">—</span> : `₹${(billingStats.this_month_spend || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtext="Shipping cost MTD"
          icon={TrendingUp}
          iconBg="#eef4ff"
          iconColor="#2f5fd6"
          href="/billing"
        />
        <QuickStatCard
          label="Open Tickets"
          value={loading ? <span className="text-[#d1d5db]">—</span> : openTickets}
          subtext={openTickets === 0 ? 'All resolved' : 'Need attention'}
          icon={HelpCircle}
          iconBg="#f2f2f4"
          iconColor="#6b6d76"
          href="/support"
        />
      </div>

      {/* Recent Orders Table + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Orders */}
        <div className="ns-card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#eef0f2]">
            <div>
              <h3 className="text-[14px] font-semibold text-[#15161a]">Recent Orders</h3>
              <p className="text-[11px] text-[#6b6d76] mt-0.5">Your 5 most recent shipment orders</p>
            </div>
            <Link href="/orders" className="text-[11px] font-semibold text-[#2563eb] hover:underline flex items-center gap-0.5">
              All orders <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-[#9a9ca5]">Loading orders…</div>
          ) : !Array.isArray(recentOrders) || recentOrders.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Package className="w-10 h-10 text-[#d1d5db]" />
              <div className="text-center">
                <p className="text-sm font-semibold text-[#3c3d43]">No orders yet</p>
                <p className="text-xs text-[#9a9ca5] mt-1">Create your first order to get started</p>
              </div>
              <Link href="/orders/new"
                className="mt-1 px-4 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-semibold hover:bg-[#1d4ed8] transition-all">
                Create Order
              </Link>
            </div>
          ) : (
            <table className="ns-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Recipient</th>
                  <th>Courier</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(recentOrders) && recentOrders.map((order: any, i: number) => (
                  <tr key={order.id || i}>
                    <td>
                      <Link href={`/orders/${order.id}`}
                        className="font-semibold text-[#15161a] hover:text-[#2563eb] transition-colors">
                        #{order.order_number || order.id?.slice(-8) || '—'}
                      </Link>
                    </td>
                    <td className="text-[#6b6d76]">
                      {order.recipient_name || order.shipping_address?.name || '—'}
                    </td>
                    <td className="text-[#6b6d76]">
                      {order.courier_name || order.courier?.name || '—'}
                    </td>
                    <td className="text-right">
                      <StatusPill status={order.status || 'pending'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="ns-card p-5">
            <h3 className="text-[14px] font-semibold text-[#15161a] mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Create New Order', icon: Plus, href: '/orders/new', color: '#2563eb', bg: '#fff1ea' },
                { label: 'Recharge Wallet', icon: Wallet, href: '/wallet', color: '#2f5fd6', bg: '#eef4ff' },
                { label: 'Track Shipment', icon: Package, href: '/shipments', color: '#7c3aed', bg: '#f5f0ff' },
                { label: 'Manage Stores', icon: Zap, href: '/integrations', color: '#1f8a4c', bg: '#eaf7ee' },
                { label: 'View Invoices', icon: FileText, href: '/billing', color: '#a9720b', bg: '#fff6e0' },
                { label: 'Get Support', icon: HelpCircle, href: '/support', color: '#6b6d76', bg: '#f2f2f4' },
              ].map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f5f5f7] transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: action.bg }}>
                    <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                  </div>
                  <span className="text-[12.5px] font-medium text-[#3c3d43] group-hover:text-[#15161a] transition-colors">
                    {action.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#d1d5db] ml-auto group-hover:text-[#2563eb] transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Billing Summary */}
          {!loading && (
            <div className="ns-card p-5">
              <h3 className="text-[14px] font-semibold text-[#15161a] mb-3">Billing Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#6b6d76]">Month spend</span>
                  <span className="text-[12.5px] font-semibold text-[#15161a]">
                    ₹{(billingStats.this_month_spend || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#6b6d76]">Pending invoices</span>
                  <span className="text-[12.5px] font-semibold text-[#c53434]">
                    ₹{(billingStats.pending_invoices || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-px bg-[#eef0f2]" />
                <Link href="/billing"
                  className="flex items-center justify-between text-[11.5px] font-semibold text-[#2563eb] hover:underline">
                  View full billing <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
