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
        <h2 className="text-xl font-bold">Roles</h2>
        {canCreate && (
          <Link href="/settings/roles/new">
            <Button>Create Role</Button>
          </Link>
        )}
      </div>

      <div className="bg-white shadow rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map(role => (
              <tr key={role.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {role.is_editable ? 'Custom' : 'System Locked'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {role.permissions ? role.permissions.length : 0} assigned
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  {canUpdate && (
                    <Link href={`/settings/roles/${role.id}`} className="text-primary-600 hover:text-primary-900">
                      {role.is_editable ? 'Edit' : 'View'}
                    </Link>
                  )}
                  {canDelete && role.is_editable && (
                    <button onClick={() => handleDelete(role.id, role.name)} className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No roles found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
