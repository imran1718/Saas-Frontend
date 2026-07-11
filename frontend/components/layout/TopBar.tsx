'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/lib/authStore';
import { Building2 } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard':               'Dashboard',
  '/orders':                  'Orders',
  '/shipments':               'Shipments',
  '/ndr':                     'NDR Exception Log',
  '/rto':                     'Returns (RTO)',
  '/wallet':                  'Wallet',
  '/billing':                 'Billing & Invoices',
  '/settings/company':        'Company Profile',
  '/settings/addresses':      'Pickup Addresses',
  '/settings/roles':          'Roles & Permissions',
  '/settings/couriers':       'Courier Providers',
  '/settings/subscription':   'Subscription Plan',
  '/settings/notifications':  'Notification Settings',
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  for (const key of Object.keys(pageTitles)) {
    if (pathname.startsWith(key + '/')) return pageTitles[key];
  }
  return 'ShippingSaaS';
}

export function TopBar() {
  const pathname = usePathname();
  const { user }  = useAuth();
  const title      = getPageTitle(pathname);

  return (
    <header className="flex items-center justify-between h-[60px] px-6 flex-shrink-0 sticky top-0 z-20
      bg-white/80 dark:bg-[#0f1117]/80 backdrop-blur-sm
      border-b border-slate-200 dark:border-white/[0.06]">

      {/* Page title */}
      <div>
        <h1 className="text-slate-900 dark:text-white font-semibold text-base tracking-tight">{title}</h1>
        {user && (
          <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5">
            <Building2 className="w-3 h-3" />
            <span className="capitalize">{user.role.name} account</span>
          </p>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <NotificationBell />

        {user && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-white/[0.07]">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl
              bg-indigo-50 dark:bg-gradient-to-br dark:from-indigo-500/20 dark:to-violet-600/20
              border border-indigo-200 dark:border-indigo-500/20">
              <span className="text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase">
                {user.name.charAt(0)}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-slate-800 dark:text-slate-200 text-xs font-semibold leading-none">{user.name}</p>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 capitalize">{user.role.name}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
