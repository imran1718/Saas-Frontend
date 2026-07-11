'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Upload, RefreshCw, BarChart2, ShieldCheck, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { OrderTable, OrderListItem } from '@/components/orders/OrderTable';
import { Spinner } from '@/components/ui/Spinner';

interface DashboardSummary {
  pending: number;
  processing: number;
  ready_to_ship: number;
  cancelled: number;
}

export default function OrdersListPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    pending: 0,
    processing: 0,
    ready_to_ship: 0,
    cancelled: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  });

  const [filters, setFilters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (pageIndex: number, currentFilters: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      // Build query string params
      const params = {
        page: pageIndex,
        limit: pagination.limit,
        ...currentFilters,
      };

      const [ordersRes, summaryRes] = await Promise.all([
        apiClient.get('/orders', { params }),
        apiClient.get('/orders/summary')
      ]);

      setOrders(ordersRes.data.data.items || []);
      setPagination(ordersRes.data.data.pagination);
      setSummary(summaryRes.data.data);
    } catch (err: any) {
      console.error('Failed to load orders', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch orders data. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchOrders(1, filters);
  }, [filters, fetchOrders]);

  const handlePageChange = (newPage: number) => {
    fetchOrders(newPage, filters);
  };

  const handleRefresh = () => {
    fetchOrders(pagination.page, filters);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Order Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage manual orders, imports history, and shipment state transitions.</p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <Link
            href="/orders/bulk-upload"
            className="flex items-center space-x-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Bulk Import</span>
          </Link>
          <Link
            href="/orders/new"
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Order</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl flex items-center space-x-3 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Aggregate Stats Widget */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pending Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.pending}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
            <RefreshCw className="h-5 w-5 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        {/* Processing Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Processing</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.processing}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <BarChart2 className="h-5 w-5" />
          </div>
        </div>

        {/* Ready to Ship Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ready to Ship</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.ready_to_ship}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Cancelled Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cancelled</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.cancelled}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
            <Plus className="h-5 w-5 rotate-45 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <OrderFilters onFilterChange={setFilters} />

      {/* Order list / Loader */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Spinner className="h-8 w-8 text-blue-600" />
          <p className="text-sm text-gray-500 font-medium">Fetching orders list...</p>
        </div>
      ) : (
        <OrderTable
          orders={orders}
          pagination={pagination}
          onPageChange={handlePageChange}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
