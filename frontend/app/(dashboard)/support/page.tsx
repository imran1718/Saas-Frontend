'use client';

import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, HelpCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';

// Widgets
import TicketTable from '@/components/support/TicketTable';
import TicketForm from '@/components/support/TicketForm';

export default function SupportTicketsPage() {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);

  // Search/Filters state
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTickets = async () => {
    setLoading(true);
    const params: any = { page, limit: 15 };
    if (status) params.status = status;
    if (category) params.category = category;
    if (priority) params.priority = priority;

    try {
      const response = await apiClient.get('/support/tickets', { params });
      if (response.data.success) {
        setTickets(response.data.data.tickets);
        setTotalPages(response.data.data.pages);
      }
    } catch (err: any) {
      toast.error('Failed to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'list') {
      fetchTickets();
    }
  }, [view, status, category, priority, page]);

  if (view === 'create') {
    return (
      <div className="py-6">
        <TicketForm onBack={() => setView('list')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <HelpCircle className="h-5.5 w-5.5 text-blue-600" />
            <span>Helpdesk Support Tickets</span>
          </h2>
          <p className="text-xs text-gray-500">Submit, inspect, and track support logs raised with dispatch support managers</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-gray-50 border border-gray-200/80 rounded-xl text-gray-500 hover:text-gray-700 transition shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setView('create')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Raise Support Ticket</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-gray-50 border border-gray-200/85 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-600 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_on_tenant">Waiting on Tenant</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="bg-gray-50 border border-gray-200/85 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-600 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="shipment_issue">Shipment Issue</option>
            <option value="billing">Billing & Invoice</option>
            <option value="technical">Technical glitch</option>
            <option value="account">Account credentials</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            className="bg-gray-50 border border-gray-200/85 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-600 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Ticket List Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <TicketTable tickets={tickets} />
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <button
            onClick={() => setPage(Math.max(page - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-gray-50 transition"
          >
            Prev
          </button>
          <span className="text-xs font-bold text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(page + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-gray-50 transition"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
}
