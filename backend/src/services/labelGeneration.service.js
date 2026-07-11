'use strict';

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const bwipjs = require('bwip-js');
const axios = require('axios');
const { Shipment, Order, CourierProvider, PickupAddress } = require('../models');
const ProviderFactory = require('../providers/ProviderFactory');
const providerCredentialService = require('./providerCredential.service');
const fileUploadService = require('./fileUpload.service');
const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

class LabelGenerationService {
  /**
   * Generates a barcode PNG buffer for a given AWB.
   *
   * @param {string} text - AWB number
   * @returns {Promise<Buffer>} Barcode image buffer
   */
  async generateBarcode(text) {
    return new Promise((resolve, reject) => {
      bwipjs.toBuffer({
        bcid: 'code128',
        text: text,
        scale: 3,
        height: 12,
        includetext: true,
        textalign: 'center',
      }, (err, png) => {
        if (err) {
          logger.error(`Failed to generate barcode for AWB ${text}: ${err.message}`);
          reject(err);
        } else {
          resolve(png);
        }
      });
    });
  }

  /**
   * Generates a custom PDF shipping label.
   *
   * @param {object} shipment
   * @param {object} order
   * @param {object} provider
   * @param {object} pickupAddress
   * @param {string} [format='4x6'] - '4x6' or 'a4'
   * @returns {Promise<Buffer>} PDF Buffer
   */
  async renderCustomLabelPDF(shipment, order, provider, pickupAddress, format = '4x6') {
    const pdfDoc = await PDFDocument.create();
    
    // Sizing in points (1 inch = 72 points)
    const isA4 = format.toLowerCase() === 'a4';
    const width = isA4 ? 595.27 : 288; // 4 inches = 288 points
    const height = isA4 ? 841.89 : 432; // 6 inches = 432 points
    
    const page = pdfDoc.addPage([width, height]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Render Barcode
    let barcodeImage;
    if (shipment.awb_number) {
      try {
        const barcodeBuffer = await this.generateBarcode(shipment.awb_number);
        barcodeImage = await pdfDoc.embedPng(barcodeBuffer);
      } catch (err) {
        logger.warn(`Could not embed barcode on label: ${err.message}`);
      }
    }

    if (isA4) {
      // Draw A4 formatted label
      page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: rgb(0, 0, 0),
        borderWidth: 2,
      });

      // Header
      page.drawText('SHIPPING PORTAL LABEL (A4)', { x: 40, y: height - 60, size: 20, font: fontBold });
      page.drawText(`Provider: ${provider.display_name.toUpperCase()} ${provider.sandbox_mode ? '(SANDBOX)' : '(LIVE)'}`, { x: 40, y: height - 85, size: 12, font });
      page.drawText(`Service Type: ${shipment.service_type.toUpperCase()}`, { x: 40, y: height - 105, size: 12, font });

      // Horizontal line
      page.drawLine({ start: { x: 20, y: height - 120 }, end: { x: width - 20, y: height - 120 }, thickness: 1, color: rgb(0, 0, 0) });

      // Barcode
      if (barcodeImage) {
        const dims = barcodeImage.scale(0.85);
        page.drawImage(barcodeImage, {
          x: (width - dims.width) / 2,
          y: height - 230,
          width: dims.width,
          height: dims.height,
        });
      } else {
        page.drawText(`AWB: ${shipment.awb_number || 'PENDING'}`, { x: 40, y: height - 150, size: 16, font: fontBold });
      }

      page.drawLine({ start: { x: 20, y: height - 250 }, end: { x: width - 20, y: height - 250 }, thickness: 1, color: rgb(0, 0, 0) });

      // Ship To
      page.drawText('DELIVER TO / SHIP TO:', { x: 40, y: height - 280, size: 14, font: fontBold });
      page.drawText(`Name: ${order.customer_name || 'N/A'}`, { x: 40, y: height - 305, size: 12, font });
      page.drawText(`Phone: ${order.customer_phone || 'N/A'}`, { x: 40, y: height - 325, size: 12, font });
      page.drawText(`Address: ${order.delivery_address || 'N/A'}`, { x: 40, y: height - 345, size: 12, font });
      page.drawText(`Pincode: ${order.shipping_pincode || 'N/A'}`, { x: 40, y: height - 385, size: 12, font: fontBold });

      page.drawLine({ start: { x: 20, y: height - 420 }, end: { x: width - 20, y: height - 420 }, thickness: 1, color: rgb(0, 0, 0) });

      // Ship From
      page.drawText('RETURN ADDRESS / SHIP FROM:', { x: 40, y: height - 450, size: 14, font: fontBold });
      page.drawText(`Sender: ${pickupAddress.contact_name || 'Warehouse'}`, { x: 40, y: height - 475, size: 12, font });
      page.drawText(`Phone: ${pickupAddress.phone || 'N/A'}`, { x: 40, y: height - 495, size: 12, font });
      page.drawText(`Address: ${pickupAddress.address_line1}, ${pickupAddress.city}, ${pickupAddress.state}`, { x: 40, y: height - 515, size: 12, font });
      page.drawText(`Pincode: ${pickupAddress.pincode}`, { x: 40, y: height - 535, size: 12, font: fontBold });

      page.drawLine({ start: { x: 20, y: height - 570 }, end: { x: width - 20, y: height - 570 }, thickness: 1, color: rgb(0, 0, 0) });

      // Package Details
      page.drawText(`Order Reference: ${order.order_reference}`, { x: 40, y: height - 600, size: 12, font: fontBold });
      page.drawText(`Weight: ${shipment.declared_weight_kg} kg`, { x: 40, y: height - 620, size: 12, font });
      page.drawText(`Payment Mode: ${order.payment_mode.toUpperCase()}`, { x: 40, y: height - 640, size: 12, font });
      if (order.payment_mode.toLowerCase() === 'cod') {
        page.drawText(`COD Collectable: INR ${order.cod_amount}`, { x: 40, y: height - 660, size: 14, font: fontBold, color: rgb(0.8, 0, 0) });
      }

    } else {
      // Draw 4x6 formatted label
      page.drawRectangle({
        x: 10,
        y: 10,
        width: width - 20,
        height: height - 20,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5,
      });

      // Header
      page.drawText('SHIPPING LABEL', { x: 20, y: height - 30, size: 14, font: fontBold });
      page.drawText(`${provider.display_name.toUpperCase()} ${provider.sandbox_mode ? '(SANDBOX)' : '(LIVE)'}`, { x: 20, y: height - 48, size: 9, font });
      page.drawText(`Service: ${shipment.service_type.toUpperCase()}`, { x: 20, y: height - 62, size: 9, font });

      page.drawLine({ start: { x: 10, y: height - 70 }, end: { x: width - 10, y: height - 70 }, thickness: 1, color: rgb(0, 0, 0) });

      // Barcode
      if (barcodeImage) {
        const dims = barcodeImage.scale(0.55);
        page.drawImage(barcodeImage, {
          x: (width - dims.width) / 2,
          y: height - 150,
          width: dims.width,
          height: dims.height,
        });
      } else {
        page.drawText(`AWB: ${shipment.awb_number || 'PENDING'}`, { x: 20, y: height - 110, size: 12, font: fontBold });
      }

      page.drawLine({ start: { x: 10, y: height - 165 }, end: { x: width - 10, y: height - 165 }, thickness: 1, color: rgb(0, 0, 0) });

      // Ship To
      page.drawText('SHIP TO:', { x: 20, y: height - 185, size: 11, font: fontBold });
      page.drawText(`Name: ${order.customer_name || 'N/A'}`, { x: 20, y: height - 202, size: 9, font });
      page.drawText(`Phone: ${order.customer_phone || 'N/A'}`, { x: 20, y: height - 217, size: 9, font });
      
      const addr = order.delivery_address || '';
      const lines = addr.match(/.{1,45}/g) || [];
      let yOffset = height - 232;
      lines.slice(0, 2).forEach((line) => {
        page.drawText(line, { x: 20, y: yOffset, size: 8, font });
        yOffset -= 12;
      });
      
      page.drawText(`Pincode: ${order.shipping_pincode || 'N/A'}`, { x: 20, y: yOffset, size: 10, font: fontBold });

      page.drawLine({ start: { x: 10, y: height - 280 }, end: { x: width - 10, y: height - 280 }, thickness: 1, color: rgb(0, 0, 0) });

      // Ship From
      page.drawText('SHIP FROM:', { x: 20, y: height - 295, size: 10, font: fontBold });
      page.drawText(`${pickupAddress.contact_name} - ${pickupAddress.phone}`, { x: 20, y: height - 310, size: 8, font });
      page.drawText(`${pickupAddress.address_line1}, ${pickupAddress.city}`, { x: 20, y: height - 322, size: 8, font });
      page.drawText(`PIN: ${pickupAddress.pincode}`, { x: 20, y: height - 334, size: 9, font: fontBold });

      page.drawLine({ start: { x: 10, y: height - 345 }, end: { x: width - 10, y: height - 345 }, thickness: 1, color: rgb(0, 0, 0) });

      // Details
      page.drawText(`Order Ref: ${order.order_reference}`, { x: 20, y: height - 365, size: 10, font: fontBold });
      page.drawText(`Weight: ${shipment.declared_weight_kg} kg`, { x: 20, y: height - 380, size: 9, font });
      page.drawText(`Payment: ${order.payment_mode.toUpperCase()}`, { x: 20, y: height - 395, size: 9, font });
      if (order.payment_mode.toLowerCase() === 'cod') {
        page.drawText(`COD collect: INR ${order.cod_amount}`, { x: 20, y: height - 412, size: 11, font: fontBold, color: rgb(0.8, 0, 0) });
      }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Generates a shipping label for a shipment (either fetch courier's own PDF or render custom).
   *
   * @param {string} shipmentId - Shipment UUID
   * @param {string} [format='4x6'] - '4x6' or 'a4'
   * @returns {Promise<string>} Uploaded Label URL
   */
  async generateLabelForShipment(shipmentId, format = '4x6') {
    // Find detailed shipment record
    const shipment = await Shipment.findByPk(shipmentId, {
      include: [
        { model: Order, as: 'order' },
        { model: CourierProvider, as: 'provider' },
        { model: PickupAddress, as: 'pickupAddress' },
      ],
    });

    if (!shipment) {
      throw new NotFoundError('Shipment not found');
    }

    const { order, provider, pickupAddress } = shipment;
    if (!order) {
      throw new NotFoundError('Associated order not found for label generation');
    }
    if (!provider) {
      throw new NotFoundError('Associated provider not found for label generation');
    }
    if (!pickupAddress) {
      throw new NotFoundError('Associated pickup address not found for label generation');
    }

    let pdfBuffer = null;
    let labelUrlToRehost = null;

    // Check if the provider can generate a label directly
    if (provider.provider_key !== 'mock') {
      try {
        const credentials = providerCredentialService.decrypt(provider.credentials_encrypted);
        const adapter = await ProviderFactory.getAdapter(provider.provider_key, credentials, provider.config || {}, provider.id);
        
        const labelResponse = await adapter.generateLabel({ awbNumber: shipment.awb_number });
        if (labelResponse.success && labelResponse.data && labelResponse.data.labelUrl) {
          labelUrlToRehost = labelResponse.data.labelUrl;
        }
      } catch (err) {
        logger.warn(`Provider adapter failed to generate label, falling back to custom rendering: ${err.message}`);
      }
    }

    // Try downloading the label URL if returned
    if (labelUrlToRehost) {
      try {
        const downloadResponse = await axios.get(labelUrlToRehost, { responseType: 'arraybuffer' });
        const contentType = downloadResponse.headers['content-type'] || '';
        const buffer = Buffer.from(downloadResponse.data);
        
        // Confirm it's a valid PDF structure by checking magic bytes "%PDF-"
        const isPdfMagic = buffer.toString('ascii', 0, 5).startsWith('%PDF');
        if (contentType.includes('pdf') || isPdfMagic) {
          pdfBuffer = buffer;
          logger.info(`Successfully fetched and validated third-party PDF label for AWB ${shipment.awb_number}`);
        } else {
          logger.warn(`Downloaded file from ${labelUrlToRehost} is not a valid PDF. Content-Type: ${contentType}. Falling back to custom label rendering.`);
        }
      } catch (err) {
        logger.error(`Error downloading provider PDF label from ${labelUrlToRehost}: ${err.message}. Falling back to custom rendering.`);
      }
    }

    // Fallback to generating our own custom label if needed
    if (!pdfBuffer) {
      logger.info(`Rendering custom shipping label for shipment ${shipmentId} (AWB: ${shipment.awb_number}) in format ${format}`);
      pdfBuffer = await this.renderCustomLabelPDF(shipment, order, provider, pickupAddress, format);
    }

    // Upload to file storage
    const destinationPath = 'shipments/labels';
    const originalName = `${shipment.awb_number || shipmentId}.pdf`;
    const mimeType = 'application/pdf';

    const uploadedUrl = await fileUploadService.uploadFile(pdfBuffer, destinationPath, originalName, mimeType);

    // Save label URL in Shipment
    shipment.label_url = uploadedUrl;
    await shipment.save();

    logger.info(`Successfully generated and stored shipping label URL for shipment ${shipmentId}: ${uploadedUrl}`);
    return uploadedUrl;
  }
}

module.exports = new LabelGenerationService();
