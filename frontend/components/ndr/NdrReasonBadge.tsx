import React from 'react';

interface NdrReasonBadgeProps {
  reasonCode: string;
}

export function NdrReasonBadge({ reasonCode }: NdrReasonBadgeProps) {
  const configs: Record<string, { label: string; bg: string; text: string; border: string }> = {
    CUSTOMER_UNAVAILABLE: { label: 'Unavailable', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    ADDRESS_INCORRECT: { label: 'Incorrect Address', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    CUSTOMER_REFUSED: { label: 'Customer Refused', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    COD_NOT_READY: { label: 'COD Cash Not Ready', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    OTHER: { label: 'Other operational issue', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  };

  const config = configs[reasonCode] || { label: reasonCode, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  );
}
