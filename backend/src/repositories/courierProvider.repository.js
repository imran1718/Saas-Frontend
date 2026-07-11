'use strict';

const { CourierProvider } = require('../models');
const { Op } = require('sequelize');

const findAll = async ({ is_active, provider_key, limit = 20, page = 1 }) => {
  const offset = (page - 1) * limit;
  const where = {};

  if (is_active !== undefined && is_active !== '') {
    where.is_active = is_active === 'true' || is_active === true;
  }

  if (provider_key) {
    where.provider_key = {
      [Op.iLike]: `%${provider_key}%`,
    };
  }

  const { count, rows } = await CourierProvider.findAndCountAll({
    where,
    limit,
    offset,
    order: [['priority', 'DESC'], ['created_at', 'DESC']],
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

const findById = async (id, includeCredentials = false) => {
  if (includeCredentials) {
    return CourierProvider.scope('withCredentials').findByPk(id);
  }
  return CourierProvider.findByPk(id);
};

const findByKey = async (providerKey, includeCredentials = false) => {
  const options = { where: { provider_key: providerKey } };
  if (includeCredentials) {
    return CourierProvider.scope('withCredentials').findOne(options);
  }
  return CourierProvider.findOne(options);
};

const create = async (data, transaction = null) => {
  return CourierProvider.create(data, { transaction });
};

const update = async (id, data, transaction = null) => {
  const provider = await CourierProvider.scope('withCredentials').findByPk(id, { transaction });
  if (!provider) return null;
  await provider.update(data, { transaction });
  return provider;
};

const getEncryptedCredentials = async (id) => {
  const provider = await CourierProvider.scope('withCredentials').findByPk(id, {
    attributes: ['credentials_encrypted'],
  });
  return provider ? provider.credentials_encrypted : null;
};

module.exports = {
  findAll,
  findById,
  findByKey,
  create,
  update,
  getEncryptedCredentials,
};
