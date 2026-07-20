'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authStore';
import { apiClient } from '@/lib/apiClient';
import {
  LayoutDashboard, BarChart3, Users, ShieldCheck,
  ShoppingCart, Package, AlertTriangle, RotateCcw,
  DollarSign, CreditCard, Truck, MessageCircle, Bell,
  Ticket, Settings, Users2, ChevronLeft, ChevronRight,
  LogOut, ChevronDown
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badgeKey?: 'kyc_pending' | 'ndr_fresh' | 'tickets_open';
  children?: { label: string; href: string }[];
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard',          href: '/dashboard',  icon: LayoutDashboard },
      { label: 'Analytics & Reports', href: '/reports',    icon: BarChart3 },
    ],
  },
  {
    label: 'Sellers',
    items: [
      { label: 'All Sellers', href: '/sellers', icon: Users },
      { label: 'Plans & Custom Charges', href: '/sellers/plans', icon: CreditCard },
      { label: 'KYC Queue',   href: '/kyc',     icon: ShieldCheck, badgeKey: 'kyc_pending' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Orders',         href: '/orders',    icon: ShoppingCart },
      { label: 'Shipments',      href: '/shipments', icon: Package },
      { label: 'NDR Queue',      href: '/ndr',       icon: AlertTriangle, badgeKey: 'ndr_fresh' },
      { label: 'Returns & RTO',  href: '/returns',   icon: RotateCcw },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        label: 'Finance Hub', href: '/finance', icon: DollarSign,
        children: [
          { label: 'Wallet & Recharges',  href: '/finance/wallet' },
          { label: 'COD Remittances',     href: '/finance/cod-remittances' },
          { label: 'Weight Disputes',     href: '/finance/weight-disputes' },
          { label: 'Invoices',            href: '/finance/invoices' },
        ],
      },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Couriers',          href: '/couriers',                        icon: Truck },
      { label: 'Payment Gateways',  href: '/configuration/payment-gateways', icon: CreditCard },
      { label: 'Notifications & Gateways', href: '/notifications',            icon: Bell },
      { label: 'Support Tickets',   href: '/support',                         icon: Ticket, badgeKey: 'tickets_open' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Team Members', href: '/team', icon: Users2 },
      {
        label: 'Settings', href: '/settings', icon: Settings,
        children: [
          { label: 'General',       href: '/settings/general' },
          { label: 'Activity Log',  href: '/settings/activity-log' },
          { label: 'API Usage',     href: '/settings/api-usage' },
        ],
      },
    ],
  },
];

interface NavCounts { kyc_pending: number; ndr_fresh: number; tickets_open: number; }

export function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [navCounts, setNavCounts] = useState<NavCounts>({ kyc_pending: 0, ndr_fresh: 0, tickets_open: 0 });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await apiClient.get('/platform/nav-counts');
        if (data.success) setNavCounts(data.data);
      } catch {}
    };
    fetch();
    const t = setInterval(fetch, 60000);
    return () => clearInterval(t);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const getBadge = (item: NavItem): number => item.badgeKey ? navCounts[item.badgeKey] || 0 : 0;
  const toggleGroup = (label: string) => setExpandedGroups(p => ({ ...p, [label]: !p[label] }));

  return (
    <aside
      className={`relative flex flex-col h-screen flex-shrink-0 transition-all duration-300 ease-in-out z-30
        ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}
      style={{ background: '#0f1623', borderRight: '1px solid #1e2a3a' }}
    >
      {/* Brand */}
      <div
        className={`flex items-center gap-3 px-4 py-[18px] ${collapsed ? 'justify-center' : ''}`}
        style={{ borderBottom: '1px solid #1e2a3a' }}
      >
        {/* Logo mark */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 2px 8px rgba(37,99,235,0.5)' }}>
          N
        </div>
        {!collapsed && (
          <div>
            <div className="text-white font-semibold text-[13.5px] leading-tight tracking-tight">Nanoshipy</div>
            <div className="text-[10px] font-medium mt-0.5" style={{ color: '#3b82f6' }}>Admin Console</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5 scrollbar-none">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2.5 mb-2 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: '#4b5870', letterSpacing: '0.08em' }}>
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const badge = getBadge(item);
                const hasChildren = !!item.children?.length;
                const isExpanded = expandedGroups[item.label] || isActive(item.href);

                return (
                  <div key={item.href}>
                    <div
                      className={`group relative flex items-center gap-2.5 px-2.5 py-[9px] rounded-xl text-[12.5px] font-medium
                        cursor-pointer select-none transition-all duration-150
                        ${collapsed ? 'justify-center' : ''}`}
                      style={{
                        background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                        color: active ? '#60a5fa' : '#8b97ab',
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      onClick={() => hasChildren ? toggleGroup(item.label) : undefined}
                    >
                      {/* Active left bar */}
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{ background: '#3b82f6' }} />
                      )}

                      {hasChildren ? (
                        <Icon className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`}
                          style={{ color: active ? '#60a5fa' : '#5a6a80' }} />
                      ) : (
                        <Link href={item.href} className="absolute inset-0 rounded-xl" />
                      )}
                      {!hasChildren && (
                        <Icon className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`}
                          style={{ color: active ? '#60a5fa' : '#5a6a80' }} />
                      )}

                      {!collapsed && <span className="truncate flex-1" style={{ color: active ? '#93c5fd' : '#8b97ab' }}>{item.label}</span>}

                      {!collapsed && badge > 0 && (
                        <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold"
                          style={{ background: '#2563eb', color: '#fff' }}>
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}

                      {!collapsed && hasChildren && (
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          style={{ color: '#4b5870' }} />
                      )}
                    </div>

                    {/* Sub-items */}
                    {hasChildren && !collapsed && isExpanded && (
                      <div className="ml-4 mt-0.5 pl-3 space-y-0.5 pb-1" style={{ borderLeft: '1px solid #1e2a3a' }}>
                        {item.children!.map(child => (
                          <Link key={child.href} href={child.href}
                            className={`block px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-100`}
                            style={{
                              color: isActive(child.href) ? '#60a5fa' : '#5a6a80',
                              background: isActive(child.href) ? 'rgba(59,130,246,0.12)' : 'transparent',
                            }}>
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid #1e2a3a' }}>
        {user && !collapsed && (
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl mb-1.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2a3a' }}>
            <div className="flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs flex-shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              {user.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-[12px] font-semibold truncate text-white">{user.name}</p>
              <p className="text-[10px] truncate capitalize" style={{ color: '#5a6a80' }}>{user.role || 'Super Admin'}</p>
            </div>
          </div>
        )}
        <button onClick={logout} title={collapsed ? 'Log Out' : undefined}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12px] font-medium transition-all
            ${collapsed ? 'justify-center' : ''}`}
          style={{ color: '#ef4444' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
          <LogOut className="flex-shrink-0 w-4 h-4" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button onClick={onToggle}
        className="absolute -right-3.5 top-[66px] flex items-center justify-center w-7 h-7 rounded-full z-20 transition-all duration-150"
        style={{ background: '#1e2a3a', border: '1px solid #2d3f55', color: '#5a6a80' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#60a5fa'; (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#5a6a80'; (e.currentTarget as HTMLElement).style.borderColor = '#2d3f55'; }}>
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
