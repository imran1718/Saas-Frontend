const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  company_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  subdomain: {
    type: DataTypes.STRING(63),
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'pending'),
    defaultValue: 'pending',
    allowNull: false,
  },
  plan_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  legal_name: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  gstin: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  business_type: {
    type: DataTypes.ENUM('individual', 'proprietorship', 'partnership', 'pvt_ltd', 'llp', 'other'),
    allowNull: true,
  },
  support_email: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  support_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  logo_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  profile_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  kyc_status: {
    type: DataTypes.ENUM('pending', 'submitted', 'verified', 'rejected'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'tenants',
});

module.exports = Tenant;
