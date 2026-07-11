import React from 'react';
import Link from 'next/link';
import { Eye, ShieldAlert, ArrowLeftRight } from 'lucide-react';
import { RtoStatusBadge } from './RtoStatusBadge';

export interface RtoRecordData {
  id: string;
  initiated_reason: string;
  initiated_by: 'manual' | 'auto_ndr_threshold' | 'courier_initiated';
  status: string;
  rto_awb_number: string | null;
  received_at_warehouse_at: string | null;
  created_at: string;
  shipment: {
    id: string;
    awb_number: string | null;
    order: {
      order_reference: string;
      customer_name: string;
    };
    provider: {
      display_name: string;
    };
  };
}

interface RtoTableProps {
  rtoRecords: RtoRecordData[];
}

const TRIGGER_LABELS: Record<string, string> = {
  manual: '✋ Manual Action',
  auto_ndr_threshold: '🤖 Auto NDR Threshold',
  courier_initiated: '📡 Courier Redirect',
};

export function RtoTable({ rtoRecords }: RtoTableProps) {
  if (rtoRecords.length === 0) {
    return (
      <div className="bg-white dark:bg-[#131620] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-12 text-center shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-center text-indigo-550 dark:text-indigo-400 mb-4">
          <ArrowLeftRight className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No return shipments (RTO) found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Undelivered shipments that have been marked for return-to-origin will appear here for reverse transit tracking and warehouse verification.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#131620] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-white/[0.06] text-left text-sm">
          <thead className="bg-slate-50/70 dark:bg-[#0f1117]/80 font-semibold text-slate-600 dark:text-slate-355 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-6 py-4">AWB / Courier</th>
              <th className="px-6 py-4">Order Ref / Customer</th>
              <th className="px-6 py-4">Return Trigger</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Reverse AWB</th>
              <th className="px-6 py-4">Received at Origin</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] bg-white dark:bg-[#131620]">
            {rtoRecords.map((rto) => {
              const formattedReceivedDate = rto.received_at_warehouse_at
                ? new Date(rto.received_at_warehouse_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;

              return (
                <tr key={rto.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {rto.shipment.awb_number || 'No AWB'}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{rto.shipment.provider.display_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {rto.shipment.order.order_reference}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{rto.shipment.order.customer_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {TRIGGER_LABELS[rto.initiated_by] || rto.initiated_by}
                    </div>
                    <div className="text-[10px] text-slate-405 dark:text-slate-500 mt-0.5 truncate max-w-xs" title={rto.initiated_reason}>
                      {rto.initiated_reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RtoStatusBadge status={rto.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {rto.rto_awb_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {formattedReceivedDate ? (
                      <span className="text-emerald-600 dark:text-emerald-450 font-semibold">{formattedReceivedDate}</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-450 font-semibold">Pending Receipt</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                    <Link
                      href={`/rto/${rto.id}`}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-955/30 hover:border-indigo-200 dark:hover:border-indigo-900/40 px-2.5 py-1.5 rounded-xl transition outline-none"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Manage Return</span>
                    </Link>
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
