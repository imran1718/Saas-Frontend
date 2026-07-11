'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const WebhookDelivery = sequelize.define('WebhookDelivery', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tenant_webhook_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  event_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  response_status_code: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  response_body: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  attempt_number: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  status: {
    type: DataTypes.ENUM('pending', 'delivered', 'failed', 'exhausted'),
    defaultValue: 'pending',
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'webhook_deliveries',
  timestamps: true,
  underscored: true,
});

module.exports = WebhookDelivery;
