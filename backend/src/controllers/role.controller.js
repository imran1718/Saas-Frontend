const roleService = require('../services/role.service');
const { success } = require('../utils/apiResponse');

const getRoles = async (req, res, next) => {
  try {
    const result = await roleService.getRoles(req.query);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getRoleById = async (req, res, next) => {
  try {
    const result = await roleService.getRoleById(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const createRole = async (req, res, next) => {
  try {
    const result = await roleService.createRole(req.body, req);
    return success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const result = await roleService.updateRole(req.params.id, req.body, req);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    await roleService.deleteRole(req.params.id, req);
    return success(res, { message: 'Role deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
