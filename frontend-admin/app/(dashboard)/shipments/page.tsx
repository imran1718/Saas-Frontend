'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Package, Search, RefreshCw, Truck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/shipments');
      if (res.data.success) {
        setShipments(res.data.data?.rows || res.data.data || []);
      }
    } catch {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const filtered = shipments.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.awb_number || s.id || '').toLowerCase().includes(term) ||
      (s.courier_provider?.name || s.courier_name || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Package className="w-6 h-6 text-indigo-400" /> Platform Shipments & AWBs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Live shipping label AWBs, carrier dispatches, and tracking updates</p>
        </div>
        <button onClick={fetchShipments} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-xs border border-white/[0.08] transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Shipments
        </button>
      </div>

      <div className="bg-[#0f1120] border border-white/[0.08] rounded-2xl p-4 flex items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search AWB # or Carrier..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-[#0f1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading shipments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No active shipments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 bg-white/[0.02]">
                  <th className="py-3 px-4 font-semibold">AWB Number</th>
                  <th className="py-3 px-4 font-semibold">Courier Carrier</th>
                  <th className="py-3 px-4 font-semibold">Tenant</th>
                  <th className="py-3 px-4 font-semibold">Freight Charge</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                      {s.awb_number || s.tracking_number || s.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-white font-bold">{s.courier_provider?.name || s.courier_name || 'Shipway'}</td>
                    <td className="py-3 px-4 text-slate-300">{s.tenant?.company_name || 'Acme Corp'}</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">
                      ₹{parseFloat(s.freight_charge || s.shipping_charge || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {s.status || 'IN_TRANSIT'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(s.created_at || Date.now()).toLocaleDateString('en-IN')}
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
