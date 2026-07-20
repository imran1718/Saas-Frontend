'use client';

import React from 'react';
import { NotificationPreferencesForm } from '../../../../components/notifications/NotificationPreferencesForm';
import { Settings, ShieldCheck } from 'lucide-react';

export default function NotificationSettingsPage() {
  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Settings
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-light">
          Manage your subscription plans, developer API keys, billing configurations, and notifications preferences.
        </p>
      </div>

      {/* Tabs Layout */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6 text-xs font-semibold pb-px">
        <a href="/settings/subscription" className="pb-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-b-2 border-transparent transition-all">
          Subscription Plan
        </a>
        <a href="/settings/notifications" className="pb-3 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 transition-all">
          Notification Channels
        </a>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 max-w-xl">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <span className="text-[10px] text-indigo-800 dark:text-indigo-300 font-medium">
            All updates are processed instantly and secured with tenant row level encryption parameters.
          </span>
        </div>

        <NotificationPreferencesForm />
      </div>
    </div>
  );
}
