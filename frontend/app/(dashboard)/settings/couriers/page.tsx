'use client';

'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { AvailableCourierCard } from '@/components/couriers/AvailableCourierCard';
import { Spinner } from '@/components/ui/Spinner';

interface Courier {
  id: string;
  provider_key: string;
  display_name: string;
  logo_url: string | null;
  supports_cod: boolean;
  supports_prepaid: boolean;
  max_weight_kg: number | null;
  service_types: string[];
  priority: number;
}

export default function AvailableCouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCouriers() {
      try {
        const response = await apiClient.get('/couriers');
        if (response.data && response.data.success) {
          setCouriers(response.data.data);
        } else {
          setError(response.data.error?.message || 'Failed to load couriers');
        }
      } catch (err: any) {
        console.error('Fetch couriers error:', err);
        setError(err.response?.data?.error?.message || 'Failed to connect to server');
      } finally {
        setLoading(false);
      }
    }
    fetchCouriers();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Available Couriers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Couriers assigned to your tenant profile. These will be available for shipment booking.
        </p>
      </div>

      <SettingsNav />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-10 h-10 text-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      ) : couriers.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center border border-dashed border-gray-200">
          <h3 className="text-lg font-bold text-gray-700 mb-1">No Couriers Available</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Your tenant profile has not been assigned any active shipping couriers yet. Please contact platform support.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {couriers.map((courier) => (
            <AvailableCourierCard key={courier.id} courier={courier} />
          ))}
        </div>
      )}
    </div>
  );
}
