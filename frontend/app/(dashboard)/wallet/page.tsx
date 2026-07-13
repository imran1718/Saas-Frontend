'use client';
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, RefreshCw, Zap } from 'lucide-react';
import Link from 'next/link';

function LedgerRow({ entry }: { entry: any }) {
  const isCredit = entry.transaction_type === 'credit' || entry.credit > 0;
  return (
    <tr className="border-b border-slate-100 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
      <td className="px-5 py-4">
        <p className="text-slate-800 dark:text-slate-200 font-medium text-sm">{entry.description || entry.narration || 'Transaction'}</p>
        <p className="text-slate-400 text-xs mt-0.5">{new Date(entry.created_at).toLocaleString('en-IN')}</p>
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1 text-sm font-semibold
          ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {isCredit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {isCredit ? '+' : '-'}₹{Math.abs(entry.credit || entry.debit || entry.amount || 0).toFixed(2)}
        </span>
      </td>
      <td className="px-5 py-4 text-slate-500 text-sm">
        ₹{(entry.closing_balance ?? entry.balance ?? 0).toFixed(2)}
      </td>
      <td className="px-5 py-4">
        <span className="text-xs text-slate-400 capitalize">{entry.transaction_type || (isCredit ? 'credit' : 'debit')}</span>
      </td>
    </tr>
  );
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [wRes, lRes] = await Promise.all([
          apiClient.get('/wallet/balance'),
          apiClient.get('/wallet/ledger', { params: { page: 1, limit: 20 } }),
        ]);
        if (wRes.data.success) setWallet(wRes.data.data);
        if (lRes.data.success) setLedger(lRes.data.data?.data || lRes.data.data || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Wallet</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your shipping credits and transaction history</p>
        </div>
        <Link href="/wallet/recharge"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25">
          <Plus className="w-4 h-4" /> Add Credits
        </Link>
      </div>

      {/* Balance Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-indigo-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-indigo-200" />
            <span className="text-indigo-200 text-sm font-medium">Available Balance</span>
          </div>
          <p className="text-4xl font-bold tracking-tight">
            {loading ? '—' : `₹${(wallet?.balance ?? 0).toFixed(2)}`}
          </p>
          <Link href="/wallet/recharge" className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all">
            <Zap className="w-3.5 h-3.5" /> Recharge Now
          </Link>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.06] p-5">
          <p className="text-slate-500 text-sm mb-2">Total Recharged (All Time)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '—' : `₹${(wallet?.total_recharged ?? 0).toFixed(2)}`}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.06] p-5">
          <p className="text-slate-500 text-sm mb-2">Total Used (All Time)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? '—' : `₹${(wallet?.total_used ?? 0).toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* Ledger */}
      <div className="rounded-2xl bg-white dark:bg-[#0f1120] border border-slate-200 dark:border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <h2 className="text-slate-900 dark:text-white font-semibold">Transaction History</h2>
          <button className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-sm transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-white/[0.06]">
              <tr>
                {['Description', 'Amount', 'Balance', 'Type'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-white/[0.04]">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-100 dark:bg-white/[0.04] rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : ledger.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">No transactions yet</td></tr>
              ) : ledger.map((entry, i) => <LedgerRow key={i} entry={entry} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
