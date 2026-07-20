'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { AlertTriangle, Search, RefreshCw, CheckCircle2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminNdrQueuePage() {
  const [ndrEvents, setNdrEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNdr();
  }, []);

  const fetchNdr = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/ndr');
      if (res.data.success) {
        setNdrEvents(res.data.data?.rows || res.data.data || []);
      }
    } catch {
      toast.error('Failed to load NDR queue');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, actionType: 'reattempt' | 'rto') => {
    try {
      const res = await apiClient.post(`/ndr/${id}/action`, { action: actionType });
      if (res.data.success) {
        toast.success(`NDR action '${actionType}' submitted`);
        fetchNdr();
      }
    } catch {
      toast.error('Failed to perform NDR action');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400" /> NDR Queue & Failed Deliveries
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage non-delivery reports, buyer reattempts, and RTO initiations</p>
        </div>
        <button onClick={fetchNdr} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-xs border border-white/[0.08] transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh NDR
        </button>
      </div>

      <div className="bg-[#0f1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading NDR events...</div>
        ) : ndrEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No pending NDR delivery exceptions.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 bg-white/[0.02]">
                  <th className="py-3 px-4 font-semibold">Shipment / AWB</th>
                  <th className="py-3 px-4 font-semibold">Tenant</th>
                  <th className="py-3 px-4 font-semibold">NDR Reason</th>
                  <th className="py-3 px-4 font-semibold">Attempts</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {ndrEvents.map(n => (
                  <tr key={n.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {n.shipment?.awb_number || n.awb_number || n.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{n.tenant?.company_name || 'Acme Corp'}</td>
                    <td className="py-3 px-4 text-slate-300">{n.reason || n.ndr_reason || 'Customer Unavailable / Refused'}</td>
                    <td className="py-3 px-4 text-slate-400 font-bold">{n.attempt_count || 1}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {n.status || 'FRESH'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleAction(n.id, 'reattempt')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold transition-all"
                      >
                        Reattempt
                      </button>
                      <button
                        onClick={() => handleAction(n.id, 'rto')}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-[10px] font-bold transition-all"
                      >
                        Initiate RTO
                      </button>
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
