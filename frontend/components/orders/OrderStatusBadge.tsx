import React from 'react';

interface OrderStatusBadgeProps {
  status: 'pending' | 'processing' | 'ready_to_ship' | 'cancelled';
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    ready_to_ship: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const label = {
    pending: 'Pending',
    processing: 'Processing',
    ready_to_ship: 'Ready to Ship',
    cancelled: 'Cancelled',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {label[status] || status}
    </span>
  );
};
