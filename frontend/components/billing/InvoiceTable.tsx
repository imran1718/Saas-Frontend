import React from 'react';
import { FileText, Download, Eye, Calendar } from 'lucide-react';
import Link from 'next/link';

export interface InvoiceData {
  id: string;
  invoice_number: string;
  invoice_type: 'shipment' | 'monthly_statement' | 'manual';
  reference_type: string;
  reference_id: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  status: 'generated' | 'paid' | 'void';
  pdf_url: string | null;
  place_of_supply: string;
  created_at: string;
}

interface InvoiceTableProps {
  invoices: InvoiceData[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  onViewDetails: (invoice: InvoiceData) => void;
}

export function InvoiceTable({ invoices, selectedIds, onSelectChange, onViewDetails }: InvoiceTableProps) {
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectChange(invoices.map((i) => i.id));
    } else {
      onSelectChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectChange([...selectedIds, id]);
    } else {
      onSelectChange(selectedIds.filter((x) => x !== id));
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="bg-white dark:bg-[#131620] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-12 text-center shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-center text-indigo-550 dark:text-indigo-400 mb-4">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No invoices found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Consignment invoices and statements generated automatically will appear here.
        </p>
      </div>
    );
  }

  const allSelected = invoices.length > 0 && selectedIds.length === invoices.length;

  return (
    <div className="bg-white dark:bg-[#131620] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-white/[0.06] text-left text-sm">
          <thead className="bg-slate-50/70 dark:bg-[#0f1117]/80 font-semibold text-slate-600 dark:text-slate-350 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-6 py-4 w-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 dark:border-white/[0.08] text-indigo-600 focus:ring-indigo-500 cursor-pointer bg-white dark:bg-[#0f1117]"
                />
              </th>
              <th className="px-6 py-4">Invoice Number</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Place of Supply</th>
              <th className="px-6 py-4">Total Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] bg-white dark:bg-[#131620]">
            {invoices.map((inv) => {
              const formattedDate = new Date(inv.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              const isChecked = selectedIds.includes(inv.id);

              return (
                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleSelectOne(inv.id, e.target.checked)}
                      className="rounded border-slate-300 dark:border-white/[0.08] text-indigo-600 focus:ring-indigo-500 cursor-pointer bg-white dark:bg-[#0f1117]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <FileText className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span>{inv.invoice_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                      inv.invoice_type === 'monthly_statement'
                        ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/30'
                        : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-750 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30'
                    }`}>
                      {inv.invoice_type === 'monthly_statement' ? 'Monthly statement' : 'Shipment'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {formattedDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                    {inv.place_of_supply}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-xs text-slate-900 dark:text-white">
                    ₹{inv.total_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs space-x-1">
                    <button
                      onClick={() => onViewDetails(inv)}
                      className="inline-flex items-center space-x-1 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition outline-none"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View details</span>
                    </button>
                    {inv.pdf_url && (
                      <a
                        href={`http://localhost:5000/api/v1/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-indigo-650 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-950/30 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg px-2.5 py-1.5 transition outline-none"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download PDF</span>
                      </a>
                    )}
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
