const { v4: uuidv4 } = require('uuid');
const { StorefrontConnection } = require('../models');

const create = async (data) => StorefrontConnection.create({ id: uuidv4(), ...data });
const findBySeller = async (sellerId) => StorefrontConnection.findAll({ where: { seller_id: sellerId } });
const findById = async (id) => StorefrontConnection.findByPk(id);
const update = async (id, data) => {
  await StorefrontConnection.update(data, { where: { id } });
  return findById(id);
};
module.exports = { create, findBySeller, findById, update };
