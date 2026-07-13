import React from 'react';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

export default function TicketPriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    low: 'bg-gray-50 text-gray-600 border-gray-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-100',
    high: 'bg-orange-50 text-orange-700 border-orange-100',
    urgent: 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${styles[priority] || styles.medium}`}>
      {priority}
    </span>
  );
}
