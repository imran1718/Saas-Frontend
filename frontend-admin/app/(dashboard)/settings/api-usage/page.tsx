'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Key, Activity, RefreshCw } from 'lucide-react';

export default function AdminApiUsagePage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApiUsage();
  }, []);

  const fetchApiUsage = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/platform/webhook-logs');
      if (res.data.success) {
        setLogs(res.data.data?.rows || res.data.data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-6 h-6 text-indigo-400" /> Platform API Usage & Webhook Logs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time throughput, endpoint response times, and API call logs</p>
        </div>
        <button onClick={fetchApiUsage} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold border border-white/[0.08] transition-all">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Logs
        </button>
      </div>

      <div className="bg-[#0f1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading API usage logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No recent API calls or webhooks logged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 bg-white/[0.02]">
                  <th className="py-3 px-4 font-semibold">Source Provider</th>
                  <th className="py-3 px-4 font-semibold">Event Type</th>
                  <th className="py-3 px-4 font-semibold">Status Code</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {logs.map((l, i) => (
                  <tr key={l.id || i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-indigo-400 uppercase">{l.provider || l.source || 'DEVELOPER_API'}</td>
                    <td className="py-3 px-4 text-white font-mono">{l.event_type || l.endpoint || 'POST /api/v1/orders'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${l.status_code < 400 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {l.status_code || 200}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(l.created_at || Date.now()).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
