'use strict';

const { InvoiceSequence, sequelize } = require('../models');
const logger = require('../utils/logger');

/**
 * Calculates current Financial Year based on April-March convention.
 * e.g., April 2026 -> '2026-27', March 2026 -> '2025-26'.
 */
function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = Jan, 3 = April)

  if (month >= 3) {
    // April - Dec
    const nextYearShort = (year + 1).toString().substring(2, 4);
    return `${year}-${nextYearShort}`;
  } else {
    // Jan - March
    const prevYear = year - 1;
    const yearShort = year.toString().substring(2, 4);
    return `${prevYear}-${yearShort}`;
  }
}

/**
 * Sequential sequential number generation with row-level locks.
 * @param {'invoice' | 'credit_note'} seriesKey
 * @param {object} transaction
 */
async function generateNextNumber(seriesKey, transaction) {
  if (!transaction) {
    throw new Error('A database transaction is required to lock invoice numbering');
  }

  const fy = getFinancialYear();
  const prefix = seriesKey === 'invoice' ? 'INV' : 'CN';

  // 1. Lock the sequence counter row using FOR UPDATE
  let seq = await InvoiceSequence.findOne({
    where: { financial_year: fy, series_key: seriesKey },
    lock: transaction.LOCK.UPDATE,
    transaction,
  });

  if (!seq) {
    // Attempt insert/create if not exists
    seq = await InvoiceSequence.create({
      financial_year: fy,
      series_key: seriesKey,
      last_number: 0,
    }, { transaction });
  }

  const nextVal = seq.last_number + 1;

  // 2. Increment counter
  await seq.update({ last_number: nextVal }, { transaction });

  // 3. Format sequential string padded to 6 digits (e.g. INV/2026-27/000123)
  const padded = nextVal.toString().padStart(6, '0');
  const number = `${prefix}/${fy}/${padded}`;

  logger.info(`[InvoiceNumbering] Allocated sequence sequence ${number} (last_number: ${nextVal})`);
  return number;
}

module.exports = {
  getFinancialYear,
  generateNextNumber,
};
