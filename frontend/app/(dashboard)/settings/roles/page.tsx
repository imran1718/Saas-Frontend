import React from 'react';
import { RoleTable } from '@/components/roles/RoleTable';
import { SettingsNav } from '@/components/settings/SettingsNav';

export default function RolesPage() {
  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Define system roles and adjust authorization permissions for staff.
          </p>
        </div>
      </div>

      <SettingsNav />

      <RoleTable />
    </div>
  );
}
