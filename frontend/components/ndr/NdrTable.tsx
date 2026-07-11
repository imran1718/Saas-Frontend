import React from 'react';
import Link from 'next/link';
import { Eye, Clock, AlertTriangle, UserCheck } from 'lucide-react';
import { NdrReasonBadge } from './NdrReasonBadge';

export interface NdrRecord {
  id: string;
  reason_code: string;
  raw_reason: string;
  attempt_number: number;
  status: 'open' | 'action_taken' | 'resolved_delivered' | 'resolved_rto';
  sla_due_at: string;
  created_at: string;
  shipment: {
    id: string;
    awb_number: string | null;
    status: string;
    order: {
      order_reference: string;
      customer_name: string;
    };
    provider: {
      display_name: string;
    };
  };
}

interface NdrTableProps {
  ndrEvents: NdrRecord[];
  selectedIds?: string[];
  onSelectChange?: (selectedIds: string[]) => void;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  open: { label: 'Open Checkpoint', bg: 'bg-red-100 dark:bg-rose-950/20 border border-red-200 dark:border-rose-900/30', text: 'text-red-800 dark:text-rose-400' },
  action_taken: { label: 'Action Transmitted', bg: 'bg-blue-100 dark:bg-indigo-950/20 border border-blue-200 dark:border-indigo-900/30', text: 'text-blue-800 dark:text-indigo-400' },
  resolved_delivered: { label: 'Delivered', bg: 'bg-green-100 dark:bg-emerald-950/20 border border-green-200 dark:border-emerald-900/30', text: 'text-green-800 dark:text-emerald-400' },
  resolved_rto: { label: 'RTO Initiated', bg: 'bg-purple-100 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30', text: 'text-purple-800 dark:text-purple-400' },
};

export function NdrTable({ ndrEvents, selectedIds = [], onSelectChange }: NdrTableProps) {
  const showCheckboxes = !!onSelectChange;
  const allSelected = ndrEvents.length > 0 && selectedIds.length === ndrEvents.length;

  const toggleAll = () => {
    if (!onSelectChange) return;
    if (allSelected) {
      onSelectChange([]);
    } else {
      // Only select open or action_taken events (cannot perform bulk action on already resolved ones)
      const actionable = ndrEvents.filter(n => ['open', 'action_taken'].includes(n.status)).map(n => n.id);
      onSelectChange(actionable);
    }
  };

  const toggleOne = (id: string) => {
    if (!onSelectChange) return;
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter(x => x !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  if (ndrEvents.length === 0) {
    return (
      <div className="bg-white dark:bg-[#131620] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-12 text-center shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-center text-indigo-550 dark:text-indigo-400 mb-4">
          <UserCheck className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No delivery exceptions (NDR) found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Shipments experiencing delivery failures will appear here for address correction, reattempts, or RTO conversion.
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
              {showCheckboxes && (
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-slate-300 dark:border-white/[0.08] text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4 bg-white dark:bg-[#0f1117]"
                  />
                </th>
              )}
              <th className="px-6 py-4">AWB / Courier</th>
              <th className="px-6 py-4">Order Ref / Customer</th>
              <th className="px-6 py-4">Exception Reason</th>
              <th className="px-6 py-4 text-center">Attempt</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">SLA Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] bg-white dark:bg-[#131620]">
            {ndrEvents.map((ndr) => {
              const isActionable = ['open', 'action_taken'].includes(ndr.status);
              const isSlaBreached = isActionable && new Date(ndr.sla_due_at) < new Date();
              const formattedDate = new Date(ndr.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <tr key={ndr.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                  {showCheckboxes && (
                    <td className="px-6 py-4">
                      {isActionable ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(ndr.id)}
                          onChange={() => toggleOne(ndr.id)}
                          className="rounded border-slate-300 dark:border-white/[0.08] text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4 bg-white dark:bg-[#0f1117]"
                        />
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                      {ndr.shipment.awb_number || 'No AWB'}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{ndr.shipment.provider.display_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {ndr.shipment.order.order_reference}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{ndr.shipment.order.customer_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <NdrReasonBadge reasonCode={ndr.reason_code} />
                    <div className="text-xs text-slate-405 dark:text-slate-500 mt-0.5 max-w-xs truncate" title={ndr.raw_reason}>
                      {ndr.raw_reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                    {ndr.attempt_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[ndr.status]?.bg} ${STATUS_CONFIG[ndr.status]?.text}`}>
                      {STATUS_CONFIG[ndr.status]?.label || ndr.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isActionable ? (
                      isSlaBreached ? (
                        <span className="flex items-center space-x-1 text-xs font-bold text-rose-600 bg-red-50 dark:bg-rose-955/20 border border-red-200 dark:border-rose-900/30 px-2 py-0.5 rounded-full w-fit">
                          <AlertTriangle className="h-3 w-3" />
                          <span>BREACHED</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Due: {new Date(ndr.sla_due_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Resolved</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                    <Link
                      href={`/ndr/${ndr.id}`}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-900/40 px-2.5 py-1.5 rounded-xl transition outline-none"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Take Action</span>
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
