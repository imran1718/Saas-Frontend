'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import {
  Users, Search, Filter, ShieldCheck, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Building2, Mail, ExternalLink, MoreVertical, CreditCard, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlatformSellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    fetchSellers();
  }, [page, selectedStatus]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (selectedStatus) params.status = selectedStatus;

      const res = await apiClient.get('/platform/sellers', { params });
      if (res.data.success) {
        const list = res.data.data.sellers || res.data.data.rows || res.data.data || [];
        setSellers(list);
        if (res.data.data.pagination) {
          setPagination(res.data.data.pagination);
        }
      }
    } catch {
      toast.error('Failed to load seller accounts');
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const company = (s.company_name || s.name || '').toLowerCase();
    const subdomain = (s.subdomain || '').toLowerCase();
    const email = (s.owner_email || s.email || '').toLowerCase();
    return company.includes(term) || subdomain.includes(term) || email.includes(term);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 font-['Outfit',sans-serif]">
            <Users className="w-7 h-7 text-blue-600" /> All Tenant Merchant Accounts
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            Directory of registered shipping merchants, wallet balances, plan tiers, and KYC verification status
          </p>
        </div>
        <button
          onClick={fetchSellers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-xs transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Accounts
        </button>
      </div>

      {/* Toolbar & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search company, subdomain, email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={e => { setSelectedStatus(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-extrabold text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="">All Subscription Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="trialing">Trialing</option>
          </select>
        </div>
      </div>

      {/* Sellers Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-bold">Loading seller directories...</div>
        ) : filteredSellers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs border border-dashed rounded-xl font-bold">No seller merchant accounts found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-black uppercase text-[10px] bg-slate-50/80">
                  <th className="py-3 px-4">Merchant Company</th>
                  <th className="py-3 px-4">Subdomain / Domain</th>
                  <th className="py-3 px-4">Wallet Balance</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">KYC Status</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredSellers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">
                          {(s.company_name || s.name || 'M').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{s.company_name || s.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{s.owner_email || s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                      {s.subdomain}.nanoshipy.com
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-600 text-sm">
                      ₹{(s.wallet?.balance || s.balance || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200/60">
                        {s.plan_name || 'GROWTH TIER'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit ${s.kyc_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : s.kyc_status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        <ShieldCheck className="w-3 h-3" /> {s.kyc_status || 'VERIFIED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition-all cursor-pointer">
                        Manage Tenant
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
