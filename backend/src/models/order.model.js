const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');
const Tenant = require('./tenant.model');
const PickupAddress = require('./pickupAddress.model');
const User = require('./user.model');

const Order = sequelize.define('Order', {
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
  order_reference: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  pickup_address_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: PickupAddress,
      key: 'id',
    },
  },
  customer_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  customer_phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  customer_email: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  shipping_address_line1: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  shipping_address_line2: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  shipping_city: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  shipping_state: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  shipping_pincode: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  shipping_country: {
    type: DataTypes.STRING(100),
    defaultValue: 'India',
  },
  order_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  payment_mode: {
    type: DataTypes.ENUM('prepaid', 'cod'),
    allowNull: false,
  },
  cod_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  weight_kg: {
    type: DataTypes.DECIMAL(6, 3),
    allowNull: false,
  },
  length_cm: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  width_cm: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  height_cm: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'ready_to_ship', 'shipped', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false,
  },
  source: {
    type: DataTypes.ENUM('manual', 'bulk_import', 'api'),
    defaultValue: 'manual',
    allowNull: false,
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: User,
      key: 'id',
    },
  },
  sandbox: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  whatsapp_opted_in: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Order;
