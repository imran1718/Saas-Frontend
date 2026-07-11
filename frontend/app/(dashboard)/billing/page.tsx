'use client';

'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, CreditCard, ChevronRight, FileArchive, Search, AlertCircle } from 'lucide-react';
import { InvoiceTable, InvoiceData } from '@/components/billing/InvoiceTable';
import { CreditNoteTable, CreditNoteData } from '@/components/billing/CreditNoteTable';
import { InvoiceDetailPanel } from '@/components/billing/InvoiceDetailPanel';
import Link from 'next/link';

export default function BillingHistoryPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'credit_notes'>('invoices');
  
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNoteData[]>([]);
  
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ this_month_spend: 0, pending_invoices: 0 });

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Spend stats
      const statsRes = await fetch('http://localhost:5000/api/v1/billing/summary', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      // Invoices
      let invUrl = `http://localhost:5000/api/v1/invoices?page=1&limit=50`;
      const invoicesRes = await fetch(invUrl, { headers });
      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        
        // Filter out monthly statements from this list as they have their own page
        const filtered = (data.data.rows || []).filter((i: InvoiceData) => i.invoice_type !== 'monthly_statement');
        setInvoices(filtered);
      }

      // Credit Notes
      const cnRes = await fetch('http://localhost:5000/api/v1/credit-notes', { headers });
      if (cnRes.ok) {
        const data = await cnRes.json();
        setCreditNotes(data.data.rows || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve billing records');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedInvoiceIds.length === 0) return;
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/v1/invoices/bulk-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invoice_ids: selectedInvoiceIds }),
      });

      if (!res.ok) {
        throw new Error('Export failed. Max 200 invoices can be merged at once.');
      }

      const body = await res.json();
      window.open(body.data.merged_pdf_url, '_blank');
    } catch (err: any) {
      alert(err.message || 'Error occurred during bulk merge.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your shipment receipts, tax splits, credit notes, and monthly statements.
          </p>
        </div>
        <div className="flex space-x-2 shrink-0">
          <Link
            href="/billing/statements"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 bg-white border border-gray-200 hover:bg-slate-50 rounded-xl px-4 py-2.5 shadow-sm transition"
          >
            <FileArchive className="h-4 w-4" />
            <span>Monthly Rollups</span>
          </Link>
        </div>
      </div>

      {/* Stats Summary Widget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
            <FileText className="h-40 w-40" />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-75">This Month's Shipping Spend</span>
          <h2 className="text-2xl font-black mt-2">₹{stats.this_month_spend.toFixed(2)}</h2>
          <p className="text-[10px] opacity-75 mt-3">Calculated dynamically based on generated tax invoices</p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Postpaid Invoices</span>
            <h2 className="text-xl font-bold text-slate-800 mt-1.5">₹{stats.pending_invoices.toFixed(2)}</h2>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Informational check. Charges are debited upfront from your virtual prepaid wallet.
          </p>
        </div>
      </div>

      {/* Filter and Tab Section */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-3">
          {/* Tabs */}
          <div className="flex bg-slate-100/80 rounded-xl p-1 shrink-0 self-start">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'invoices' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Invoices</span>
            </button>
            <button
              onClick={() => setActiveTab('credit_notes')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'credit_notes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Credit Notes (Refunds)</span>
            </button>
          </div>

          {/* Bulk Export action if invoices selected */}
          {activeTab === 'invoices' && selectedInvoiceIds.length > 0 && (
            <button
              onClick={handleBulkExport}
              disabled={exporting}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-xl shadow-md transition self-start"
            >
              <Download className="h-4 w-4" />
              <span>{exporting ? 'Merging PDFs...' : `Export Selected (${selectedInvoiceIds.length})`}</span>
            </button>
          )}
        </div>

        {/* Content lists */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : activeTab === 'invoices' ? (
          <InvoiceTable
            invoices={invoices}
            selectedIds={selectedInvoiceIds}
            onSelectChange={setSelectedInvoiceIds}
            onViewDetails={(inv) => setActiveInvoice(inv)}
          />
        ) : (
          <CreditNoteTable creditNotes={creditNotes} />
        )}
      </div>

      {/* Slide-out detail sheet */}
      {activeInvoice && (
        <InvoiceDetailPanel
          invoice={activeInvoice}
          onClose={() => setActiveInvoice(null)}
        />
      )}
    </div>
  );
}
