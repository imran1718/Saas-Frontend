const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Tenant = require('./tenant.model');

const PickupAddress = sequelize.define('PickupAddress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenant_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Tenant,
      key: 'id',
    },
  },
  label: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  contact_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  contact_phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  address_line1: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  address_line2: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  pincode: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  country: {
    type: DataTypes.STRING(100),
    defaultValue: 'India',
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verification_status: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected'),
    defaultValue: 'pending',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'pickup_addresses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Associations
Tenant.hasMany(PickupAddress, { foreignKey: 'tenant_id' });
PickupAddress.belongsTo(Tenant, { foreignKey: 'tenant_id' });

module.exports = PickupAddress;
