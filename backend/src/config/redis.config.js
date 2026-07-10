const Redis = require('ioredis');
const config = require('./env');
const logger = require('../utils/logger');

let redisClient = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redisClient.on('connect', () => logger.info('[Redis] Connected'));
  redisClient.on('error', (err) => logger.error('[Redis] Connection error:', { error: err.message }));
  redisClient.on('reconnecting', () => logger.warn('[Redis] Reconnecting...'));

  return redisClient;
}

module.exports = { getRedisClient };
