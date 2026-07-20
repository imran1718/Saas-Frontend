'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { RotateCcw, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/rto');
      if (res.data.success) {
        setReturns(res.data.data?.rows || res.data.data || []);
      }
    } catch {
      toast.error('Failed to load RTO records');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <RotateCcw className="w-6 h-6 text-rose-400" /> RTO & Return Shipments
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Return-to-origin tracking, reverse logistics, and warehouse delivery receipts</p>
        </div>
        <button onClick={fetchReturns} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-xs border border-white/[0.08] transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Returns
        </button>
      </div>

      <div className="bg-[#0f1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading return records...</div>
        ) : returns.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No RTO return shipments recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 bg-white/[0.02]">
                  <th className="py-3 px-4 font-semibold">RTO AWB</th>
                  <th className="py-3 px-4 font-semibold">Tenant</th>
                  <th className="py-3 px-4 font-semibold">RTO Reason</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Initiated Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {returns.map(r => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-rose-400">
                      {r.rto_awb_number || r.awb_number || r.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{r.tenant?.company_name || 'Acme Corp'}</td>
                    <td className="py-3 px-4 text-slate-300">{r.rto_reason || 'Undelivered 3 Attempts'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {r.status || 'RTO_IN_TRANSIT'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(r.created_at || Date.now()).toLocaleDateString('en-IN')}
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
