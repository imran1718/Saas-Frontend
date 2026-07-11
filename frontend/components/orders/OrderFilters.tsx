import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';

interface Address {
  id: string;
  label: string;
}

interface OrderFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({ onFilterChange }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [pickupAddressId, setPickupAddressId] = useState('');
  const [source, setSource] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    // Fetch pickup addresses to populate filter select options
    apiClient.get('/addresses?limit=100')
      .then(({ data }) => setAddresses(data.data.addresses || []))
      .catch(err => console.error('Failed to load addresses for filters', err));
  }, []);

  const handleApply = () => {
    onFilterChange({
      search: search.trim() || undefined,
      status: status || undefined,
      payment_mode: paymentMode || undefined,
      pickup_address_id: pickupAddressId || undefined,
      source: source || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  };

  const handleReset = () => {
    setSearch('');
    setStatus('');
    setPaymentMode('');
    setPickupAddressId('');
    setSource('');
    setDateFrom('');
    setDateTo('');
    onFilterChange({});
  };

  return (
    <div className="bg-white dark:bg-[#131620] p-4 rounded-xl border border-slate-100 dark:border-white/[0.06] shadow-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ref, customer name, phone"
            className="w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border outline-none"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border outline-none"
          >
            <option value="" className="dark:bg-[#131620]">All Statuses</option>
            <option value="pending" className="dark:bg-[#131620]">Pending</option>
            <option value="processing" className="dark:bg-[#131620]">Processing</option>
            <option value="ready_to_ship" className="dark:bg-[#131620]">Ready to Ship</option>
            <option value="cancelled" className="dark:bg-[#131620]">Cancelled</option>
          </select>
        </div>

        {/* Payment Mode */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Payment Mode</label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border outline-none"
          >
            <option value="" className="dark:bg-[#131620]">All Modes</option>
            <option value="prepaid" className="dark:bg-[#131620]">Prepaid</option>
            <option value="cod" className="dark:bg-[#131620]">COD</option>
          </select>
        </div>

        {/* Pickup Address */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pickup Address</label>
          <select
            value={pickupAddressId}
            onChange={(e) => setPickupAddressId(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border text-ellipsis overflow-hidden outline-none"
          >
            <option value="" className="dark:bg-[#131620]">All Locations</option>
            {addresses.map(addr => (
              <option key={addr.id} value={addr.id} className="dark:bg-[#131620]">{addr.label}</option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border outline-none"
          >
            <option value="" className="dark:bg-[#131620]">All Sources</option>
            <option value="manual" className="dark:bg-[#131620]">Manual</option>
            <option value="bulk_import" className="dark:bg-[#131620]">Bulk Import</option>
            <option value="api" className="dark:bg-[#131620]">API</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border outline-none"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-end space-x-2">
          <button
            onClick={handleApply}
            className="flex-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition outline-none"
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className="flex-1 text-sm bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 font-medium py-2 rounded-lg transition outline-none"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
