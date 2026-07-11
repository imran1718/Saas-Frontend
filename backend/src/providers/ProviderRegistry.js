'use strict';

const MockProviderAdapter = require('./mock/MockProviderAdapter');
const ShipwayAdapter = require('./shipway/ShipwayAdapter');
const DelhiveryAdapter = require('./delhivery/DelhiveryAdapter');

/**
 * ProviderRegistry
 *
 * Central source of truth mapping provider keys to their adapter classes.
 */
const registry = {
  mock: MockProviderAdapter,
  shipway: ShipwayAdapter,
  delhivery: DelhiveryAdapter,
};

module.exports = registry;
