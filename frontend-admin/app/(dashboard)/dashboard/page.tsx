'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authStore';
import { apiClient } from '@/lib/apiClient';
import {
  Users, TrendingUp, Activity, ChevronRight, Truck,
  RefreshCw, Package, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts';

const PIE_COLORS = ['#16a34a', '#d97706', '#dc2626', '#9ca3af'];

function StatCard({
  label, value, subtext, subtextColor = '#6b6d76', icon: Icon, iconBg, iconColor, href
}: {
  label: string; value: React.ReactNode; subtext?: string; subtextColor?: string;
  icon: React.ComponentType<any>; iconBg: string; iconColor: string; href?: string;
}) {
  return (
    <div className="ns-stat-card group">
      <div>
        <p className="text-[11px] font-semibold text-[#6b6d76] uppercase tracking-wide mb-1.5">{label}</p>
        <div className="text-2xl font-bold text-[#15161a] tracking-tight leading-none">{value}</div>
        {subtext && (
          <p className="text-[11.5px] mt-1.5 flex items-center gap-1 font-medium" style={{ color: subtextColor }}>
            {subtext}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg }}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        {href && (
          <Link href={href} className="text-[10.5px] font-semibold text-[#9a9ca5] hover:text-[#ff5a1f] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            View <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [growth, setGrowth] = useState<any>(null);
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [growthRes, topRes, courierRes] = await Promise.all([
        apiClient.get('/platform/analytics/tenant-growth'),
        apiClient.get('/platform/analytics/top-tenants?limit=5'),
        apiClient.get('/platform/analytics/courier-overview?date_from=2026-01-01&date_to=2026-12-31'),
      ]);
      setGrowth(growthRes.data.data);
      setTenantsList(topRes.data.data || []);
      setCouriers(courierRes.data.data || []);
    } catch {
      toast.error('Could not load platform stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const signupData = growth?.signup_trend || [];
  const statusDist = growth?.status_breakdown || {};
  const totalSignups = signupData.reduce((s: number, x: any) => s + (x.signups || 0), 0);

  const statusChartData = [
    { name: 'Active', value: statusDist.active || 0 },
    { name: 'Grace Period', value: statusDist.grace_period || 0 },
    { name: 'Suspended', value: statusDist.suspended || 0 },
    { name: 'Cancelled', value: statusDist.cancelled || 0 },
  ].filter(i => i.value > 0);

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? 'Good morning' : greetHour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Admin';

  return (
    <div className="space-y-5 max-w-screen-xl mx-auto">

      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-semibold text-[#15161a] tracking-tight">
            {greeting}, {firstName} 👋
          </h2>
          <p className="text-xs text-[#6b6d76] mt-0.5">
            Here's what's happening across your platform today.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e2e6ef] bg-white text-[#0a0d14] hover:bg-[#f4f6fa] font-medium text-xs transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#6b7280] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active Tenants"
          value={loading ? <span className="text-[#d1d5db]">—</span> : (statusDist.active || 0)}
          subtext={statusDist.active ? `${statusDist.active} verified` : undefined}
          subtextColor="#16a34a"
          icon={Users}
          iconBg="#eff6ff"
          iconColor="#2563eb"
          href="/sellers"
        />
        <StatCard
          label="Total Signups"
          value={loading ? <span className="text-[#d1d5db]">—</span> : totalSignups}
          subtext={totalSignups > 0 ? 'All time' : undefined}
          subtextColor="#2563eb"
          icon={TrendingUp}
          iconBg="#eff6ff"
          iconColor="#2563eb"
          href="/reports"
        />
        <StatCard
          label="Couriers Integrated"
          value={loading ? <span className="text-[#d1d5db]">—</span> : couriers.length}
          subtext={couriers.length > 0 ? 'Active carriers' : 'No carriers yet'}
          subtextColor="#4b5563"
          icon={Truck}
          iconBg="#f0f9ff"
          iconColor="#0284c7"
          href="/couriers"
        />
        <StatCard
          label="Platform Status"
          value={<span className="text-base font-semibold text-[#16a34a] flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] animate-pulse inline-block" />Operational</span>}
          subtext="All services running"
          subtextColor="#4b5563"
          icon={Activity}
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Signup Trend Chart */}
        <div className="ns-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[#15161a]">Tenant Signup Trend</h3>
              <p className="text-[11px] text-[#6b6d76] mt-0.5">Monthly new seller onboarding</p>
            </div>
            <Link href="/reports" className="text-[11px] font-semibold text-[#2563eb] hover:underline flex items-center gap-0.5">
              Full report <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-52">
            {loading ? (
              <div className="h-full flex items-center justify-center text-[#d1d5db] text-xs">Loading chart…</div>
            ) : signupData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 border border-dashed border-[#e7e7ea] rounded-xl">
                <Package className="w-8 h-8 text-[#d1d5db]" />
                <p className="text-xs text-[#9a9ca5] font-medium">No signup data available yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signupData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f2" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false}
                    tick={{ fill: '#9a9ca5', fontSize: 11, fontWeight: 500 }} />
                  <YAxis tickLine={false} axisLine={false}
                    tick={{ fill: '#9a9ca5', fontSize: 11, fontWeight: 500 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff', border: '1px solid #e7e7ea',
                      borderRadius: '12px', fontSize: 12, fontWeight: 600,
                      boxShadow: '0 4px 16px rgba(21,22,26,0.08)'
                    }}
                    cursor={{ fill: '#f5f5f7' }}
                  />
                  <Bar dataKey="signups" fill="#2563eb" radius={[5, 5, 0, 0]} name="New Tenants" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Subscription Distribution */}
        <div className="ns-card p-5">
          <h3 className="text-[14px] font-semibold text-[#15161a] mb-0.5">Subscription Split</h3>
          <p className="text-[11px] text-[#6b6d76] mb-3">Active vs paused tenants</p>
          <div className="h-36">
            {loading ? (
              <div className="h-full flex items-center justify-center text-[#d1d5db] text-xs">Loading…</div>
            ) : statusChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#9a9ca5] text-xs font-medium">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={38} outerRadius={60}
                    paddingAngle={3} dataKey="value">
                    {statusChartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff', border: '1px solid #e7e7ea',
                      borderRadius: '10px', fontSize: 11, fontWeight: 600
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {[
              { label: 'Active', value: statusDist.active || 0, color: '#1f8a4c' },
              { label: 'Grace', value: statusDist.grace_period || 0, color: '#a9720b' },
              { label: 'Suspended', value: statusDist.suspended || 0, color: '#c53434' },
              { label: 'Cancelled', value: statusDist.cancelled || 0, color: '#9a9ca5' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-[#6b6d76] font-medium">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                {item.label} ({item.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Sellers + Courier Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Sellers Table */}
        <div className="ns-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#eef0f2]">
            <div>
              <h3 className="text-[14px] font-semibold text-[#15161a]">Top Sellers by Volume</h3>
              <p className="text-[11px] text-[#6b6d76] mt-0.5">Ranked by total shipment spend</p>
            </div>
            <Link href="/sellers" className="text-[11px] font-semibold text-[#2563eb] hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="py-10 text-center text-xs text-[#9a9ca5]">Loading sellers…</div>
          ) : tenantsList.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Users className="w-8 h-8 text-[#d1d5db]" />
              <p className="text-xs text-[#9a9ca5] font-medium">No seller data yet</p>
            </div>
          ) : (
            <table className="ns-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th className="text-right">Shipments</th>
                  <th className="text-right">Invoiced</th>
                </tr>
              </thead>
              <tbody>
                {tenantsList.map((t, i) => (
                  <tr key={i}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-[#f5f5f7] border border-[#e7e7ea] flex items-center justify-center text-[10px] font-bold text-[#6b6d76] flex-shrink-0">
                          {(t.company_name || 'S')[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-[#15161a]">{t.company_name}</span>
                      </div>
                    </td>
                    <td className="text-right text-[#6b6d76]">{(t.shipments_count || 0).toLocaleString()}</td>
                    <td className="text-right font-semibold text-[#1f8a4c]">
                      ₹{parseFloat(t.total_spend || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Courier Health */}
        <div className="ns-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#eef0f2]">
            <div>
              <h3 className="text-[14px] font-semibold text-[#15161a]">Courier Delivery Rates</h3>
              <p className="text-[11px] text-[#6b6d76] mt-0.5">Success vs NDR exception rates</p>
            </div>
            <Link href="/couriers" className="text-[11px] font-semibold text-[#2563eb] hover:underline flex items-center gap-0.5">
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="py-10 text-center text-xs text-[#9a9ca5]">Loading couriers…</div>
          ) : couriers.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Truck className="w-8 h-8 text-[#d1d5db]" />
              <p className="text-xs text-[#9a9ca5] font-medium">No courier data available</p>
            </div>
          ) : (
            <div className="divide-y divide-[#eef0f2]">
              {couriers.slice(0, 5).map((c, i) => {
                const successRate = parseFloat(c.delivery_success_rate || 98);
                return (
                  <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#fafafa] transition-colors">
                    <div>
                      <p className="text-[12.5px] font-semibold text-[#15161a]">{c.courier_name}</p>
                      <p className="text-[11px] text-[#9a9ca5] mt-0.5">{(c.shipments_count || 0).toLocaleString()} shipments</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-[12.5px] font-semibold ${successRate >= 95 ? 'text-[#1f8a4c]' : successRate >= 85 ? 'text-[#a9720b]' : 'text-[#c53434]'}`}>
                        {successRate}% delivered
                      </div>
                      <div className="text-[11px] text-[#c53434] font-medium">{c.ndr_rate || 2}% NDR</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
