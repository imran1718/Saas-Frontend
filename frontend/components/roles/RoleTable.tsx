'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { usePermission } from '@/lib/usePermission';
import Link from 'next/link';

export const RoleTable = () => {
  const canUpdate = usePermission('role.update');
  const canDelete = usePermission('role.delete');
  const canCreate = usePermission('role.create');
  
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadRoles = () => {
    setIsLoading(true);
    apiClient.get('/roles')
      .then(res => setRoles(res.data.data.rows || []))
      .catch(() => setErrorMsg('Failed to load roles.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the role "${name}"?`)) return;
    try {
      await apiClient.delete(`/roles/${id}`);
      loadRoles();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete role.');
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      {errorMsg && <Alert type="error" message={errorMsg} />}
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Roles</h2>
        {canCreate && (
          <Link href="/settings/roles/new">
            <Button>Create Role</Button>
          </Link>
        )}
      </div>

      <div className="bg-white dark:bg-[#131620] border border-slate-100 dark:border-white/[0.06] rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-white/[0.06]">
          <thead className="bg-slate-50 dark:bg-[#0f1117]/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Permissions</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#131620] divide-y divide-slate-100 dark:divide-white/[0.06]">
            {roles.map(role => (
              <tr key={role.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{role.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                  {role.is_editable ? 'Custom' : 'System Locked'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                  {role.permissions ? role.permissions.length : 0} assigned
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  {canUpdate && (
                    <Link href={`/settings/roles/${role.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                      {role.is_editable ? 'Edit' : 'View'}
                    </Link>
                  )}
                  {canDelete && role.is_editable && (
                    <button onClick={() => handleDelete(role.id, role.name)} className="text-rose-600 hover:text-rose-900 dark:text-rose-450 dark:hover:text-rose-300 outline-none">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-550 dark:text-slate-400">No roles found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
