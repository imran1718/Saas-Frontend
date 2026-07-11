import React from 'react';
import { ArrowUpRight, ArrowDownLeft, FileText, ArrowLeftRight } from 'lucide-react';
import Link from 'next/link';

export interface WalletTransactionData {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  reference_type: 'recharge' | 'shipment_debit' | 'shipment_refund' | 'manual_credit' | 'manual_debit' | 'adjustment';
  reference_id: string | null;
  description: string;
  created_at: string;
}

interface TransactionTableProps {
  transactions: WalletTransactionData[];
}

const REF_LABELS: Record<string, string> = {
  recharge: '⚡ Recharge',
  shipment_debit: '📦 Dispatch Debit',
  shipment_refund: '🔄 Refund',
  manual_credit: '✋ Manual Adjust',
  manual_debit: '✋ Manual Adjust',
  adjustment: '🔧 System Adjust',
};

export function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-[#131620] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-12 text-center shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-center text-indigo-550 dark:text-indigo-400 mb-4">
          <ArrowLeftRight className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No transaction records</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Statements, recharges, and shipment debits will be displayed here as you perform activities.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#131620] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-white/[0.06] text-left text-sm">
          <thead className="bg-slate-50/70 dark:bg-[#0f1117]/80 font-semibold text-slate-600 dark:text-slate-350 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-6 py-4">Transaction ID</th>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Ref Type</th>
              <th className="px-6 py-4">Value (₹)</th>
              <th className="px-6 py-4 text-right">Balance After</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] bg-white dark:bg-[#131620]">
            {transactions.map((tx) => {
              const isCredit = tx.type === 'credit';
              const formattedDate = new Date(tx.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-400 dark:text-slate-500">
                    {tx.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-550 dark:text-slate-400 font-medium">
                    {formattedDate}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal max-w-xs md:max-w-md truncate">
                      {tx.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-slate-50 dark:bg-[#0f1117] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.06]">
                      {REF_LABELS[tx.reference_type] || tx.reference_type}
                    </span>
                    {tx.reference_id && (
                      <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                        ID: {tx.reference_id.substring(0, 8)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center space-x-1 font-black text-xs ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isCredit ? (
                        <>
                          <ArrowUpRight className="h-3 w-3 shrink-0" />
                          <span>+₹{tx.amount.toFixed(2)}</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="h-3 w-3 shrink-0" />
                          <span>-₹{tx.amount.toFixed(2)}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-xs text-slate-700 dark:text-slate-200">
                    ₹{tx.balance_after.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
