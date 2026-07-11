'use client';

import React, { useState } from 'react';

export default function ApiKeyTable({ apiKeys, onRevoke }) {
  const [revoking, setRevoking] = useState(null);

  const handleRevoke = async (id) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone and integrations using this key will fail.')) {
      setRevoking(id);
      await onRevoke(id);
      setRevoking(null);
    }
  };

  if (!apiKeys || apiKeys.length === 0) {
    return <div className="text-gray-500 p-4 border rounded-lg bg-gray-50 text-sm">No API keys found. Create one to get started.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prefix</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Used</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 text-sm">
          {apiKeys.map((key) => (
            <tr key={key.id}>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{key.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono">{key.key_prefix}••••••••</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {key.is_active ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Revoked</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                {new Date(key.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {key.is_active && (
                  <button
                    onClick={() => handleRevoke(key.id)}
                    disabled={revoking === key.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {revoking === key.id ? 'Revoking...' : 'Revoke'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
