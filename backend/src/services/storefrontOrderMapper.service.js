/**
 * storefrontOrderMapper.service.js
 * Maps Shopify / WooCommerce order payloads into Nanoshipy's order creation schema.
 */

/**
 * Map a Shopify order to Nanoshipy order schema.
 */
const fromShopify = (shopifyOrder) => {
  const addr = shopifyOrder.shipping_address || shopifyOrder.billing_address || {};
  const isPaid = shopifyOrder.financial_status === 'paid';
  const weightKg = shopifyOrder.total_weight ? shopifyOrder.total_weight / 1000 : 0.5;

  return {
    order_id: `SHP-${shopifyOrder.id}`,
    order_date: shopifyOrder.created_at,
    payment_type: isPaid ? 'P' : 'C',
    order_weight: Math.max(weightKg, 0.1),
    // Consignee
    consignee_name: addr.name || `${addr.first_name || ''} ${addr.last_name || ''}`.trim() || 'Customer',
    consignee_address: [addr.address1, addr.address2].filter(Boolean).join(', '),
    consignee_city: addr.city || '',
    consignee_pincode: addr.zip || '',
    consignee_state: addr.province || '',
    consignee_country: addr.country_code || 'IN',
    consignee_phone: addr.phone || '',
    // Products
    products: (shopifyOrder.line_items || []).map(item => ({
      name: item.title,
      price: parseFloat(item.price) || 0,
      product_code: item.sku || item.product_id?.toString(),
      qty: item.quantity || 1,
    })),
    // Source reference
    _store_order_id: shopifyOrder.id?.toString(),
    _store_order_number: shopifyOrder.name,
    _platform: 'shopify',
  };
};

/**
 * Map a WooCommerce order to Nanoshipy order schema.
 */
const fromWooCommerce = (wooOrder) => {
  const addr = wooOrder.shipping || wooOrder.billing || {};
  const isCod = wooOrder.payment_method === 'cod';
  const weightKg = wooOrder.meta_data?.find(m => m.key === '_weight')?.value || 0.5;

  return {
    order_id: `WOO-${wooOrder.id}`,
    order_date: wooOrder.date_created,
    payment_type: isCod ? 'C' : 'P',
    order_weight: Math.max(parseFloat(weightKg), 0.1),
    // Consignee
    consignee_name: `${addr.first_name || ''} ${addr.last_name || ''}`.trim() || 'Customer',
    consignee_address: [addr.address_1, addr.address_2].filter(Boolean).join(', '),
    consignee_city: addr.city || '',
    consignee_pincode: addr.postcode || '',
    consignee_state: addr.state || '',
    consignee_country: addr.country || 'IN',
    consignee_phone: addr.phone || wooOrder.billing?.phone || '',
    // Products
    products: (wooOrder.line_items || []).map(item => ({
      name: item.name,
      price: parseFloat(item.price) || 0,
      product_code: item.sku || item.product_id?.toString(),
      qty: item.quantity || 1,
    })),
    // Source reference
    _store_order_id: wooOrder.id?.toString(),
    _store_order_number: wooOrder.number?.toString(),
    _platform: 'woocommerce',
  };
};

/**
 * Generic dispatcher.
 */
const mapOrder = (platform, storeOrder) => {
  if (platform === 'shopify') return fromShopify(storeOrder);
  if (platform === 'woocommerce') return fromWooCommerce(storeOrder);
  throw new Error(`Unsupported platform for order mapping: ${platform}`);
};

module.exports = { mapOrder, fromShopify, fromWooCommerce };
