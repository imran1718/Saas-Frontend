const orderService = require('../services/order.service');

class OrderController {
  async getOrders(req, res, next) {
    try {
      const tenantId = req.tenant.id;
      const result = await orderService.listOrders(tenantId, req.query);
      res.status(200).json({ success: true, data: result, error: null });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const tenantId = req.tenant.id;
      const { id } = req.params;
      const order = await orderService.getOrderById(tenantId, id);
      res.status(200).json({ success: true, data: order, error: null });
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req, res, next) {
    try {
      const tenantId = req.tenant.id;
      const order = await orderService.createOrder(tenantId, req.body, req.user.id);
      res.status(201).json({ success: true, data: order, error: null });
    } catch (error) {
      if (error.code === 'DUPLICATE_ORDER_REFERENCE') {
        return res.status(409).json({ success: false, error: { code: error.code, message: error.message } });
      }
      next(error);
    }
  }

  async updateOrder(req, res, next) {
    try {
      const tenantId = req.tenant.id;
      const { id } = req.params;
      const order = await orderService.updateOrder(tenantId, id, req.body, req.user.id);
      res.status(200).json({ success: true, data: order, error: null });
    } catch (error) {
      if (error.code === 'DUPLICATE_ORDER_REFERENCE' || error.code === 'ORDER_NOT_EDITABLE') {
        return res.status(409).json({ success: false, error: { code: error.code, message: error.message } });
      }
      next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const tenantId = req.tenant.id;
      const { id } = req.params;
      const { status, note } = req.body;
      const order = await orderService.changeStatus(tenantId, id, status, req.user.id, note);
      res.status(200).json({ success: true, data: order, error: null });
    } catch (error) {
      if (error.code === 'INVALID_STATUS_TRANSITION') {
        return res.status(422).json({ success: false, error: { code: error.code, message: error.message } });
      }
      next(error);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const tenantId = req.tenant.id;
      const { id } = req.params;
      const { note } = req.body;
      const order = await orderService.cancelOrder(tenantId, id, req.user.id, note);
      res.status(200).json({ success: true, data: order, error: null });
    } catch (error) {
      if (error.code === 'ORDER_NOT_EDITABLE') {
        return res.status(409).json({ success: false, error: { code: error.code, message: error.message } });
      }
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const tenantId = req.tenant.id;
      const summary = await orderService.getSummary(tenantId);
      res.status(200).json({ success: true, data: summary, error: null });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
