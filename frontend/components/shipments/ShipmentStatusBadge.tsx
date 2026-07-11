import React from 'react';

interface ShipmentStatusBadgeProps {
  status: string;
}

export function ShipmentStatusBadge({ status }: ShipmentStatusBadgeProps) {
  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    created: { label: 'Created', bg: 'bg-gray-100', text: 'text-gray-700' },
    awb_generated: { label: 'AWB Generated', bg: 'bg-blue-50', text: 'text-blue-700' },
    pickup_scheduled: { label: 'Pickup Scheduled', bg: 'bg-indigo-50', text: 'text-indigo-700' },
    picked_up: { label: 'Picked Up', bg: 'bg-purple-50', text: 'text-purple-700' },
    in_transit: { label: 'In Transit', bg: 'bg-amber-50', text: 'text-amber-700' },
    out_for_delivery: { label: 'Out for Delivery', bg: 'bg-orange-50', text: 'text-orange-700' },
    delivered: { label: 'Delivered', bg: 'bg-green-50', text: 'text-green-700' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-700' },
    failed: { label: 'Failed', bg: 'bg-rose-100', text: 'text-rose-800' },
  };

  const config = statusConfig[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
