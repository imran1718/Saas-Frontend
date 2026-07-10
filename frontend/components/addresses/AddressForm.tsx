import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { useRouter } from 'next/navigation';

export const AddressForm = ({ addressId }: { addressId?: string }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    label: '', contact_name: '', contact_phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', is_default: false
  });
  const [loading, setLoading] = useState(!!addressId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (addressId) {
      apiClient.get(`/addresses/${addressId}`)
        .then(({ data }) => setFormData(data.data))
        .catch(err => setError('Failed to load address'))
        .finally(() => setLoading(false));
    }
  }, [addressId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (addressId) {
        await apiClient.put(`/addresses/${addressId}`, formData);
      } else {
        await apiClient.post('/addresses', formData);
      }
      router.push('/settings/addresses');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save address');
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl space-y-6">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Label (e.g. Warehouse 1)</label>
          <input required type="text" name="label" value={formData.label} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Pincode</label>
          <input required type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
          <input required type="text" name="address_line1" value={formData.address_line1} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Address Line 2 (Optional)</label>
          <input type="text" name="address_line2" value={formData.address_line2 || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input required type="text" name="city" value={formData.city} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">State</label>
          <input required type="text" name="state" value={formData.state} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
        </div>

        <div className="pt-4 border-t border-gray-100 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Name</label>
            <input required type="text" name="contact_name" value={formData.contact_name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
            <input required type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
          </div>
        </div>
      </div>

      <div className="flex items-center mt-4">
        <input type="checkbox" name="is_default" id="is_default" checked={formData.is_default} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
        <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">Set as default pickup address</label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </form>
  );
};
