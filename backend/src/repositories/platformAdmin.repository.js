const { PlatformAdmin } = require('../models');

const findByEmail = async (email) => {
  return PlatformAdmin.findOne({ where: { email } });
};

const findById = async (id) => {
  return PlatformAdmin.findByPk(id);
};

const create = async (adminData) => {
  return PlatformAdmin.create(adminData);
};

const update = async (id, updateData) => {
  await PlatformAdmin.update(updateData, { where: { id } });
  return findById(id);
};

module.exports = {
  findByEmail,
  findById,
  create,
  update,
};
