'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Settings, Shield, Clock } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import PlatformSettingsForm from '@/components/settings/PlatformSettingsForm';

export default function PlatformSettingsPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Global configuration defaults. These values apply to all tenants unless overridden at the tenant level.
            </p>
          </div>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-300">Changes take effect immediately</p>
          <p className="text-xs text-amber-300/70 mt-0.5">
            All platform setting changes are logged to the platform audit trail with old and new values.
            Financial values (GST rate, thresholds) should be changed with care as they affect calculations and billing.
          </p>
        </div>
      </div>

      {/* Resolution info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Tenant Override', desc: 'Tenant-specific setting set by the tenant', color: 'bg-violet-500/20 border-violet-500/30 text-violet-300' },
          { label: 'Platform Default', desc: 'Value from this settings page (DB)', color: 'bg-blue-500/20 border-blue-500/30 text-blue-300' },
          { label: 'System Default', desc: 'Hardcoded env fallback (last resort)', color: 'bg-slate-500/20 border-slate-500/30 text-slate-400' },
        ].map(item => (
          <div key={item.label} className={`p-3 rounded-xl border ${item.color.split(' ').slice(0,2).join(' ')}`}>
            <div className={`text-xs font-semibold ${item.color.split(' ')[2]}`}>{item.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Settings table */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          All Platform Settings
        </h2>
        <PlatformSettingsForm />
      </section>
    </div>
  );
}
