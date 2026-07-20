'use client';

import React, { useState } from 'react';
import { Bell, ChevronDown, Settings, LogOut, HelpCircle } from 'lucide-react';
import { useAuth } from '@/lib/authStore';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard', '/reports': 'Analytics & Reports',
  '/sellers': 'All Sellers', '/kyc': 'KYC Queue',
  '/orders': 'Orders', '/shipments': 'Shipments & AWBs',
  '/ndr': 'NDR Queue', '/returns': 'Returns & RTO',
  '/finance': 'Finance Hub', '/finance/wallet': 'Wallet & Recharges',
  '/finance/cod-remittances': 'COD Remittances',
  '/finance/weight-disputes': 'Weight Disputes', '/finance/invoices': 'Invoices',
  '/couriers': 'Couriers', '/configuration/payment-gateways': 'Payment Gateways',
  '/whatsapp': 'WhatsApp', '/support': 'Support Tickets',
  '/team': 'Team Members', '/settings': 'Settings',
  '/settings/general': 'General Settings', '/settings/activity-log': 'Activity Log',
  '/settings/api-usage': 'API Usage',
};

function getPageLabel(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  const keys = Object.keys(ROUTE_LABELS).sort((a, b) => b.length - a.length);
  for (const k of keys) if (pathname.startsWith(k + '/') || pathname.startsWith(k)) return ROUTE_LABELS[k];
  return 'Platform Admin';
}

export function AdminTopbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const pageLabel = getPageLabel(pathname);
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <header className="h-[58px] flex items-center px-6 gap-4 bg-white flex-shrink-0 z-20"
      style={{ borderBottom: '1px solid #e2e6ef', boxShadow: '0 1px 0 0 #e2e6ef' }}>

      {/* Left: Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[14px] font-semibold text-[#0a0d14] leading-tight tracking-tight">{pageLabel}</h1>
        <p className="text-[10.5px] text-[#9ca3af] font-medium leading-none mt-0.5">{dateStr}</p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        {/* System OK Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
          Systems OK
        </div>

        {/* Notification */}
        <button className="relative flex items-center justify-center w-8 h-8 rounded-xl border border-[#e2e6ef] bg-white transition-all hover:border-[#2563eb]"
          style={{ color: '#6b7280' }}>
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ring-2 ring-white"
            style={{ background: '#2563eb' }} />
        </button>

        <button className="flex items-center justify-center w-8 h-8 rounded-xl border border-[#e2e6ef] bg-white transition-all hover:border-[#2563eb]"
          style={{ color: '#6b7280' }}>
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-[#e2e6ef] bg-white hover:bg-[#f4f6fa] transition-all">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg font-bold text-xs text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[12px] font-semibold leading-none text-[#0a0d14]">{user?.name || 'Admin'}</p>
              <p className="text-[10px] mt-0.5 capitalize leading-none text-[#9ca3af]">{user?.role || 'Super Admin'}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-[#9ca3af]" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl z-20 overflow-hidden"
                style={{ border: '1px solid #e2e6ef', boxShadow: '0 10px 40px rgba(10,13,20,0.12)' }}>
                <div className="px-4 py-3" style={{ background: '#f4f6fa', borderBottom: '1px solid #e2e6ef' }}>
                  <p className="text-[12px] font-semibold text-[#0a0d14]">{user?.name}</p>
                  <p className="text-[11px] text-[#6b7280] mt-0.5">{user?.email}</p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  <Link href="/settings/general" onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium text-[#374151] hover:bg-[#f4f6fa] hover:text-[#2563eb] transition-all">
                    <Settings className="w-3.5 h-3.5 text-[#9ca3af]" /><span>Settings</span>
                  </Link>
                  <button onClick={() => { logout(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium text-[#dc2626] hover:bg-[#fef2f2] transition-all">
                    <LogOut className="w-3.5 h-3.5" /><span>Log Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
