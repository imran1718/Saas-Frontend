'use client';

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Spinner } from '@/components/ui/Spinner';
import { RtoTable, RtoRecordData } from '@/components/rto/RtoTable';
import { RotateCw, ArrowLeftRight, Search } from 'lucide-react';

export default function RtoPage() {
  const [rtoRecords, setRtoRecords] = useState<RtoRecordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchRtoRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: status || undefined,
        page,
        limit: 10,
      };

      const res = await apiClient.get('/rto', { params });
      setRtoRecords(res.data.data.rows);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load RTO returns list');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchRtoRecords();
  }, [fetchRtoRecords]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Returns & RTO Tracking</h1>
          <p className="text-xs text-gray-500">Track and manage reverse shipments returning to origin warehouse.</p>
        </div>
        <button
          onClick={fetchRtoRecords}
          className="flex items-center space-x-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filters */}
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
          <option value="">All return states</option>
          <option value="rto_initiated">Return Initiated</option>
          <option value="rto_in_transit">Return In Transit</option>
          <option value="rto_delivered">Delivered to Origin</option>
          <option value="rto_lost">Return Lost</option>
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
          <RtoTable rtoRecords={rtoRecords} />

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
    </div>
  );
}
