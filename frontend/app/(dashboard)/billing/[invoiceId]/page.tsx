'use client';

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, ArrowLeft, Download, AlertCircle, Calendar, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface InvoiceDetails {
  id: string;
  invoice_number: string;
  invoice_type: string;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  status: string;
  pdf_url: string | null;
  place_of_supply: string;
  billing_entity_gstin: string;
  created_at: string;
  lineItems: Array<{
    id: string;
    description: string;
    hsn_sac_code: string | null;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`http://localhost:5000/api/v1/invoices/${invoiceId}`, { headers });
      if (!res.ok) {
        throw new Error('Invoice not found or unauthorized');
      }

      const body = await res.json();
      setInvoice(body.data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve invoice details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-md mx-auto mt-8 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-5 space-y-3">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-bold">Error</span>
        </div>
        <p>{error || 'Unable to retrieve invoice record details.'}</p>
        <button
          onClick={() => router.back()}
          className="text-xs font-bold text-red-800 hover:underline mt-2 flex items-center space-x-1"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Go back</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Navigation breadcrumb */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Billing</span>
      </button>

      {/* Main Details card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Invoice breakdown summary */}
        <div className="md:col-span-1 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-6 self-start">
          <div className="flex justify-between items-start border-b border-gray-100 pb-4">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">GST Tax Invoice</span>
              <h2 className="text-base font-bold text-slate-900 mt-1 font-mono">{invoice.invoice_number}</h2>
            </div>
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {invoice.status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date Issued</p>
              <p className="font-semibold text-slate-700 mt-0.5">
                {new Date(invoice.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Place of Supply</p>
              <p className="font-semibold text-slate-700 mt-0.5">{invoice.place_of_supply}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Invoicing Entity GSTIN</p>
              <p className="font-semibold text-slate-700 font-mono mt-0.5">{invoice.billing_entity_gstin}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal (Excl. Tax)</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.cgst_amount > 0 && (
              <>
                <div className="flex justify-between text-slate-500">
                  <span>CGST (9%)</span>
                  <span>₹{invoice.cgst_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>SGST (9%)</span>
                  <span>₹{invoice.sgst_amount.toFixed(2)}</span>
                </div>
              </>
            )}
            {invoice.igst_amount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>IGST (18%)</span>
                <span>₹{invoice.igst_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-900 border-t pt-2 mt-2">
              <span>Total Value</span>
              <span>₹{invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {invoice.pdf_url && (
            <a
              href={`http://localhost:5000/api/v1/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition shadow-md"
            >
              <Download className="h-4 w-4" />
              <span>Download Invoice PDF</span>
            </a>
          )}
        </div>

        {/* PDF viewer embed iframe */}
        <div className="md:col-span-2 bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm h-[600px] flex flex-col">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Secure Document Preview</span>
            </span>
          </div>
          {invoice.pdf_url ? (
            <iframe
              src={`http://localhost:5000/api/v1/invoices/${invoice.id}/pdf`}
              className="w-full h-full border-none"
              title="Secure Invoice Viewport"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <FileText className="h-12 w-12 opacity-30 mb-3" />
              <p className="text-xs">No preview document is available for this billing item.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
