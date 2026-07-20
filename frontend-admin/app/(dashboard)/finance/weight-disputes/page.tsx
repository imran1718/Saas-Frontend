'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Scale, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminWeightDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/weight-disputes');
      if (res.data.success) {
        setDisputes(res.data.data?.rows || res.data.data || []);
      }
    } catch {
      toast.error('Failed to load weight disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      const res = await apiClient.post(`/weight-disputes/${id}/resolve`, { status });
      if (res.data.success) {
        toast.success(`Weight dispute ${status}`);
        fetchDisputes();
      }
    } catch {
      toast.error('Failed to resolve dispute');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Scale className="w-6 h-6 text-amber-400" /> Carrier Weight Discrepancies & Disputes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Review carrier weight audits vs seller uploaded package dimensions</p>
        </div>
        <button onClick={fetchDisputes} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-xs border border-white/[0.08] transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Disputes
        </button>
      </div>

      <div className="bg-[#0f1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading weight disputes...</div>
        ) : disputes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No pending weight discrepancy disputes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 bg-white/[0.02]">
                  <th className="py-3 px-4 font-semibold">Shipment AWB</th>
                  <th className="py-3 px-4 font-semibold">Seller Tenant</th>
                  <th className="py-3 px-4 font-semibold">Declared Weight</th>
                  <th className="py-3 px-4 font-semibold">Carrier Audited</th>
                  <th className="py-3 px-4 font-semibold">Excess Charge</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {disputes.map(d => (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                      {d.shipment?.awb_number || d.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{d.seller?.company_name || 'Acme Corp'}</td>
                    <td className="py-3 px-4 text-slate-300">{d.declared_weight || '0.5'} kg</td>
                    <td className="py-3 px-4 text-amber-400 font-bold">{d.audited_weight || '1.2'} kg</td>
                    <td className="py-3 px-4 font-bold text-rose-400">
                      ₹{parseFloat(d.excess_charge || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {d.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleResolve(d.id, 'accepted')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold transition-all"
                      >
                        Accept Dispute
                      </button>
                      <button
                        onClick={() => handleResolve(d.id, 'rejected')}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-[10px] font-bold transition-all"
                      >
                        Reject & Charge
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
