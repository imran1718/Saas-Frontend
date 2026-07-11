'use client';

import React from 'react';
import { AddressTable } from '../../../../components/addresses/AddressTable';
import { SettingsNav } from '../../../../components/settings/SettingsNav';

export default function AddressesPage() {
  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pickup Addresses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your warehouses and pickup locations.
          </p>
        </div>
      </div>

      <SettingsNav />
      
      <AddressTable />
    </div>
  );
}
