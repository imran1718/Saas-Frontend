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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#131620] p-6 rounded-xl shadow-sm border border-slate-100 dark:border-white/[0.06] max-w-2xl space-y-6">
      {error && <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm border border-red-200 dark:border-red-900/30">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Label (e.g. Warehouse 1)</label>
          <input required type="text" name="label" value={formData.label} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Pincode</label>
          <input required type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border outline-none" />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Address Line 1</label>
          <input required type="text" name="address_line1" value={formData.address_line1} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border outline-none" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Address Line 2 (Optional)</label>
          <input type="text" name="address_line2" value={formData.address_line2 || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">City</label>
          <input required type="text" name="city" value={formData.city} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">State</label>
          <input required type="text" name="state" value={formData.state} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border outline-none" />
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Name</label>
            <input required type="text" name="contact_name" value={formData.contact_name} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Phone</label>
            <input required type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border outline-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center mt-4">
        <input type="checkbox" name="is_default" id="is_default" checked={formData.is_default} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-white/[0.08] rounded bg-white dark:bg-[#0f1117]" />
        <label htmlFor="is_default" className="ml-2 block text-sm text-slate-900 dark:text-slate-200">Set as default pickup address</label>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-slate-300 dark:border-white/[0.08] rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition">
          {saving ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </form>
  );
};
