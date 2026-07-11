'use strict';

const { Invoice, InvoiceLineItem, Tenant, Shipment, sequelize } = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const taxCalculationService = require('./taxCalculation.service');
const invoiceNumberingService = require('./invoiceNumbering.service');
const invoicePdfService = require('./invoicePdf.service');
const fileUploadService = require('./fileUpload.service');
const emailService = require('./email.service');
const auditService = require('./audit.service');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Auto-generate invoice for a successful shipment creation.
 * Scoped inside the parent transaction or its own.
 */
async function createShipmentInvoice(shipmentId, parentTransaction = null) {
  const ownTxn = !parentTransaction;
  const t = parentTransaction || (await sequelize.transaction());

  let invoice;
  let tenant;

  try {
    // 1. Fetch shipment with order and tenant
    const shipment = await Shipment.findByPk(shipmentId, {
      include: ['order', 'tenant'],
      transaction: t,
    });

    if (!shipment) {
      throw new NotFoundError('Shipment not found for invoicing');
    }

    tenant = shipment.tenant;

    // Idempotency check: see if invoice already exists
    const existing = await Invoice.findOne({
      where: { reference_type: 'shipment', reference_id: shipmentId },
      transaction: t,
    });

    if (existing) {
      if (ownTxn) await t.commit();
      return existing;
    }

    // 2. Fetch company profile / state for place of supply
    const placeOfSupply = tenant.company_state || 'Tamil Nadu'; // Default fallback

    // 3. Tax calculation
    const subtotal = parseFloat(shipment.selected_rate);
    const taxCalc = taxCalculationService.calculateTax(
      subtotal,
      configGstin(),
      placeOfSupply
    );

    // 4. Generate sequential sequential invoice number
    const invoiceNumber = await invoiceNumberingService.generateNextNumber('invoice', t);

    // 5. Create Invoice row
    invoice = await Invoice.create({
      tenant_id: tenant.id,
      invoice_number: invoiceNumber,
      invoice_type: 'shipment',
      reference_type: 'shipment',
      reference_id: shipmentId,
      subtotal,
      cgst_amount: taxCalc.cgst_amount,
      sgst_amount: taxCalc.sgst_amount,
      igst_amount: taxCalc.igst_amount,
      total_amount: taxCalc.total_amount,
      status: 'paid', // Prepaid model: billing already occurred
      billing_entity_gstin: configGstin(),
      place_of_supply: placeOfSupply,
    }, { transaction: t });

    // 6. Create line item
    await InvoiceLineItem.create({
      invoice_id: invoice.id,
      description: `Shipping charges - AWB ${shipment.awb_number || 'Pending'}`,
      hsn_sac_code: '996812',
      quantity: 1,
      unit_price: subtotal,
      amount: subtotal,
    }, { transaction: t });

    // 7. Audit Log
    await auditService.log({
      tenant_id: tenant.id,
      action: 'invoice_generated',
      entity_type: 'Invoice',
      entity_id: invoice.id,
      metadata: { invoice_number: invoiceNumber, total_amount: taxCalc.total_amount },
    });

    if (ownTxn) await t.commit();
  } catch (err) {
    if (ownTxn) await t.rollback();
    logger.error(`[InvoiceService] Failed to generate database invoice for shipment ${shipmentId}: ${err.message}`);
    // Non-blocking: throw custom log rather than blocking parent shipment creation
    return null;
  }

  // 8. Generate and upload PDF in background (Never blocks main shipping transaction!)
  if (invoice) {
    generateAndDeliverPdf(invoice.id, tenant).catch((pdfErr) => {
      logger.error(`[InvoiceService] Background PDF creation or email failed: ${pdfErr.message}`);
    });
  }

  return invoice;
}

/**
 * Background PDF creation and email notifier.
 */
async function generateAndDeliverPdf(invoiceId, tenant) {
  // Reload invoice with line items
  const invoice = await Invoice.findByPk(invoiceId, {
    include: [{ model: InvoiceLineItem, as: 'lineItems' }],
  });

  if (!invoice) return;

  // Render PDF
  invoice.tenant = tenant; // Attach tenant details
  const pdfUrl = await invoicePdfService.generateInvoicePdf(invoice);
  await invoice.update({ pdf_url: pdfUrl });

  // Get recipient email (first user or owner)
  const { User } = require('../models');
  const owner = await User.findOne({
    where: { tenant_id: tenant.id },
    order: [['created_at', 'ASC']],
  });

  if (owner) {
    await emailService.sendEmail({
      to: owner.email,
      subject: `Invoice generated for your shipment - ${invoice.invoice_number}`,
      templateName: 'invoice-generated',
      data: {
        name: owner.name,
        invoiceNumber: invoice.invoice_number,
        totalAmount: invoice.total_amount.toFixed(2),
        pdfUrl: pdfUrl,
      },
    });
  }
}

/**
 * Get Platform Billed GSTIN from environment variables.
 */
function configGstin() {
  const config = require('../config/env');
  return config.billing.entityGstin;
}

/**
 * Get dashboard spend summaries.
 */
async function getBillingSummary(tenantId) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thisMonthSpend = await Invoice.sum('total_amount', {
    where: {
      tenant_id: tenantId,
      created_at: { [Op.gte]: startOfMonth },
    },
  }) || 0;

  const pendingInvoices = await Invoice.sum('total_amount', {
    where: {
      tenant_id: tenantId,
      status: 'generated',
    },
  }) || 0;

  return {
    this_month_spend: parseFloat(thisMonthSpend),
    pending_invoices: parseFloat(pendingInvoices),
  };
}

/**
 * Bulk exports and merges invoice PDFs into a single printable file.
 */
async function bulkExportInvoices(tenantId, invoiceIds) {
  if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
    throw new BadRequestError('Invalid or empty invoice IDs array');
  }

  if (invoiceIds.length > 200) {
    throw new BadRequestError('Bulk export limit exceeded. Maximum 200 invoices allowed.');
  }

  const invoices = await Invoice.findAll({
    where: {
      id: { [Op.in]: invoiceIds },
      tenant_id: tenantId,
    },
  });

  const axios = require('axios');
  const mergedPdf = await PDFDocument.create();

  let mergedCount = 0;

  for (const inv of invoices) {
    if (!inv.pdf_url) continue;

    try {
      let pdfBuffer;
      if (inv.pdf_url.startsWith('http')) {
        const res = await axios.get(inv.pdf_url, { responseType: 'arraybuffer' });
        pdfBuffer = Buffer.from(res.data);
      } else {
        // Local file system fallback
        const fs = require('fs/promises');
        const path = require('path');
        const config = require('../config/env');
        const relPath = inv.pdf_url.replace(`/${config.storage.uploadDir}/`, '');
        const targetPath = path.join(__dirname, '..', '..', config.storage.uploadDir, relPath);
        pdfBuffer = await fs.readFile(targetPath);
      }

      const doc = await PDFDocument.load(pdfBuffer);
      const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      mergedCount++;
    } catch (err) {
      logger.error(`[InvoiceService] Failed to merge PDF for invoice ${inv.id}: ${err.message}`);
    }
  }

  if (mergedCount === 0) {
    throw new BadRequestError('No valid invoice PDFs were found to export');
  }

  const mergedBytes = await mergedPdf.save();
  const mergedBuffer = Buffer.from(mergedBytes);

  const mergedUrl = await fileUploadService.uploadFile(
    mergedBuffer,
    'billing/exports',
    `invoices-bulk-${Date.now()}.pdf`,
    'application/pdf'
  );

  return {
    merged_pdf_url: mergedUrl,
    count: mergedCount,
  };
}

module.exports = {
  createShipmentInvoice,
  generateAndDeliverPdf,
  getBillingSummary,
  bulkExportInvoices,
};
