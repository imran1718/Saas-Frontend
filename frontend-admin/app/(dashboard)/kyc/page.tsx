'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { ShieldCheck, CheckCircle2, XCircle, Clock, RefreshCw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminKycQueuePage() {
  const [kycList, setKycList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKycQueue();
  }, []);

  const fetchKycQueue = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/kyc/pending');
      if (res.data.success) {
        setKycList(res.data.data?.rows || res.data.data || []);
      }
    } catch {
      toast.error('Failed to load KYC queue');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await apiClient.post(`/kyc/${id}/${action}`);
      if (res.data.success) {
        toast.success(`KYC document ${action}d!`);
        fetchKycQueue();
      }
    } catch {
      toast.error(`Failed to ${action} KYC document`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Tenant KYC Verification Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Review seller GSTIN, PAN, and Bank verification documents</p>
        </div>
        <button onClick={fetchKycQueue} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white font-semibold text-xs transition-all shadow-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh KYC Queue
        </button>
      </div>

      <div className="bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading KYC submissions...</div>
        ) : kycList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No pending KYC document submissions.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.02] font-bold">
                  <th className="py-3 px-4 font-bold">Seller Tenant</th>
                  <th className="py-3 px-4 font-bold">Document Type</th>
                  <th className="py-3 px-4 font-bold">GSTIN / PAN ID</th>
                  <th className="py-3 px-4 font-bold">Submission Date</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-800 dark:text-slate-200">
                {kycList.map(k => (
                  <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{k.tenant?.company_name || k.name || 'Acme Corp'}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-semibold">{k.document_type || 'GST Certificate'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{k.document_number || '27AABCU9603R1ZM'}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(k.created_at || Date.now()).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                        {k.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleApproveReject(k.id, 'approve')}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-all shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproveReject(k.id, 'reject')}
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition-all shadow-sm"
                      >
                        Reject
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
