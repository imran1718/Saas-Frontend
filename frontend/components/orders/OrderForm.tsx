import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/apiClient';
import { validateOrder, OrderInput, OrderItemInput } from '../../lib/orderValidators';
import { OrderItemsEditor } from './OrderItemsEditor';
import { Alert } from '../ui/Alert';
import { Card, CardContent } from '../ui/Card';

interface Address {
  id: string;
  label: string;
  is_default: boolean;
}

interface OrderFormProps {
  initialValues?: Partial<OrderInput>;
  orderId?: string;
  onSubmitSuccess?: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({ initialValues, orderId, onSubmitSuccess }) => {
  const router = useRouter();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<Partial<OrderInput>>({
    order_reference: '',
    pickup_address_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    shipping_address_line1: '',
    shipping_address_line2: '',
    shipping_city: '',
    shipping_state: '',
    shipping_pincode: '',
    shipping_country: 'India',
    payment_mode: 'prepaid',
    cod_amount: 0,
    weight_kg: 0.5,
    length_cm: 10,
    width_cm: 10,
    height_cm: 10,
    items: [],
    ...initialValues,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    // Load active pickup addresses
    apiClient.get('/addresses?limit=100')
      .then(({ data }) => {
        const addrList = data.data.addresses || [];
        setAddresses(addrList);
        // Pre-select default address if creating new order
        if (!initialValues?.pickup_address_id && addrList.length > 0) {
          const def = addrList.find((a: Address) => a.is_default) || addrList[0];
          setForm(prev => ({ ...prev, pickup_address_id: def.id }));
        }
      })
      .catch(err => console.error('Failed to load pickup addresses', err));
  }, [initialValues]);

  const handleFieldChange = (field: keyof OrderInput, val: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: val };
      // Sync cod_amount with order value estimate if switching payment mode
      if (field === 'payment_mode' && val === 'cod' && prev.items) {
        const total = prev.items.reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0);
        next.cod_amount = total;
      }
      return next;
    });
    // Clear validation error when editing field
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleItemsChange = (items: OrderItemInput[]) => {
    setForm(prev => {
      const next = { ...prev, items };
      if (prev.payment_mode === 'cod') {
        const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0);
        next.cod_amount = total;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validation = validateOrder(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      if (orderId) {
        // Edit order
        await apiClient.put(`/orders/${orderId}`, form);
      } else {
        // Create new order
        await apiClient.post('/orders', form);
      }

      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else {
        router.push('/orders');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to save order';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <Alert type="error" message={serverError} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - order references & shipping addresses */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-2 mb-4">Basic Information</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Order Reference *</label>
                  <input
                    type="text"
                    value={form.order_reference}
                    onChange={(e) => handleFieldChange('order_reference', e.target.value)}
                    placeholder="e.g. ORD-10023"
                    className={`w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none ${errors.order_reference ? 'border-red-500 dark:border-red-500/50' : ''}`}
                  />
                  {errors.order_reference && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.order_reference}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pickup Address *</label>
                  <select
                    value={form.pickup_address_id}
                    onChange={(e) => handleFieldChange('pickup_address_id', e.target.value)}
                    className={`w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none ${errors.pickup_address_id ? 'border-red-500 dark:border-red-500/50' : ''}`}
                  >
                    <option value="">Select location</option>
                    {addresses.map(addr => (
                      <option key={addr.id} value={addr.id}>{addr.label}</option>
                    ))}
                  </select>
                  {errors.pickup_address_id && <p className="text-xs text-red-500 mt-1">{errors.pickup_address_id}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-2 mb-4">Customer & Shipping details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={form.customer_name}
                    onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                    placeholder="Receiver Name"
                    className={`w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none ${errors.customer_name ? 'border-red-500 dark:border-red-500/50' : ''}`}
                  />
                  {errors.customer_name && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.customer_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer Phone * (E.164)</label>
                  <input
                    type="text"
                    value={form.customer_phone}
                    onChange={(e) => handleFieldChange('customer_phone', e.target.value)}
                    placeholder="e.g. +919876543210"
                    className={`w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none ${errors.customer_phone ? 'border-red-500 dark:border-red-500/50' : ''}`}
                  />
                  {errors.customer_phone && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.customer_phone}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={form.customer_email}
                    onChange={(e) => handleFieldChange('customer_email', e.target.value)}
                    placeholder="email@example.com"
                    className={`w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none ${errors.customer_email ? 'border-red-500 dark:border-red-500/50' : ''}`}
                  />
                  {errors.customer_email && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.customer_email}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    value={form.shipping_address_line1}
                    onChange={(e) => handleFieldChange('shipping_address_line1', e.target.value)}
                    placeholder="Street Address, P.O. box, company"
                    className={`w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none ${errors.shipping_address_line1 ? 'border-red-500 dark:border-red-500/50' : ''}`}
                  />
                  {errors.shipping_address_line1 && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.shipping_address_line1}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={form.shipping_address_line2}
                    onChange={(e) => handleFieldChange('shipping_address_line2', e.target.value)}
                    placeholder="Apartment, suite, unit, building (optional)"
                    className="w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City *</label>
                  <input
                    type="text"
                    value={form.shipping_city}
                    onChange={(e) => handleFieldChange('shipping_city', e.target.value)}
                    className={`w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none ${errors.shipping_city ? 'border-red-500 dark:border-red-500/50' : ''}`}
                  />
                  {errors.shipping_city && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.shipping_city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">State *</label>
                  <input
                    type="text"
                    value={form.shipping_state}
                    onChange={(e) => handleFieldChange('shipping_state', e.target.value)}
                    className={`w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none ${errors.shipping_state ? 'border-red-500 dark:border-red-500/50' : ''}`}
                  />
                  {errors.shipping_state && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.shipping_state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={form.shipping_pincode}
                    onChange={(e) => handleFieldChange('shipping_pincode', e.target.value)}
                    placeholder="6-digit Indian Pin code"
                    className={`w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none ${errors.shipping_pincode ? 'border-red-500 dark:border-red-500/50' : ''}`}
                  />
                  {errors.shipping_pincode && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.shipping_pincode}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
                  <input
                    type="text"
                    value={form.shipping_country}
                    onChange={(e) => handleFieldChange('shipping_country', e.target.value)}
                    className="w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 p-2 border outline-none"
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <OrderItemsEditor
                items={form.items || []}
                onChange={handleItemsChange}
                errors={errors}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column - weight, dimensions, payment mode */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-2 mb-4">Package Dimensions & Weight</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.001"
                  value={form.weight_kg}
                  onChange={(e) => handleFieldChange('weight_kg', parseFloat(e.target.value) || 0)}
                  className={`w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none ${errors.weight_kg ? 'border-red-500 dark:border-red-500/50' : ''}`}
                />
                {errors.weight_kg && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.weight_kg}</p>}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Length (cm)</label>
                  <input
                    type="number"
                    value={form.length_cm}
                    onChange={(e) => handleFieldChange('length_cm', parseFloat(e.target.value) || 0)}
                    className={`w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none ${errors.length_cm ? 'border-red-500 dark:border-red-500/50' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Width (cm)</label>
                  <input
                    type="number"
                    value={form.width_cm}
                    onChange={(e) => handleFieldChange('width_cm', parseFloat(e.target.value) || 0)}
                    className={`w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none ${errors.width_cm ? 'border-red-500 dark:border-red-500/50' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={form.height_cm}
                    onChange={(e) => handleFieldChange('height_cm', parseFloat(e.target.value) || 0)}
                    className={`w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none ${errors.height_cm ? 'border-red-500 dark:border-red-500/50' : ''}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-2 mb-4">Payment Details</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Mode *</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center text-sm font-medium text-slate-750 dark:text-slate-350">
                    <input
                      type="radio"
                      name="payment_mode"
                      value="prepaid"
                      checked={form.payment_mode === 'prepaid'}
                      onChange={() => handleFieldChange('payment_mode', 'prepaid')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 mr-2 bg-white dark:bg-[#0f1117]"
                    />
                    Prepaid
                  </label>
                  <label className="flex items-center text-sm font-medium text-slate-750 dark:text-slate-350">
                    <input
                      type="radio"
                      name="payment_mode"
                      value="cod"
                      checked={form.payment_mode === 'cod'}
                      onChange={() => handleFieldChange('payment_mode', 'cod')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 mr-2 bg-white dark:bg-[#0f1117]"
                    />
                    COD (Cash on Delivery)
                  </label>
                </div>
              </div>

              {form.payment_mode === 'cod' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">COD Collectible Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.cod_amount}
                    onChange={(e) => handleFieldChange('cod_amount', parseFloat(e.target.value) || 0)}
                    className={`w-full text-sm rounded-lg border-slate-300 dark:border-white/[0.08] bg-white dark:bg-[#0f1117] text-slate-900 dark:text-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border outline-none ${errors.cod_amount ? 'border-red-500 dark:border-red-500/50' : ''}`}
                  />
                  {errors.cod_amount && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.cod_amount}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button card */}
          <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition shadow-sm hover:shadow-md disabled:bg-indigo-300 cursor-pointer outline-none"
            >
              {loading ? 'Saving...' : orderId ? 'Update Order' : 'Create Order'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/orders')}
              className="flex-1 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02] border border-slate-300 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 font-medium py-2.5 rounded-lg text-sm transition cursor-pointer text-center outline-none"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
