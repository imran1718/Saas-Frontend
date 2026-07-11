import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { useFileUpload } from '../../lib/useFileUpload';
import { Camera } from 'lucide-react';

interface CompanyProfile {
  legal_name: string | null;
  gstin: string | null;
  business_type: string | null;
  support_email: string | null;
  support_phone: string | null;
  logo_url: string | null;
}

export const CompanyProfileForm = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { uploadFile, isUploading } = useFileUpload();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get('/company/profile');
        setProfile(data.data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (profile) {
      setProfile({ ...profile, [e.target.name]: e.target.value });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setError('');
      const res = await uploadFile('/company/profile/logo', file, 'logo');
      setProfile(prev => prev ? { ...prev, logo_url: res.data.logo_url } : null);
      setSuccess('Logo uploaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to upload logo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await apiClient.put('/company/profile', profile);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (!profile) return <div>Failed to load profile</div>;

  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  const logoUrl = profile.logo_url ? (profile.logo_url.startsWith('http') ? profile.logo_url : `${backendUrl}${profile.logo_url}`) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white dark:bg-[#131620] p-6 rounded-xl shadow-sm border border-slate-100 dark:border-white/[0.06]">
      {error && <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm border border-red-200 dark:border-red-900/30">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 p-3 rounded-md text-sm border border-green-200 dark:border-green-900/30">{success}</div>}
      
      <div className="flex items-center space-x-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-[#0f1117] flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/[0.08]">
            {logoUrl ? (
              <img src={logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-indigo-700 shadow-sm transition">
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploading} />
          </label>
        </div>
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">Company Logo</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">JPG, PNG up to 2MB</p>
          {isUploading && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Uploading...</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Legal Name</label>
          <input type="text" name="legal_name" value={profile.legal_name || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">GSTIN</label>
          <input type="text" name="gstin" value={profile.gstin || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Business Type</label>
          <select name="business_type" value={profile.business_type || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border outline-none">
            <option value="" className="dark:bg-[#131620]">Select Type</option>
            <option value="individual" className="dark:bg-[#131620]">Individual</option>
            <option value="proprietorship" className="dark:bg-[#131620]">Proprietorship</option>
            <option value="partnership" className="dark:bg-[#131620]">Partnership</option>
            <option value="pvt_ltd" className="dark:bg-[#131620]">Private Limited</option>
            <option value="llp" className="dark:bg-[#131620]">LLP</option>
            <option value="other" className="dark:bg-[#131620]">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Support Email</label>
          <input type="email" name="support_email" value={profile.support_email || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Support Phone</label>
          <input type="text" name="support_phone" value={profile.support_phone || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border outline-none" />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-50 font-medium transition-colors">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};
