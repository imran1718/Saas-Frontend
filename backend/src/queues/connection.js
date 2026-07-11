'use strict';

const config = require('../config/env');

/**
 * Shared BullMQ connection config.
 * Uses the same Redis instance as ioredis (rate limiting, etc.)
 * BullMQ requires maxRetriesPerRequest: null for blocking commands.
 */
const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

module.exports = { connection };
