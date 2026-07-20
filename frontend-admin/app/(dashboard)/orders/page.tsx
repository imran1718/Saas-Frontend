'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { ShoppingCart, Search, Filter, RefreshCw, Eye, Package, ChevronLeft, ChevronRight, Truck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [pushingId, setPushingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get('/orders', { params });
      if (res.data.success) {
        const rows = res.data.data?.rows || res.data.data || [];
        setOrders(rows);
        if (res.data.data?.pagination) setPagination(res.data.data.pagination);
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePushToShipway = async (orderId: string) => {
    try {
      setPushingId(orderId);
      const res = await apiClient.post('/shipments', {
        order_id: orderId,
        service_type: 'express',
      });
      if (res.data.success) {
        toast.success(`Order successfully pushed to Shipway! AWB: ${res.data.data?.awb_number || 'Generated'}`);
        fetchOrders();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to push order to Shipway');
    } finally {
      setPushingId(null);
    }
  };

  const filtered = orders.filter(o => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (o.order_number || o.id || '').toLowerCase().includes(term) ||
      (o.customer_name || '').toLowerCase().includes(term) ||
      (o.tenant?.company_name || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Platform Orders & Shipway Push Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Real-time cross-tenant order monitoring & courier dispatch</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#0f1120] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-800 dark:text-white font-semibold text-xs border border-slate-200 dark:border-white/[0.08] transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Orders
        </button>
      </div>

      <div className="bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 w-full sm:w-64"
        >
          <option value="" className="bg-white dark:bg-[#0f1120] text-slate-900 dark:text-white">All Order Statuses</option>
          <option value="draft" className="bg-white dark:bg-[#0f1120] text-slate-900 dark:text-white">Draft</option>
          <option value="ready_to_ship" className="bg-white dark:bg-[#0f1120] text-slate-900 dark:text-white">Ready to Ship</option>
          <option value="shipped" className="bg-white dark:bg-[#0f1120] text-slate-900 dark:text-white">Shipped</option>
          <option value="delivered" className="bg-white dark:bg-[#0f1120] text-slate-900 dark:text-white">Delivered</option>
          <option value="cancelled" className="bg-white dark:bg-[#0f1120] text-slate-900 dark:text-white">Cancelled</option>
        </select>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search Order # or Customer..."
            className="w-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No orders recorded in system.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.02] font-bold">
                  <th className="py-3 px-4 font-bold">Order ID</th>
                  <th className="py-3 px-4 font-bold">Tenant</th>
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 font-bold">Payment Mode</th>
                  <th className="py-3 px-4 font-bold">Amount (₹)</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-800 dark:text-slate-200">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {o.order_number || o.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-slate-900 dark:text-white font-bold">{o.tenant?.company_name || 'Acme Corp'}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-200">{o.customer_name || 'Walk-in Customer'}</p>
                      <p className="text-[10px] text-slate-500">{o.customer_phone}</p>
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {o.payment_method || o.payment_mode || 'COD'}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{parseFloat(o.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                        {o.status || 'READY'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {o.status !== 'shipped' && (
                        <button
                          onClick={() => handlePushToShipway(o.id)}
                          disabled={pushingId === o.id}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center gap-1.5 ml-auto transition-all shadow-sm"
                        >
                          {pushingId === o.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                          Push to Shipway
                        </button>
                      )}
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
