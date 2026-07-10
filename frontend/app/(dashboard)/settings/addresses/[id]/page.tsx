'use client';

import React from 'react';
import { AddressForm } from '../../../../../components/addresses/AddressForm';

export default function EditAddressPage({ params }: { params: { id: string } }) {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Address</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update the details of this pickup location.
        </p>
      </div>
      
      <AddressForm addressId={params.id} />
    </div>
  );
}
