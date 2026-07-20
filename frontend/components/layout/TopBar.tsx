'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/lib/authStore';
import { Wallet } from 'lucide-react';
import Link from 'next/link';

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard', '/orders': 'Orders',
  '/shipments': 'Shipments & Tracking', '/ndr': 'NDR Exceptions',
  '/rto': 'Returns (RTO)', '/wallet': 'Wallet & Topups',
  '/billing': 'Billing & Invoices', '/analytics': 'Analytics',
  '/integrations': 'Integrations', '/support': 'Support',
  '/settings': 'Settings', '/settings/company': 'Company Profile',
  '/settings/addresses': 'Pickup Addresses', '/settings/roles': 'Roles & Permissions',
  '/settings/couriers': 'Courier Preferences', '/settings/subscription': 'Subscription Plan',
};

function getPageLabel(pathname: string): string {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  const keys = Object.keys(PAGE_LABELS).sort((a, b) => b.length - a.length);
  for (const k of keys) if (pathname.startsWith(k + '/') || pathname.startsWith(k)) return PAGE_LABELS[k];
  return 'Seller Workspace';
}

export function TopBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <header className="h-[58px] flex items-center px-6 gap-4 bg-white flex-shrink-0 z-20 sticky top-0"
      style={{ borderBottom: '1px solid #e2e6ef', boxShadow: '0 1px 0 0 #e2e6ef' }}>

      <div className="flex-1 min-w-0">
        <h1 className="text-[14px] font-semibold text-[#0a0d14] leading-tight tracking-tight">{getPageLabel(pathname)}</h1>
        <p className="text-[10.5px] text-[#9ca3af] font-medium leading-none mt-0.5">{dateStr}</p>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Link href="/wallet"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e2e6ef] bg-white text-[#374151] hover:bg-[#f4f6fa] transition-all text-[11.5px] font-semibold">
          <Wallet className="w-3.5 h-3.5 text-[#2563eb]" />
          Recharge
        </Link>

        <NotificationBell />

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-[#e2e6ef]">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              {(user.name || 'U')[0].toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-[12px] font-semibold leading-none text-[#0a0d14]">{user.name}</p>
              <p className="text-[10px] mt-0.5 leading-none capitalize text-[#9ca3af]">
                {user.role?.name || (typeof user.role === 'string' ? user.role : 'Owner')}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
