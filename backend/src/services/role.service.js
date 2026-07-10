const roleRepo = require('../repositories/role.repository');
const permissionRepo = require('../repositories/permission.repository');
const auditService = require('./audit.service');
const { getRedisClient } = require('../config/redis.config');
const { RESERVED_PERMISSIONS } = require('../constants/permissions.constant');

class ForbiddenError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ForbiddenError';
    this.code = code;
  }
}

class ConflictError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ConflictError';
    this.code = code;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

const invalidateUserPermissionsCache = async (roleId) => {
  // To completely clear cache for users of this role, we would need to know their IDs,
  // or we can use a key pattern. For now, since users fetch their perms based on role,
  // we invalidate any user tied to this role. 
  // Given we map perm:{user_id}, we need to query users by roleId.
  const { User } = require('../models');
  const users = await User.findAll({ where: { role_id: roleId }, attributes: ['id'] });
  
  const redis = getRedisClient();
  if (redis && users.length > 0) {
    const pipeline = redis.pipeline();
    users.forEach(u => pipeline.del(`perm:${u.id}`));
    await pipeline.exec();
  }
};

const getRoles = async (query = {}) => {
  const { page = 1, limit = 20, search } = query;
  const offset = (page - 1) * limit;
  const options = { offset, limit: parseInt(limit, 10) };
  
  if (search) {
    const { Op } = require('sequelize');
    options.where = {
      ...options.where,
      name: { [Op.iLike]: `%${search}%` }
    };
  }
  
  return await roleRepo.findAll(options);
};

const getRoleById = async (id) => {
  const role = await roleRepo.findById(id);
  if (!role) throw new NotFoundError('Role not found');
  return role;
};

const validatePrivilegeEscalation = (requestedKeys, currentUserPerms) => {
  // User must possess ALL requested permissions to grant them
  for (const key of requestedKeys) {
    if (!currentUserPerms.includes(key)) {
      throw new ForbiddenError('PERMISSION_ESCALATION', `You cannot grant permissions you do not hold yourself: ${key}`);
    }
    if (RESERVED_PERMISSIONS.includes(key)) {
      throw new ForbiddenError('UNASSIGNABLE_PERMISSION', `The permission '${key}' is reserved for the Platform Admin Access Model and cannot be assigned by tenant administrators.`);
    }
  }
};

const createRole = async (data, req) => {
  const { name, description, permission_keys } = data;
  
  // Guard
  validatePrivilegeEscalation(permission_keys, req.user.permissions);

  const dbPerms = await permissionRepo.findByKeys(permission_keys);
  const permIds = dbPerms.map(p => p.id);

  const role = await roleRepo.create({ name, description, is_editable: true }, permIds);

  await auditService.log(
    req.user.tenant_id,
    req.user.id,
    'role_created',
    { role_id: role.id, name, permission_keys_after: permission_keys },
    req
  );

  return await roleRepo.findById(role.id);
};

const updateRole = async (id, data, req) => {
  const { name, description, permission_keys } = data;
  
  const role = await getRoleById(id);
  if (!role.is_editable) {
    throw new ForbiddenError('SYSTEM_ROLE', 'System roles cannot be modified');
  }

  // Guard
  validatePrivilegeEscalation(permission_keys, req.user.permissions);

  const dbPerms = await permissionRepo.findByKeys(permission_keys);
  const permIds = dbPerms.map(p => p.id);
  
  const permission_keys_before = role.permissions.map(p => p.key);

  await roleRepo.update(role, { name, description }, permIds);
  await invalidateUserPermissionsCache(role.id);

  await auditService.log(
    req.user.tenant_id,
    req.user.id,
    'role_updated',
    { role_id: role.id, permission_keys_before, permission_keys_after: permission_keys },
    req
  );

  return await roleRepo.findById(role.id);
};

const deleteRole = async (id, req) => {
  const role = await getRoleById(id);
  if (!role.is_editable) {
    throw new ForbiddenError('SYSTEM_ROLE', 'System roles cannot be deleted');
  }

  const userCount = await roleRepo.countUsersWithRole(id);
  if (userCount > 0) {
    throw new ConflictError('ROLE_IN_USE', 'Cannot delete a role assigned to active users');
  }

  await roleRepo.remove(role);
  
  await auditService.log(
    req.user.tenant_id,
    req.user.id,
    'role_deleted',
    { role_id: role.id, name: role.name },
    req
  );
  
  return true;
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  ForbiddenError,
  ConflictError,
  NotFoundError,
  invalidateUserPermissionsCache,
};
