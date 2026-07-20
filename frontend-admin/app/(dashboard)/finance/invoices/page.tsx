'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import {
  FileText, DollarSign, Download, Filter, RefreshCw, Search,
  ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlatformInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

  const [stats, setStats] = useState({
    net_revenue: 0,
    total_cgst: 0,
    total_sgst: 0,
    total_igst: 0,
    total_gst: 0,
    paid_count: 0,
    pending_count: 0,
  });

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [page, selectedTenantId, selectedStatus]);

  const fetchSellers = async () => {
    try {
      const res = await apiClient.get('/platform/sellers');
      if (res.data.success) {
        setSellers(res.data.data.sellers || res.data.data || []);
      }
    } catch {}
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 20,
      };
      if (selectedTenantId) params.tenant_id = selectedTenantId;
      if (selectedStatus) params.status = selectedStatus;

      const res = await apiClient.get('/platform/invoices', { params });
      if (res.data.success) {
        const rows = res.data.data.rows || [];
        setInvoices(rows);
        if (res.data.data.pagination) {
          setPagination(res.data.data.pagination);
        }

        let net = 0, cgst = 0, sgst = 0, igst = 0, paid = 0, pending = 0;
        rows.forEach((inv: any) => {
          net += parseFloat(inv.subtotal || inv.net_amount || 0);
          cgst += parseFloat(inv.cgst_amount || 0);
          sgst += parseFloat(inv.sgst_amount || 0);
          igst += parseFloat(inv.igst_amount || 0);
          if (inv.status === 'paid') paid++;
          else pending++;
        });

        setStats({
          net_revenue: net,
          total_cgst: cgst,
          total_sgst: sgst,
          total_igst: igst,
          total_gst: cgst + sgst + igst,
          paid_count: paid,
          pending_count: pending,
        });
      }
    } catch {
      toast.error('Failed to retrieve platform invoices');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const invNum = (inv.invoice_number || inv.id || '').toLowerCase();
    const tenantName = (inv.tenant?.company_name || '').toLowerCase();
    return invNum.includes(term) || tenantName.includes(term);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> GST Invoices & Revenue Billing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Aggregated platform tax invoices, GST breakdowns (CGST/SGST/IGST), and tenant billing receipts
          </p>
        </div>
        <button
          onClick={fetchInvoices}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#0f1120] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-800 dark:text-white font-semibold text-xs border border-slate-200 dark:border-white/[0.08] transition-all shadow-sm shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Aggregated Revenue & GST Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Net Revenue</span>
          <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{stats.net_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Exclusive of GST taxes</p>
        </div>

        <div className="bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total GST Collected</span>
          <h2 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            ₹{stats.total_gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            CGST: ₹{stats.total_cgst.toFixed(2)} | SGST: ₹{stats.total_sgst.toFixed(2)} | IGST: ₹{stats.total_igst.toFixed(2)}
          </p>
        </div>

        <div className="bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Paid Invoices</span>
          <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.paid_count}</h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Settled & verified</p>
        </div>

        <div className="bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Invoices</span>
          <h2 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pending_count}</h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Awaiting payment</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Tenant Filter */}
          <div className="relative flex-1 sm:w-64">
            <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <select
              value={selectedTenantId}
              onChange={e => { setSelectedTenantId(e.target.value); setPage(1); }}
              className="w-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="" className="bg-white dark:bg-[#0f1120] text-slate-900 dark:text-white">All Tenant Accounts</option>
              {sellers.map(s => (
                <option key={s.id} value={s.id} className="bg-white dark:bg-[#0f1120] text-slate-900 dark:text-white">{s.company_name} ({s.subdomain})</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => { setSelectedStatus(e.target.value); setPage(1); }}
            className="bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="" className="bg-white dark:bg-[#0f1120] text-slate-900 dark:text-white">All Statuses</option>
            <option value="paid" className="bg-white dark:bg-[#0f1120] text-slate-900 dark:text-white">Paid</option>
            <option value="pending" className="bg-white dark:bg-[#0f1120] text-slate-900 dark:text-white">Pending</option>
            <option value="overdue" className="bg-white dark:bg-[#0f1120] text-slate-900 dark:text-white">Overdue</option>
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search Invoice # or Tenant..."
            className="w-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading platform invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No invoices found matching selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.02] font-bold">
                  <th className="py-3 px-4 font-bold">Invoice Number</th>
                  <th className="py-3 px-4 font-bold">Tenant Company</th>
                  <th className="py-3 px-4 font-bold">Issue Date</th>
                  <th className="py-3 px-4 font-bold">Subtotal</th>
                  <th className="py-3 px-4 font-bold">GST Breakdown</th>
                  <th className="py-3 px-4 font-bold">Total Amount</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-800 dark:text-slate-200">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {inv.invoice_number || inv.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{inv.tenant?.company_name || 'Acme Corp'}</p>
                      <p className="text-[10px] text-slate-500">{inv.tenant?.subdomain}.nanoshipy.com</p>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(inv.created_at || Date.now()).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                      ₹{parseFloat(inv.subtotal || inv.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      CGST: ₹{parseFloat(inv.cgst_amount || 0).toFixed(2)} | SGST: ₹{parseFloat(inv.sgst_amount || 0).toFixed(2)} | IGST: ₹{parseFloat(inv.igst_amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{parseFloat(inv.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'}`}>
                        {inv.status || 'PAID'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Page <strong className="text-slate-900 dark:text-white">{page}</strong> of <strong className="text-slate-900 dark:text-white">{pagination.totalPages}</strong> (Total {pagination.total} invoices)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] disabled:opacity-30 text-slate-800 dark:text-white font-semibold flex items-center gap-1 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] disabled:opacity-30 text-slate-800 dark:text-white font-semibold flex items-center gap-1 transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
