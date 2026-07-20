'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authStore';
import {
  LayoutDashboard, ShoppingCart, Package, AlertTriangle,
  RotateCcw, Wallet, FileText, Settings, Zap,
  BarChart3, HelpCircle, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';

const navGroups = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard',     href: '/dashboard',  icon: LayoutDashboard },
      { label: 'Orders',        href: '/orders',     icon: ShoppingCart },
      { label: 'Shipments',     href: '/shipments',  icon: Package },
      { label: 'NDR Exceptions',href: '/ndr',        icon: AlertTriangle },
      { label: 'Returns (RTO)', href: '/rto',        icon: RotateCcw },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Wallet & Topups',   href: '/wallet',  icon: Wallet },
      { label: 'Billing & Invoices',href: '/billing', icon: FileText },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { label: 'Stores & Channels', href: '/integrations', icon: Zap },
      { label: 'Analytics',         href: '/analytics',    icon: BarChart3 },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Support',  href: '/support',  icon: HelpCircle },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className={`relative flex flex-col h-screen flex-shrink-0 transition-all duration-300 ease-in-out z-30
        ${collapsed ? 'w-[68px]' : 'w-[232px]'}`}
      style={{ background: '#0f1623', borderRight: '1px solid #1e2a3a' }}
    >
      {/* Brand */}
      <div className={`flex items-center gap-3 px-4 py-[18px] ${collapsed ? 'justify-center' : ''}`}
        style={{ borderBottom: '1px solid #1e2a3a' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}>
          {user?.tenant?.name ? user.tenant.name[0].toUpperCase() : 'N'}
        </div>
        {!collapsed && (
          <div className="overflow-hidden min-w-0">
            <div className="text-white font-semibold text-[13.5px] leading-tight tracking-tight truncate">
              {user?.tenant?.name || 'Nanoshipy'}
            </div>
            <div className="text-[10px] font-medium mt-0.5 truncate" style={{ color: '#4b5870' }}>
              {user?.tenant?.subdomain ? `${user.tenant.subdomain}.nanoshipy.com` : 'Seller Workspace'}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5 scrollbar-none">
        {navGroups.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2.5 mb-2 text-[10px] font-semibold uppercase"
                style={{ color: '#4b5870', letterSpacing: '0.08em' }}>
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex items-center gap-2.5 px-2.5 py-[9px] rounded-xl text-[12.5px] font-medium
                      select-none transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
                    style={{
                      background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                      color: active ? '#93c5fd' : '#8b97ab',
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                        style={{ background: '#3b82f6' }} />
                    )}
                    <Icon className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`}
                      style={{ color: active ? '#60a5fa' : '#5a6a80' }} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid #1e2a3a' }}>
        {user && !collapsed && (
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl mb-1.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2a3a' }}>
            <div className="flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs flex-shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              {user.name ? user.name[0].toUpperCase() : 'S'}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-[12px] font-semibold truncate text-white">{user.name}</p>
              <p className="text-[10px] truncate" style={{ color: '#5a6a80' }}>
                {user.role?.name || 'Account Owner'}
              </p>
            </div>
          </div>
        )}
        <button onClick={logout} title={collapsed ? 'Log Out' : undefined}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12px] font-medium transition-all ${collapsed ? 'justify-center' : ''}`}
          style={{ color: '#ef4444' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
          <LogOut className="flex-shrink-0 w-4 h-4" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-[66px] flex items-center justify-center w-7 h-7 rounded-full z-20 transition-all duration-150"
        style={{ background: '#1e2a3a', border: '1px solid #2d3f55', color: '#5a6a80' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#60a5fa'; (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#5a6a80'; (e.currentTarget as HTMLElement).style.borderColor = '#2d3f55'; }}>
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
