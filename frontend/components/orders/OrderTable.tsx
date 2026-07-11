import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Edit3, XSquare, ClipboardList, CheckCircle } from 'lucide-react';
import { OrderStatusBadge } from './OrderStatusBadge';
import { apiClient } from '../../lib/apiClient';

export interface OrderListItem {
  id: string;
  order_reference: string;
  created_at: string;
  customer_name: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  payment_mode: 'prepaid' | 'cod';
  order_value: string;
  status: 'pending' | 'processing' | 'ready_to_ship' | 'cancelled';
}

interface OrderTableProps {
  orders: OrderListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({ orders, pagination, onPageChange, onRefresh }) => {
  const [transitioningId, setTransitioningId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setTransitioningId(id);
    try {
      await apiClient.put(`/orders/${id}/status`, { status: newStatus, note: `Status updated to ${newStatus}` });
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update status');
    } finally {
      setTransitioningId(null);
    }
  };

  const handleCancelOrder = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setTransitioningId(id);
    try {
      await apiClient.delete(`/orders/${id}`, { data: { note: 'Cancelled by merchant dashboard' } });
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel order');
    } finally {
      setTransitioningId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-[#131620] rounded-xl border border-slate-100 dark:border-white/[0.06] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-white/[0.06]">
          <thead className="bg-slate-50 dark:bg-[#0f1117]/80">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Destination</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payment</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#131620] divide-y divide-slate-100 dark:divide-white/[0.06]">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                  No orders found matching filters.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">
                    {order.order_reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 dark:text-slate-200">
                    {order.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {order.shipping_city}, {order.shipping_state} ({order.shipping_pincode})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 capitalize">
                    {order.payment_mode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">
                    ₹{parseFloat(order.order_value).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Details button */}
                      <Link
                        href={`/orders/${order.id}`}
                        title="View Details"
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>

                      {/* Edit button (only if editable status) */}
                      {['pending', 'processing'].includes(order.status) && (
                        <Link
                          href={`/orders/${order.id}/edit`}
                          title="Edit Order"
                          className="text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] transition"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                      )}

                      {/* Quick status transition actions */}
                      {order.status === 'pending' && (
                        <button
                          disabled={transitioningId === order.id}
                          onClick={() => handleStatusChange(order.id, 'processing')}
                          title="Mark Processing"
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] transition cursor-pointer outline-none"
                        >
                          <ClipboardList className="h-4 w-4" />
                        </button>
                      )}

                      {order.status === 'processing' && (
                        <button
                          disabled={transitioningId === order.id}
                          onClick={() => handleStatusChange(order.id, 'ready_to_ship')}
                          title="Mark Ready to Ship"
                          className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] transition cursor-pointer outline-none"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}

                      {/* Cancel action */}
                      {['pending', 'processing'].includes(order.status) && (
                        <button
                          disabled={transitioningId === order.id}
                          onClick={() => handleCancelOrder(order.id)}
                          title="Cancel Order"
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] transition cursor-pointer outline-none"
                        >
                          <XSquare className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {pagination && pagination.total_pages > 1 && (
        <div className="bg-slate-50 dark:bg-[#0f1117]/50 border-t border-slate-100 dark:border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{orders.length}</span> of <span className="font-semibold text-slate-700 dark:text-slate-300">{pagination.total}</span> orders
          </div>
          <div className="flex space-x-1">
            <button
              disabled={pagination.page === 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="text-xs bg-white dark:bg-transparent border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-white/[0.02] disabled:opacity-50 transition cursor-pointer outline-none"
            >
              Previous
            </button>
            {[...Array(pagination.total_pages)].map((_, i) => (
              <button
                key={i}
                onClick={() => onPageChange(i + 1)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer outline-none ${pagination.page === i + 1 ? 'bg-indigo-600 text-white border border-indigo-600' : 'bg-white dark:bg-transparent border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.02]'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={pagination.page === pagination.total_pages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="text-xs bg-white dark:bg-transparent border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-white/[0.02] disabled:opacity-50 transition cursor-pointer outline-none"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
