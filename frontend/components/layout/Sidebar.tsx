'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authStore';
import { useTheme } from '@/lib/themeStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  AlertTriangle,
  RotateCcw,
  Wallet,
  FileText,
  Settings,
  Truck,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';

const navGroups = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard',      href: '/dashboard',            icon: LayoutDashboard },
      { label: 'Orders',         href: '/orders',               icon: ShoppingCart },
      { label: 'Shipments',      href: '/shipments',            icon: Package },
      { label: 'NDR Exceptions', href: '/ndr',                  icon: AlertTriangle },
      { label: 'Returns (RTO)',  href: '/rto',                  icon: RotateCcw },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Wallet',            href: '/wallet',  icon: Wallet },
      { label: 'Billing & Invoices', href: '/billing', icon: FileText },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Couriers',     href: '/settings/couriers',     icon: Truck },
      { label: 'Subscription', href: '/settings/subscription', icon: CreditCard },
      { label: 'Settings',     href: '/settings/company',      icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname   = usePathname();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className={`relative flex flex-col h-screen transition-all duration-300 ease-in-out flex-shrink-0
        bg-white dark:bg-[#0f1117]
        border-r border-slate-200 dark:border-white/[0.06]
        ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}
    >
      {/* ── Logo ─────────────────────────────── */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-100 dark:border-white/[0.06] ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0 shadow-lg shadow-indigo-500/20">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-slate-900 dark:text-white font-bold text-sm leading-none tracking-tight">ShippingSaaS</p>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 font-medium uppercase tracking-widest">Platform</p>
          </div>
        )}
      </div>

      {/* ── Nav ──────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-2">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative
                      ${active
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]'}
                      ${collapsed ? 'justify-center' : ''}`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full" />
                    )}
                    <Icon
                      className={`flex-shrink-0 transition-colors
                        ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}
                        ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ───────────────────────────── */}
      <div className="border-t border-slate-100 dark:border-white/[0.06] p-3 space-y-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
            text-slate-500 dark:text-slate-400
            hover:text-slate-900 dark:hover:text-white
            hover:bg-slate-100 dark:hover:bg-white/[0.05]
            ${collapsed ? 'justify-center' : ''}`}
        >
          {isDark
            ? <Sun  className="flex-shrink-0 w-4 h-4 text-amber-400" />
            : <Moon className="flex-shrink-0 w-4 h-4 text-indigo-500" />}
          {!collapsed && (
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          )}
        </button>

        {/* User info */}
        {user && !collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03]">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex-shrink-0">
              <User className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-slate-800 dark:text-slate-200 text-xs font-semibold truncate">{user.name}</p>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] truncate capitalize">{user.role.name}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          title={collapsed ? 'Log Out' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
            text-slate-500 dark:text-slate-500
            hover:text-rose-600 dark:hover:text-rose-400
            hover:bg-rose-50 dark:hover:bg-rose-500/5
            ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="flex-shrink-0 w-4 h-4" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>

      {/* ── Collapse toggle ───────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] flex items-center justify-center w-6 h-6 rounded-full
          bg-white dark:bg-[#1a1d27]
          border border-slate-200 dark:border-white/[0.1]
          text-slate-400 dark:text-slate-400
          hover:text-indigo-600 dark:hover:text-white
          hover:border-indigo-300 dark:hover:border-indigo-500/50
          transition-all duration-150 shadow-sm z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
