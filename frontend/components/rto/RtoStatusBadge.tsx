import React from 'react';

interface RtoStatusBadgeProps {
  status: string;
}

export function RtoStatusBadge({ status }: RtoStatusBadgeProps) {
  const configs: Record<string, { label: string; bg: string; text: string; border: string }> = {
    rto_initiated: { label: 'Return Initiated', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    rto_in_transit: { label: 'Return In Transit', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    rto_delivered: { label: 'Returned to Origin', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    rto_lost: { label: 'Return Lost', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };

  const config = configs[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  );
}
