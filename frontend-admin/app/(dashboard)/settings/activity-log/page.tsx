'use client';

import React from 'react';
import PlatformActivityLogTable from '@/components/settings/PlatformActivityLogTable';

export default function PlatformActivityLogPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Audit & Activity Log</h1>
        <p className="text-xs text-slate-400 mt-0.5">Searchable audit trail of all platform admin actions, configuration edits, and payment gateway changes</p>
      </div>

      <PlatformActivityLogTable />
    </div>
  );
}
