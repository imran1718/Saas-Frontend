'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { OrderForm } from '@/components/orders/OrderForm';

export default function CreateOrderPage() {
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center space-x-3 border-b pb-4">
        <Link
          href="/orders"
          className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Manual Order</h1>
          <p className="text-xs text-gray-500">Insert custom order details and products line items manually.</p>
        </div>
      </div>

      <OrderForm />
    </div>
  );
}
