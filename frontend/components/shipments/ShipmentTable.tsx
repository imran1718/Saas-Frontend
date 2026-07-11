import React from 'react';
import Link from 'next/link';
import { Eye, Printer, Copy, FileText, XCircle } from 'lucide-react';
import { ShipmentStatusBadge } from './ShipmentStatusBadge';

export interface ShipmentRecord {
  id: string;
  awb_number: string | null;
  service_type: string;
  selected_rate: string;
  status: string;
  label_url: string | null;
  created_at: string;
  provider: {
    display_name: string;
    provider_key: string;
  };
  order: {
    id: string;
    order_reference: string;
    customer_name: string;
  };
}

interface ShipmentTableProps {
  shipments: ShipmentRecord[];
  onCancel: (shipmentId: string) => void;
  selectedIds?: string[];
  onSelectChange?: (selectedIds: string[]) => void;
}

export function ShipmentTable({ shipments, onCancel, selectedIds = [], onSelectChange }: ShipmentTableProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('AWB copied to clipboard!');
  };

  const showCheckboxes = !!onSelectChange;
  const allSelected = shipments.length > 0 && selectedIds.length === shipments.length;

  const toggleAll = () => {
    if (!onSelectChange) return;
    if (allSelected) {
      onSelectChange([]);
    } else {
      onSelectChange(shipments.map((s) => s.id));
    }
  };

  const toggleOne = (id: string) => {
    if (!onSelectChange) return;
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  if (shipments.length === 0) {
    return (
      <div className="bg-white dark:bg-[#131620] border border-slate-100 dark:border-white/[0.06] rounded-2xl p-12 text-center shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-center text-indigo-550 dark:text-indigo-400 mb-4">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No shipments found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Start booking couriers for your orders to generate shipments, tracking records, and shipping labels.
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
              <th className="px-6 py-4">Order Ref</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Rate</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] bg-white dark:bg-[#131620]">
            {shipments.map((shipment) => {
              const cancellable = ['created', 'awb_generated', 'pickup_scheduled'].includes(shipment.status);
              const isSelected = selectedIds.includes(shipment.id);

              return (
                <tr key={shipment.id} className={`hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition ${isSelected ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''}`}>
                  {showCheckboxes && (
                    <td className="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(shipment.id)}
                        className="rounded border-slate-300 dark:border-white/[0.08] text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4 bg-white dark:bg-[#0f1117]"
                      />
                    </td>
                  )}
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-col">
                      {shipment.awb_number ? (
                        <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white">
                          <span>{shipment.awb_number}</span>
                          <button
                            onClick={() => handleCopy(shipment.awb_number!)}
                            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition outline-none"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs italic">Awaiting AWB</span>
                      )}
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {shipment.provider?.display_name || 'Generic'} ({shipment.service_type})
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {shipment.order ? (
                      <Link
                        href={`/orders/${shipment.order.id}`}
                        className="text-indigo-650 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold"
                      >
                        {shipment.order.order_reference}
                      </Link>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 font-medium">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                    {shipment.order?.customer_name || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-bold text-slate-900 dark:text-white">
                    ₹{parseFloat(shipment.selected_rate).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <ShipmentStatusBadge status={shipment.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-550 dark:text-slate-400">
                    {new Date(shipment.created_at).toLocaleString('en-IN')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/shipments/${shipment.id}`}
                        className="p-1.5 text-slate-450 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-405 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition outline-none"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>

                      {shipment.label_url && (
                        <a
                          href={shipment.label_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-450 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition outline-none"
                          title="Print Label"
                        >
                          <Printer className="h-4 w-4" />
                        </a>
                      )}

                      {cancellable && (
                        <button
                          onClick={() => onCancel(shipment.id)}
                          className="p-1.5 text-slate-450 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition outline-none"
                          title="Cancel Booking"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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
