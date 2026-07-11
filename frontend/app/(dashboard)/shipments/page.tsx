'use client';

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, RotateCw, AlertTriangle, FileText, CheckCircle2, ShoppingBag } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Spinner } from '@/components/ui/Spinner';
import { ShipmentTable, ShipmentRecord } from '@/components/shipments/ShipmentTable';

interface SummaryData {
  awb_generated: number;
  in_transit: number;
  delivered: number;
  cancelled: number;
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    awb_generated: 0,
    in_transit: 0,
    delivered: 0,
    cancelled: 0,
  });

  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Selection & Bulk actions state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generatingBulk, setGeneratingBulk] = useState(false);

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await apiClient.get('/shipments/summary');
      setSummary(res.data.data);
    } catch (err) {
      console.error('Failed to load shipment summary statistics:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: status || undefined,
        search: search || undefined,
        page,
        limit: 10,
      };

      const res = await apiClient.get('/shipments', { params });
      setShipments(res.data.data.rows);
      setTotalPages(res.data.data.pagination.totalPages);
      setSelectedIds([]); // Clear selection when shipments list changes/reloads
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load shipments list');
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    fetchShipments();
    fetchSummary();
  }, [fetchShipments]);

  const handleCancelShipment = async (shipmentId: string) => {
    if (!confirm('Are you sure you want to cancel this courier booking AWB? This will revert the order status.')) return;

    try {
      await apiClient.put(`/shipments/${shipmentId}/cancel`);
      alert('Shipment successfully cancelled!');
      fetchShipments();
      fetchSummary();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel shipment');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShipments();
  };

  const handleBulkLabelGenerate = async () => {
    if (selectedIds.length === 0) return;
    setGeneratingBulk(true);
    try {
      const response = await apiClient.post('/shipments/bulk-label', {
        shipment_ids: selectedIds,
        format: '4x6',
      });
      if (response.data && response.data.success) {
        const url = response.data.data.label_url;
        // Construct full URL if it's a relative path on backend server upload
        const downloadUrl = url.startsWith('/')
          ? `${apiClient.defaults.baseURL?.replace('/api/v1', '')}${url}`
          : url;
        window.open(downloadUrl, '_blank');
        setSelectedIds([]);
      }
    } catch (err: any) {
      console.error('Bulk label generation error:', err);
      alert(err.response?.data?.error?.message || 'Failed to generate bulk labels');
    } finally {
      setGeneratingBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header title */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Shipments & Tracking</h1>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">Track waybills, shipping labels, and transit checkpoints</p>
        </div>
      </div>

      {/* Summary counters section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {summaryLoading ? '...' : summary.awb_generated}
            </div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">AWB Active</div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <RotateCw className="h-5 w-5 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {summaryLoading ? '...' : summary.in_transit}
            </div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">In Transit</div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {summaryLoading ? '...' : summary.delivered}
            </div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Delivered</div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {summaryLoading ? '...' : summary.cancelled}
            </div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Cancelled</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by AWB, order ref, or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2 text-sm transition outline-none"
            />
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 font-medium">Filter Status</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs transition outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="created">Created</option>
            <option value="awb_generated">AWB Generated</option>
            <option value="pickup_scheduled">Pickup Scheduled</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Spinner className="h-8 w-8 text-blue-600" />
          <p className="text-xs text-gray-500 font-semibold">Loading shipment records...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bulk actions bar */}
          {selectedIds.length > 0 && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-300">
              <div className="flex items-center space-x-3">
                <span className="bg-blue-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                  {selectedIds.length}
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  Shipments selected for bulk operations
                </span>
              </div>
              <button
                onClick={handleBulkLabelGenerate}
                disabled={generatingBulk}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-2 cursor-pointer"
              >
                {generatingBulk ? (
                  <>
                    <Spinner className="h-3.5 w-3.5 text-white mr-1" />
                    <span>Merging PDFs...</span>
                  </>
                ) : (
                  <span>Merge & Print Labels</span>
                )}
              </button>
            </div>
          )}

          <ShipmentTable
            shipments={shipments}
            onCancel={handleCancelShipment}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
