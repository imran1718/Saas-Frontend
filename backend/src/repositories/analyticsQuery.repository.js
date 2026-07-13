'use strict';

const { sequelize, AnalyticsDailySnapshot } = require('../models');
const { Op } = require('sequelize');

const SENTINEL_PLATFORM_UUID = '00000000-0000-0000-0000-000000000000';

/**
 * Normalizes an array of records grouped by date into a single merged map/array.
 */
function mergeSeries(seriesArray) {
  const merged = {};
  seriesArray.forEach(({ name, data }) => {
    data.forEach((row) => {
      const d = row.date;
      if (!merged[d]) {
        merged[d] = {
          date: d,
          orders_count: 0,
          shipments_count: 0,
          delivered_count: 0,
          ndr_count: 0,
          rto_count: 0,
          cod_amount: 0.0,
          prepaid_amount: 0.0,
          shipping_spend: 0.0,
          revenue_amount: null,
        };
      }
      Object.keys(row).forEach((key) => {
        if (key !== 'date') {
          merged[d][key] = row[key];
        }
      });
    });
  });
  return Object.values(merged).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Query live tenant metrics for a date range (inclusive, YYYY-MM-DD format).
 */
async function queryTenantLiveMetrics(tenantId, dateFrom, dateTo) {
  const isPlatform = tenantId === SENTINEL_PLATFORM_UUID;
  const tenantFilter = isPlatform ? '' : 'AND tenant_id = :tenantId';
  const binds = { dateFrom: `${dateFrom} 00:00:00.000`, dateTo: `${dateTo} 23:59:59.999` };
  if (!isPlatform) binds.tenantId = tenantId;

  // 1. Orders
  const ordersQuery = `
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM-DD') as date,
      COUNT(id)::int as orders_count,
      SUM(CASE WHEN payment_mode = 'cod' THEN COALESCE(cod_amount, 0) ELSE 0 END)::float as cod_amount,
      SUM(CASE WHEN payment_mode = 'prepaid' THEN COALESCE(order_value, 0) ELSE 0 END)::float as prepaid_amount
    FROM orders
    WHERE created_at BETWEEN :dateFrom AND :dateTo
      ${tenantFilter}
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
  `;

  // 2. Shipments
  const shipmentsQuery = `
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM-DD') as date,
      COUNT(id)::int as shipments_count,
      SUM(COALESCE(selected_rate, 0))::float as shipping_spend
    FROM shipments
    WHERE created_at BETWEEN :dateFrom AND :dateTo
      ${tenantFilter}
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
  `;

  // 3. Delivered Count
  const deliveredQuery = `
    SELECT 
      TO_CHAR(h.created_at, 'YYYY-MM-DD') as date,
      COUNT(DISTINCT s.id)::int as delivered_count
    FROM shipments s
    JOIN shipment_status_histories h ON s.id = h.shipment_id
    WHERE h.new_status = 'delivered'
      AND h.created_at BETWEEN :dateFrom AND :dateTo
      ${isPlatform ? '' : 'AND s.tenant_id = :tenantId'}
    GROUP BY TO_CHAR(h.created_at, 'YYYY-MM-DD')
  `;

  // 4. NDR Count
  const ndrQuery = `
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM-DD') as date,
      COUNT(id)::int as ndr_count
    FROM ndr_events
    WHERE created_at BETWEEN :dateFrom AND :dateTo
      ${tenantFilter}
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
  `;

  // 5. RTO Count
  const rtoQuery = `
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM-DD') as date,
      COUNT(id)::int as rto_count
    FROM rto_records
    WHERE created_at BETWEEN :dateFrom AND :dateTo
      ${tenantFilter}
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
  `;

  let revenueQuery = null;
  if (isPlatform) {
    revenueQuery = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        SUM(COALESCE(total_amount, 0))::float as revenue_amount
      FROM invoices
      WHERE created_at BETWEEN :dateFrom AND :dateTo
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    `;
  }

  const [orders, shipments, delivered, ndr, rto, revenue] = await Promise.all([
    sequelize.query(ordersQuery, { replacements: binds, type: sequelize.QueryTypes.SELECT }),
    sequelize.query(shipmentsQuery, { replacements: binds, type: sequelize.QueryTypes.SELECT }),
    sequelize.query(deliveredQuery, { replacements: binds, type: sequelize.QueryTypes.SELECT }),
    sequelize.query(ndrQuery, { replacements: binds, type: sequelize.QueryTypes.SELECT }),
    sequelize.query(rtoQuery, { replacements: binds, type: sequelize.QueryTypes.SELECT }),
    revenueQuery ? sequelize.query(revenueQuery, { replacements: binds, type: sequelize.QueryTypes.SELECT }) : Promise.resolve([]),
  ]);

  return mergeSeries([
    { name: 'orders', data: orders },
    { name: 'shipments', data: shipments },
    { name: 'delivered', data: delivered },
    { name: 'ndr', data: ndr },
    { name: 'rto', data: rto },
    { name: 'revenue', data: revenue },
  ]);
}

/**
 * Query snapshot metrics from analytics_daily_snapshots table.
 */
async function querySnapshotMetrics(tenantId, dateFrom, dateTo) {
  const rows = await AnalyticsDailySnapshot.findAll({
    where: {
      tenant_id: tenantId,
      snapshot_date: {
        [Op.between]: [dateFrom, dateTo],
      },
    },
    order: [['snapshot_date', 'ASC']],
  });

  return rows.map((r) => ({
    date: r.snapshot_date,
    orders_count: r.orders_count,
    shipments_count: r.shipments_count,
    delivered_count: r.delivered_count,
    ndr_count: r.ndr_count,
    rto_count: r.rto_count,
    cod_amount: r.cod_amount,
    prepaid_amount: r.prepaid_amount,
    shipping_spend: r.shipping_spend,
    revenue_amount: r.revenue_amount,
  }));
}

/**
 * Public Hybrid Query: Automatically routes and merges historical snapshots & live recency.
 */
async function getMetrics(tenantId, dateFrom, dateTo) {
  const todayStr = new Date().toISOString().substring(0, 10);

  if (dateTo < todayStr) {
    // 1. Strictly historical
    return querySnapshotMetrics(tenantId, dateFrom, dateTo);
  }

  if (dateFrom >= todayStr) {
    // 2. Strictly live
    return queryTenantLiveMetrics(tenantId, dateFrom, dateTo);
  }

  // 3. Spans both -> split and merge
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().substring(0, 10);

  const [historical, live] = await Promise.all([
    querySnapshotMetrics(tenantId, dateFrom, yesterdayStr),
    queryTenantLiveMetrics(tenantId, todayStr, dateTo),
  ]);

  return [...historical, ...live];
}

/**
 * Fetch Courier Performance aggregate breakdown.
 */
async function getCourierPerformance(tenantId, dateFrom, dateTo) {
  const isPlatform = tenantId === SENTINEL_PLATFORM_UUID;
  const tenantFilter = isPlatform ? '' : 'AND s.tenant_id = :tenantId';
  const binds = { dateFrom: `${dateFrom} 00:00:00.000`, dateTo: `${dateTo} 23:59:59.999` };
  if (!isPlatform) binds.tenantId = tenantId;

  // We fetch counts of shipments, delivered, NDRs, RTOs per courier, plus avg transit time
  const courierStatsQuery = `
    SELECT 
      cp.id as courier_provider_id,
      cp.display_name as courier_name,
      cp.provider_key,
      COUNT(s.id)::int as shipments_count,
      COUNT(CASE WHEN s.status = 'delivered' THEN 1 END)::int as delivered_count,
      COUNT(DISTINCT n.id)::int as ndr_count,
      COUNT(DISTINCT r.id)::int as rto_count,
      AVG(EXTRACT(EPOCH FROM (h_delivered.created_at - h_picked_up.created_at)))::float as avg_delivery_time_seconds
    FROM shipments s
    JOIN courier_providers cp ON s.courier_provider_id = cp.id
    LEFT JOIN ndr_events n ON s.id = n.shipment_id AND n.created_at BETWEEN :dateFrom AND :dateTo
    LEFT JOIN rto_records r ON s.id = r.shipment_id AND r.created_at BETWEEN :dateFrom AND :dateTo
    LEFT JOIN shipment_status_histories h_picked_up ON s.id = h_picked_up.shipment_id AND h_picked_up.new_status = 'picked_up'
    LEFT JOIN shipment_status_histories h_delivered ON s.id = h_delivered.shipment_id AND h_delivered.new_status = 'delivered'
    WHERE s.created_at BETWEEN :dateFrom AND :dateTo
      ${tenantFilter}
    GROUP BY cp.id, cp.display_name, cp.provider_key
  `;

  const results = await sequelize.query(courierStatsQuery, {
    replacements: binds,
    type: sequelize.QueryTypes.SELECT,
  });

  return results.map((row) => {
    const delivered = row.delivered_count || 0;
    const rto = row.rto_count || 0;
    const shipments = row.shipments_count || 0;
    
    // delivery_success_rate = delivered_count / (delivered_count + rto_count)
    const successRateDenom = delivered + rto;
    const successRate = successRateDenom > 0 ? (delivered / successRateDenom) * 100 : 0.0;
    
    // NDR rate = ndr_count / shipments_count
    const ndrRate = shipments > 0 ? ((row.ndr_count || 0) / shipments) * 100 : 0.0;

    return {
      courier_id: row.courier_provider_id,
      courier_name: row.courier_name,
      provider_key: row.provider_key,
      shipments_count: shipments,
      delivered_count: delivered,
      ndr_count: row.ndr_count || 0,
      rto_count: rto,
      delivery_success_rate: parseFloat(successRate.toFixed(2)),
      ndr_rate: parseFloat(ndrRate.toFixed(2)),
      avg_delivery_time_hours: row.avg_delivery_time_seconds 
        ? parseFloat((row.avg_delivery_time_seconds / 3600).toFixed(2)) 
        : null,
    };
  });
}

/**
 * Fetch Zone/Region Distribution of shipments.
 */
async function getZoneDistribution(tenantId, dateFrom, dateTo) {
  const isPlatform = tenantId === SENTINEL_PLATFORM_UUID;
  const tenantFilter = isPlatform ? '' : 'AND s.tenant_id = :tenantId';
  const binds = { dateFrom: `${dateFrom} 00:00:00.000`, dateTo: `${dateTo} 23:59:59.999` };
  if (!isPlatform) binds.tenantId = tenantId;

  const zoneQuery = `
    SELECT 
      COALESCE(o.shipping_state, 'Unknown') as state,
      COALESCE(o.shipping_city, 'Unknown') as city,
      COUNT(s.id)::int as shipments_count
    FROM shipments s
    JOIN orders o ON s.order_id = o.id
    WHERE s.created_at BETWEEN :dateFrom AND :dateTo
      ${tenantFilter}
    GROUP BY o.shipping_state, o.shipping_city
    ORDER BY shipments_count DESC
  `;

  return sequelize.query(zoneQuery, {
    replacements: binds,
    type: sequelize.QueryTypes.SELECT,
  });
}

/**
 * Fetch Wallet spends/debits over a date range.
 */
async function getWalletSpendTrend(tenantId, dateFrom, dateTo) {
  const binds = { 
    tenantId, 
    dateFrom: `${dateFrom} 00:00:00.000`, 
    dateTo: `${dateTo} 23:59:59.999` 
  };

  const spendQuery = `
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM-DD') as date,
      SUM(amount)::float as amount
    FROM wallet_transactions
    WHERE tenant_id = :tenantId
      AND type = 'debit'
      AND reference_type IN ('shipment_debit', 'manual_debit', 'adjustment')
      AND created_at BETWEEN :dateFrom AND :dateTo
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    ORDER BY date ASC
  `;

  return sequelize.query(spendQuery, {
    replacements: binds,
    type: sequelize.QueryTypes.SELECT,
  });
}

/**
 * Fetch Top Tenants ranked by volume (shipment count) or revenue (invoice total amount).
 */
async function getTopTenants({ sort_by, limit }) {
  const binds = { limit };
  const sortCol = sort_by === 'revenue' ? 'total_spend' : 'shipments_count';

  const topTenantsQuery = `
    SELECT 
      t.id as tenant_id,
      t.company_name,
      COUNT(DISTINCT s.id)::int as shipments_count,
      COALESCE(SUM(DISTINCT i.total_amount), 0)::float as total_spend
    FROM tenants t
    LEFT JOIN shipments s ON t.id = s.tenant_id
    LEFT JOIN invoices i ON t.id = i.tenant_id
    GROUP BY t.id, t.company_name
    ORDER BY ${sortCol} DESC
    LIMIT :limit
  `;

  return sequelize.query(topTenantsQuery, {
    replacements: binds,
    type: sequelize.QueryTypes.SELECT,
  });
}

module.exports = {
  SENTINEL_PLATFORM_UUID,
  getMetrics,
  getCourierPerformance,
  getZoneDistribution,
  getWalletSpendTrend,
  getTopTenants,
};
