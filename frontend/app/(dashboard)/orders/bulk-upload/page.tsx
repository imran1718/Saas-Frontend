'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowDownToLine, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { BulkUploadDropzone } from '@/components/orders/BulkUploadDropzone';
import { ImportResultReport } from '@/components/orders/ImportResultReport';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

interface ImportRecord {
  id: string;
  file_name: string;
  total_rows: number;
  success_count: number;
  failed_count: number;
  error_report_url: string | null;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

export default function BulkUploadPage() {
  const [loading, setLoading] = useState(false);
  const [recentRecord, setRecentRecord] = useState<ImportRecord | null>(null);
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await apiClient.get('/orders/imports?limit=10');
      setHistory(res.data.data.items || []);
    } catch (err: any) {
      console.error('Failed to load imports history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.get('/orders/template', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'orders-upload-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download template');
    }
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setRecentRecord(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/orders/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setRecentRecord(res.data.data);
      fetchHistory();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Bulk upload failed. Verify columns matching requirements.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/orders"
            className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bulk Orders Import</h1>
            <p className="text-xs text-gray-500">Upload CSV/Excel spreadsheets to create multiple shipments in batch.</p>
          </div>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center space-x-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm cursor-pointer shrink-0"
        >
          <ArrowDownToLine className="h-4 w-4" />
          <span>Download Template</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl flex items-center space-x-3 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload dropzone column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Upload Spreadsheet</h2>
              <BulkUploadDropzone onUpload={handleUpload} loading={loading} />
            </CardContent>
          </Card>

          {recentRecord && (
            <ImportResultReport record={recentRecord} />
          )}
        </div>

        {/* Instructions panel */}
        <div>
          <Card>
            <CardContent className="p-6 space-y-4 text-sm text-gray-600">
              <h2 className="text-sm font-semibold text-gray-800 border-b pb-2">Instructions & Constraints</h2>
              
              <ul className="list-disc pl-5 space-y-2">
                <li>Use the exact headers provided in the downloadable template sheet.</li>
                <li><strong>order_reference</strong>: Must be unique for your tenant, alphanumeric with hyphens.</li>
                <li><strong>pickup_address_id</strong>: Must match a valid Warehouse UUID in your address list.</li>
                <li><strong>shipping_pincode</strong>: Must be a 6-digit Indian Pin code.</li>
                <li><strong>weight_kg</strong>: Must be a positive decimal up to 50 kg max.</li>
                <li>Multiple rows with the same reference are grouped as a single order containing multiple products.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Uploads History */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Recent Import History</h2>
            <button
              onClick={fetchHistory}
              title="Refresh History"
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center py-6">
              <Spinner className="h-5 w-5 text-blue-600" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No recent bulk imports found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-2">Date</th>
                    <th className="py-2">File Name</th>
                    <th className="py-2 text-center">Total</th>
                    <th className="py-2 text-center text-green-700">Success</th>
                    <th className="py-2 text-center text-red-700">Failed</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3.5 whitespace-nowrap text-xs text-gray-500">
                        {new Date(record.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 font-semibold text-gray-900 truncate max-w-xs">{record.file_name}</td>
                      <td className="py-3.5 text-center">{record.total_rows}</td>
                      <td className="py-3.5 text-center text-green-700 font-semibold">{record.success_count}</td>
                      <td className="py-3.5 text-center text-red-700 font-semibold">{record.failed_count}</td>
                      <td className="py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${record.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : record.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        {record.error_report_url ? (
                          <a
                            href={record.error_report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-yellow-600 hover:text-yellow-700 font-semibold underline"
                          >
                            Error Log
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
