'use strict';

const { Shipment, Order, CourierProvider, PickupAddress, ShipmentStatusHistory } = require('../models');
const { Op } = require('sequelize');

const findById = async (id, tenantId) => {
  return Shipment.scope('detailed').findOne({
    where: { id, tenant_id: tenantId },
    include: [
      {
        model: Order,
        as: 'order',
        attributes: [
          'id',
          'order_reference',
          'customer_name',
          'customer_phone',
          'customer_email',
          'shipping_address_line1',
          'shipping_address_line2',
          'shipping_city',
          'shipping_state',
          'shipping_pincode',
          'shipping_country',
          'order_value',
          'payment_mode',
          'cod_amount',
        ],
      },
      {
        model: CourierProvider,
        as: 'provider',
        attributes: ['id', 'provider_key', 'display_name', 'logo_url'],
      },
      {
        model: PickupAddress,
        as: 'pickupAddress',
      },
      {
        model: ShipmentStatusHistory,
        as: 'statusHistory',
      },
    ],
    order: [[{ model: ShipmentStatusHistory, as: 'statusHistory' }, 'created_at', 'DESC']],
  });
};

const findAll = async ({
  tenant_id,
  status,
  courier_provider_id,
  awb_number,
  date_from,
  date_to,
  search,
  page = 1,
  limit = 20,
  sort = 'created_at',
  order = 'DESC',
}) => {
  const offset = (page - 1) * limit;
  const where = { tenant_id };

  if (status) {
    where.status = status;
  }

  if (courier_provider_id) {
    where.courier_provider_id = courier_provider_id;
  }

  if (awb_number) {
    where.awb_number = {
      [Op.iLike]: `%${awb_number}%`,
    };
  }

  if (date_from || date_to) {
    where.created_at = {};
    if (date_from) {
      where.created_at[Op.gte] = new Date(date_from);
    }
    if (date_to) {
      where.created_at[Op.lte] = new Date(date_to);
    }
  }

  const orderInclude = [];
  if (search) {
    orderInclude.push({
      model: Order,
      as: 'order',
      where: {
        [Op.or]: [
          { order_reference: { [Op.iLike]: `%${search}%` } },
          { customer_name: { [Op.iLike]: `%${search}%` } },
        ],
      },
    });
  } else {
    orderInclude.push({
      model: Order,
      as: 'order',
      attributes: ['id', 'order_reference', 'customer_name'],
    });
  }

  // Include CourierProvider for display
  orderInclude.push({
    model: CourierProvider,
    as: 'provider',
    attributes: ['display_name', 'provider_key'],
  });

  const { count, rows } = await Shipment.findAndCountAll({
    where,
    limit,
    offset,
    include: orderInclude,
    order: [[sort, order]],
  });

  return {
    rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

const create = async (data, transaction = null) => {
  return Shipment.create(data, { transaction });
};

const update = async (id, data, transaction = null) => {
  const shipment = await Shipment.findByPk(id, { transaction });
  if (!shipment) return null;
  await shipment.update(data, { transaction });
  return shipment;
};

module.exports = {
  findById,
  findAll,
  create,
  update,
};
