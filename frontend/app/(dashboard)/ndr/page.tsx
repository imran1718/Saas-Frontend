'use client';

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Spinner } from '@/components/ui/Spinner';
import { NdrTable, NdrRecord } from '@/components/ndr/NdrTable';
import { BulkNdrActionBar } from '@/components/ndr/BulkNdrActionBar';
import { RotateCw, AlertTriangle, ShieldAlert, Users, Phone, MapPin, Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface SummaryData {
  total_open: number;
  by_reason: {
    CUSTOMER_UNAVAILABLE: number;
    ADDRESS_INCORRECT: number;
    CUSTOMER_REFUSED: number;
    COD_NOT_READY: number;
    OTHER: number;
  };
  aging_over_sla: number;
}

export default function NdrPage() {
  const [ndrEvents, setNdrEvents] = useState<NdrRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    total_open: 0,
    by_reason: { CUSTOMER_UNAVAILABLE: 0, ADDRESS_INCORRECT: 0, CUSTOMER_REFUSED: 0, COD_NOT_READY: 0, OTHER: 0 },
    aging_over_sla: 0,
  });

  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [status, setStatus] = useState<string>('open');
  const [reasonCode, setReasonCode] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await apiClient.get('/ndr/summary');
      setSummary(res.data.data);
    } catch (err) {
      console.error('Failed to load NDR summary statistics:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchNdrEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: status || undefined,
        reason_code: reasonCode || undefined,
        page,
        limit: 10,
      };

      const res = await apiClient.get('/ndr', { params });
      setNdrEvents(res.data.data.rows);
      setTotalPages(res.data.data.pagination.totalPages);
      setSelectedIds([]); // Clear selection when list page changes
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load NDR exceptions list');
    } finally {
      setLoading(false);
    }
  }, [status, reasonCode, page]);

  useEffect(() => {
    fetchNdrEvents();
    fetchSummary();
  }, [fetchNdrEvents]);

  const handleBulkAction = async (actionType: 'reattempt' | 'mark_rto', notes: string) => {
    setActionLoading(true);
    try {
      const res = await apiClient.post('/ndr/bulk-action', {
        ndr_ids: selectedIds,
        action_type: actionType,
        notes,
      });

      const { processed, failed } = res.data.data;
      if (failed === 0) {
        toast.success(`Successfully processed ${processed} exceptions in bulk!`);
      } else {
        toast.error(`Processed: ${processed}, Failed: ${failed} exceptions.`);
      }

      fetchNdrEvents();
      fetchSummary();
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to execute bulk action');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">NDR Exception Management</h1>
          <p className="text-xs text-gray-500">Address courier delivery exception status and correct delivery issues.</p>
        </div>
        <button
          onClick={() => { fetchNdrEvents(); fetchSummary(); }}
          className="flex items-center space-x-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Open */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="h-10 w-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Open exceptions</p>
            <h3 className="text-xl font-black text-gray-900 mt-1">
              {summaryLoading ? '...' : summary.total_open}
            </h3>
          </div>
        </div>

        {/* SLA Aging Breaches */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">SLA Aging Breaches</p>
            <h3 className="text-xl font-black text-rose-600 mt-1">
              {summaryLoading ? '...' : summary.aging_over_sla}
            </h3>
          </div>
        </div>

        {/* Address Issues */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="h-10 w-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Address Problems</p>
            <h3 className="text-xl font-black text-gray-900 mt-1">
              {summaryLoading ? '...' : summary.by_reason.ADDRESS_INCORRECT}
            </h3>
          </div>
        </div>

        {/* Customer Unavailable */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="h-10 w-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Cust. Unavailable</p>
            <h3 className="text-xl font-black text-gray-900 mt-1">
              {summaryLoading ? '...' : summary.by_reason.CUSTOMER_UNAVAILABLE}
            </h3>
          </div>
        </div>
      </div>

      {/* Filters and List */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <Search className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
        >
          <option value="">All statuses</option>
          <option value="open">Open Exceptions</option>
          <option value="action_taken">Action Taken</option>
          <option value="resolved_delivered">Resolved (Delivered)</option>
          <option value="resolved_rto">Resolved (RTO)</option>
        </select>

        <select
          value={reasonCode}
          onChange={(e) => { setReasonCode(e.target.value); setPage(1); }}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
        >
          <option value="">All Reason Codes</option>
          <option value="CUSTOMER_UNAVAILABLE">Customer Unavailable</option>
          <option value="ADDRESS_INCORRECT">Incorrect Address</option>
          <option value="CUSTOMER_REFUSED">Customer Refused</option>
          <option value="COD_NOT_READY">COD Cash Not Ready</option>
          <option value="OTHER">Other Issue</option>
        </select>
      </div>

      {error && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Spinner className="h-8 w-8 text-blue-600" />
        </div>
      ) : (
        <>
          <NdrTable
            ndrEvents={ndrEvents}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-gray-200/80 rounded-2xl px-5 py-4 shadow-sm">
              <p className="text-xs text-gray-500 font-semibold">
                Page {page} of {totalPages}
              </p>
              <div className="flex space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating Action Bar */}
      <BulkNdrActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkAction={handleBulkAction}
        loading={actionLoading}
      />
    </div>
  );
}
