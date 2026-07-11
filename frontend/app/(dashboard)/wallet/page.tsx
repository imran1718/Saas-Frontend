'use client';

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Spinner } from '@/components/ui/Spinner';
import { WalletBalanceCard } from '@/components/wallet/WalletBalanceCard';
import { TransactionTable, WalletTransactionData } from '@/components/wallet/TransactionTable';
import { RotateCw, PlusCircle, Search, Calendar, Download } from 'lucide-react';
import Link from 'next/link';

interface WalletDetails {
  balance: number;
  low_balance_threshold: number;
  currency: string;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletDetails | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [type, setType] = useState<string>('');
  const [referenceType, setReferenceType] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchWallet = async () => {
    try {
      const res = await apiClient.get('/wallet');
      setWallet(res.data.data);
    } catch (err: any) {
      console.error('Failed to load wallet stats:', err);
    }
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        type: type || undefined,
        reference_type: referenceType || undefined,
        page,
        limit: 15,
      };

      const res = await apiClient.get('/wallet/transactions', { params });
      setTransactions(res.data.data.rows);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load ledger history');
    } finally {
      setLoading(false);
    }
  }, [type, referenceType, page]);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchTransactions]);

  const handleUpdateThreshold = async (newThreshold: number) => {
    await apiClient.put('/wallet/threshold', {
      low_balance_threshold: newThreshold,
    });
    fetchWallet();
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    
    // Simple CSV generator
    const headers = ['Transaction ID', 'Date', 'Type', 'Amount', 'Ref Type', 'Reference ID', 'Description', 'Balance After'];
    const rows = transactions.map((t) => [
      t.id,
      new Date(t.created_at).toISOString(),
      t.type,
      t.amount,
      t.reference_type,
      t.reference_id || '',
      t.description.replace(/"/g, '""'),
      t.balance_after,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `statement_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Wallet Account Statement</h1>
          <p className="text-xs text-gray-500">Track credits, debits, shipment fees, and account statements.</p>
        </div>
        <div className="flex space-x-2">
          <Link
            href="/wallet/recharge"
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Funds</span>
          </Link>
          <button
            onClick={() => { fetchWallet(); fetchTransactions(); }}
            className="flex items-center space-x-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {wallet && (
        <div className="max-w-md">
          <WalletBalanceCard
            balance={wallet.balance}
            lowBalanceThreshold={wallet.low_balance_threshold}
            currency={wallet.currency}
            onUpdateThreshold={handleUpdateThreshold}
          />
        </div>
      )}

      {/* Ledger statement controls */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-3">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <Search className="h-4 w-4 text-blue-500" />
            <span>Transaction Ledger History</span>
          </div>
          {transactions.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1 text-xs text-slate-600 hover:text-blue-600 font-bold border rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1); }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
          >
            <option value="">All Flow Directions</option>
            <option value="credit">Credits (Income)</option>
            <option value="debit">Debits (Expenses)</option>
          </select>

          <select
            value={referenceType}
            onChange={(e) => { setReferenceType(e.target.value); setPage(1); }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
          >
            <option value="">All Reference types</option>
            <option value="recharge">Gateway Recharge</option>
            <option value="shipment_debit">Consignment Debit</option>
            <option value="shipment_refund">Consignment Refund</option>
            <option value="manual_credit">Manual Credit</option>
            <option value="manual_debit">Manual Debit</option>
            <option value="adjustment">System Adjustment</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner className="h-8 w-8 text-blue-600" />
        </div>
      ) : (
        <>
          <TransactionTable transactions={transactions} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-gray-200/80 rounded-2xl px-5 py-4 shadow-sm">
              <p className="text-xs text-gray-500 font-semibold">
                Page {page} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
