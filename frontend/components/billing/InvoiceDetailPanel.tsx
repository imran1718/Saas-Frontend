import React from 'react';
import { X, Receipt, Download, FileText } from 'lucide-react';
import { InvoiceData } from './InvoiceTable';

interface LineItem {
  id: string;
  description: string;
  hsn_sac_code: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceDetailPanelProps {
  invoice: InvoiceData & { lineItems?: LineItem[] };
  onClose: () => void;
}

export function InvoiceDetailPanel({ invoice, onClose }: InvoiceDetailPanelProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-out Panel */}
      <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-white dark:bg-[#131620] shadow-xl flex flex-col justify-between">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Tax Invoice Breakdown</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.02] text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          
          {/* Summary Card */}
          <div className="bg-slate-50 dark:bg-[#0f1117] border border-slate-100 dark:border-white/[0.04] rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Invoice Number</p>
                <p className="text-sm font-mono font-bold text-slate-800 dark:text-white mt-1">{invoice.invoice_number}</p>
              </div>
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-355 border border-emerald-100 dark:border-emerald-900/30">
                {invoice.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Date Issued</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                  {new Date(invoice.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Place of Supply</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{invoice.place_of_supply}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Itemized charges</p>
            {invoice.lineItems && invoice.lineItems.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
                {invoice.lineItems.map((item) => (
                  <div key={item.id} className="p-4 bg-white dark:bg-[#131620] hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition flex justify-between items-start text-xs gap-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 dark:text-white">{item.description}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        SAC: {item.hsn_sac_code || '996812'} · Qty: {item.quantity} · Rate: ₹{parseFloat(item.unit_price.toString()).toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{parseFloat(item.amount.toString()).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">No line items associated.</p>
            )}
          </div>

          {/* Tax Breaks */}
          <div className="border-t border-slate-100 dark:border-white/[0.06] pt-5 space-y-3">
            <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Tax & Invoice Totals</p>
            <div className="space-y-2 text-xs text-slate-650 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal (net value)</span>
                <span>₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.cgst_amount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>CGST (9%)</span>
                    <span>₹{invoice.cgst_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (9%)</span>
                    <span>₹{invoice.sgst_amount.toFixed(2)}</span>
                  </div>
                </>
              )}
              {invoice.igst_amount > 0 && (
                <div className="flex justify-between">
                  <span>IGST (18%)</span>
                  <span>₹{invoice.igst_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white border-t border-slate-100 dark:border-white/[0.06] pt-2 mt-2">
                <span>Total Invoice Value (gross)</span>
                <span>₹{invoice.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        {invoice.pdf_url && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-[#0f1117]/80 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-end">
            <a
              href={`http://localhost:5000/api/v1/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition shadow-md outline-none"
            >
              <Download className="h-4 w-4" />
              <span>Download Invoice PDF</span>
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
