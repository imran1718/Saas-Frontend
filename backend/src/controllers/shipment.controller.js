'use strict';

const shipmentService = require('../services/shipment.service');
const shipmentRepository = require('../repositories/shipment.repository');
const { success } = require('../utils/apiResponse');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const createShipment = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const userId = req.user.id;
    const shipment = await shipmentService.createShipment(req.body, tenantId, userId, req);
    return success(res, shipment, 201);
  } catch (err) {
    next(err);
  }
};

const listShipments = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const {
      status,
      courier_provider_id,
      awb_number,
      date_from,
      date_to,
      search,
      page,
      limit,
      sort,
      order,
    } = req.query;

    const result = await shipmentRepository.findAll({
      tenant_id: tenantId,
      status,
      courier_provider_id,
      awb_number,
      date_from,
      date_to,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      sort: sort || 'created_at',
      order: order || 'DESC',
    });

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getShipmentDetail = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const shipment = await shipmentRepository.findById(id, tenantId);

    if (!shipment) {
      throw new NotFoundError('Shipment not found');
    }

    return success(res, shipment);
  } catch (err) {
    next(err);
  }
};

const cancelShipment = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const userId = req.user.id;
    const { id } = req.params;

    const result = await shipmentService.cancelShipment(id, tenantId, userId, req);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getShipmentSummary = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const summary = await shipmentService.getShipmentSummary(tenantId);
    return success(res, summary);
  } catch (err) {
    next(err);
  }
};

const labelGenerationService = require('../services/labelGeneration.service');
const bulkLabelService = require('../services/bulkLabel.service');
const { Shipment } = require('../models');

const generateLabel = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { id } = req.params;
    const { format } = req.query; // '4x6' or 'a4'
    const shipment = await shipmentRepository.findById(id, tenantId);

    if (!shipment) {
      throw new NotFoundError('Shipment not found');
    }

    let labelUrl = shipment.label_url;
    if (!labelUrl) {
      labelUrl = await labelGenerationService.generateLabelForShipment(id, format || '4x6');
    }

    return success(res, { label_url: labelUrl });
  } catch (err) {
    next(err);
  }
};

const generateBulkLabel = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const { shipment_ids, format } = req.body;

    if (!Array.isArray(shipment_ids) || shipment_ids.length === 0) {
      throw new BadRequestError('shipment_ids must be a non-empty array');
    }

    if (shipment_ids.length > 100) {
      throw new BadRequestError('Cannot merge more than 100 labels in a single batch to protect system memory limits.');
    }

    // Verify all shipments belong to this tenant
    const count = await Shipment.count({
      where: {
        id: shipment_ids,
        tenant_id: tenantId,
      }
    });

    if (count !== shipment_ids.length) {
      throw new NotFoundError('One or more shipments not found or unauthorized');
    }

    const mergedUrl = await bulkLabelService.generateBulkLabelPDF(shipment_ids, format || '4x6');
    return success(res, { label_url: mergedUrl });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createShipment,
  listShipments,
  getShipmentDetail,
  cancelShipment,
  getShipmentSummary,
  generateLabel,
  generateBulkLabel,
};
