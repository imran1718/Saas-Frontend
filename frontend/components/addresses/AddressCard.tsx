import React from 'react';
import { MapPin, Phone, Star, MoreVertical } from 'lucide-react';
import Link from 'next/link';

interface Address {
  id: string;
  label: string;
  contact_name: string;
  contact_phone: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface AddressCardProps {
  address: Address;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({ address, onSetDefault, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative group">
      {address.is_default && (
        <div className="absolute -top-3 -right-3 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-sm">
          <Star className="w-3 h-3 mr-1 fill-current" /> Default
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg flex items-center">
            {address.label}
          </h3>
          <p className="text-gray-500 text-sm mt-1 flex items-center">
            <span className="font-medium mr-2">{address.contact_name}</span> • 
            <Phone className="w-3 h-3 mx-2" /> {address.contact_phone}
          </p>
        </div>
        
        <div className="relative group/menu">
          <button className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
            <MoreVertical className="w-5 h-5" />
          </button>
          <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
            <div className="py-1">
              <Link href={`/settings/addresses/${address.id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit</Link>
              {!address.is_default && (
                <button onClick={() => onSetDefault(address.id)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Set Default</button>
              )}
              <button onClick={() => onDelete(address.id)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600 flex items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
        <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
        <p>
          {address.address_line1}, {address.city}, {address.state} - {address.pincode}
        </p>
      </div>
    </div>
  );
};
