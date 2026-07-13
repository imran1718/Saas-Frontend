'use client';
import React from 'react';
import Link from 'next/link';
import { User, Bell, Users, CreditCard, Shield, ArrowRight, Building2, Lock, Mail, Phone } from 'lucide-react';

const settingsSections = [
  { title: 'Profile', description: 'Update your name, email, and business details', href: '/settings/profile', icon: User, color: 'from-indigo-500 to-violet-600' },
  { title: 'Notifications', description: 'Choose how and when you receive alerts and updates', href: '/settings/notifications', icon: Bell, color: 'from-amber-500 to-orange-600' },
  { title: 'Team Members', description: 'Add sub-users and manage their permissions', href: '/settings/team', icon: Users, color: 'from-emerald-500 to-teal-600' },
  { title: 'Billing & Subscription', description: 'View your plan, upgrade, and manage invoices', href: '/settings/billing', icon: CreditCard, color: 'from-violet-500 to-purple-600' },
  { title: 'Security', description: 'Change your password, enable 2FA, view sessions', href: '/settings/security', icon: Shield, color: 'from-rose-500 to-pink-600' },
  { title: 'Company Details', description: 'Edit your business info, GSTIN, and legal name', href: '/settings/company', icon: Building2, color: 'from-sky-500 to-blue-600' },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account, team, and platform preferences</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsSections.map(s => (
          <Link key={s.href} href={s.href} className="group block rounded-2xl bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.06] p-5 hover:border-indigo-500/40 transition-all duration-200">
            <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} mb-4 shadow-lg`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{s.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{s.description}</p>
            <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              Manage <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
