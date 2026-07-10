import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { AddressCard } from './AddressCard';
import { Search } from 'lucide-react';
import Link from 'next/link';

export const AddressTable = () => {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchAddresses = async () => {
    try {
      const { data } = await apiClient.get('/addresses', { params: { search } });
      setAddresses(data.data.addresses);
    } catch (err: any) {
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [search]);

  const handleSetDefault = async (id: string) => {
    try {
      await apiClient.put(`/addresses/${id}/set-default`);
      fetchAddresses();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to set default');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await apiClient.delete(`/addresses/${id}`);
      fetchAddresses();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete address');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
            placeholder="Search addresses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link href="/settings/addresses/new" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors">
          Add New Address
        </Link>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No addresses found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <AddressCard 
              key={addr.id} 
              address={addr} 
              onSetDefault={handleSetDefault} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
