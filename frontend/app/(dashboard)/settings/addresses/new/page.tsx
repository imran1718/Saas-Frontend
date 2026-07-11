'use client';

import React from 'react';
import { AddressForm } from '../../../../../components/addresses/AddressForm';

export default function NewAddressPage() {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Address</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new pickup location for your shipments.
        </p>
      </div>
      
      <AddressForm />
    </div>
  );
}
