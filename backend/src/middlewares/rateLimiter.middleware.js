const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { getRedisClient } = require('../config/redis.config');

const createLimiter = (options) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => getRedisClient().call(...args),
    }),
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });
};

const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
  message: { success: false, data: null, error: { code: 'RATE_LIMIT', message: 'Too many login attempts, please try again later.' } },
  keyGenerator: (req) => `${req.ip}_${req.body.email || ''}`,
});

const forgotPasswordLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  message: { success: false, data: null, error: { code: 'RATE_LIMIT', message: 'Too many password reset requests, please try again later.' } },
  keyGenerator: (req) => `${req.ip}_${req.body.email || ''}`,
});

const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { success: false, data: null, error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later.' } },
});

module.exports = {
  loginLimiter,
  forgotPasswordLimiter,
  globalLimiter,
};
