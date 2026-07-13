'use strict';

const crypto = require('crypto');

/**
 * Generates an HMAC-SHA256 signature for a webhook payload.
 * @param {Object|String} payload - The JSON payload to sign
 * @param {String} secret - The webhook secret
 * @returns {String} The signature in the format 'sha256=...'
 */
function generateSignature(payload, secret) {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadString);
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Verifies an HMAC-SHA256 signature.
 * @param {String} signature - The signature to verify
 * @param {Object|String} payload - The payload
 * @param {String} secret - The webhook secret
 * @returns {Boolean}
 */
function verifySignature(signature, payload, secret) {
  const expectedSignature = generateSignature(payload, secret);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    return false;
  }
}

module.exports = {
  generateSignature,
  verifySignature,
};
