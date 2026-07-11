class AuthenticationError extends Error {
  constructor(message, code = 'UNAUTHORIZED') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
  }
}

class ForbiddenError extends Error {
  constructor(message, code = 'FORBIDDEN') {
    super(message);
    this.name = 'ForbiddenError';
    this.code = code;
  }
}

class NotFoundError extends Error {
  constructor(message, code = 'NOT_FOUND') {
    super(message);
    this.name = 'NotFoundError';
    this.code = code;
  }
}

class OrderNotShippableError extends Error {
  constructor(message = 'Order is not in a shippable state or already has a shipment') {
    super(message);
    this.name = 'OrderNotShippableError';
    this.code = 'ORDER_NOT_SHIPPABLE';
    this.statusCode = 409;
  }
}

class RateQuoteExpiredError extends Error {
  constructor(message = 'Please refresh rates before creating the shipment') {
    super(message);
    this.name = 'RateQuoteExpiredError';
    this.code = 'RATE_QUOTE_EXPIRED';
    this.statusCode = 422;
  }
}

class ProviderShipmentCreationFailedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProviderShipmentCreationFailedError';
    this.code = 'PROVIDER_SHIPMENT_CREATION_FAILED';
    this.statusCode = 502;
  }
}

class ShipmentNotCancellableError extends Error {
  constructor(message = 'Shipment cannot be cancelled in its current state') {
    super(message);
    this.name = 'ShipmentNotCancellableError';
    this.code = 'SHIPMENT_NOT_CANCELLABLE';
    this.statusCode = 409;
  }
}

class BadRequestError extends Error {
  constructor(message, code = 'BAD_REQUEST') {
    super(message);
    this.name = 'BadRequestError';
    this.code = code;
    this.statusCode = 400;
  }
}

class InsufficientBalanceError extends Error {
  constructor(message = 'Insufficient wallet balance for this shipment rate') {
    super(message);
    this.name = 'InsufficientBalanceError';
    this.code = 'INSUFFICIENT_BALANCE';
    this.statusCode = 422;
  }
}

class PaymentSignatureInvalidError extends Error {
  constructor(message = 'Payment gateway verification signature mismatch') {
    super(message);
    this.name = 'PaymentSignatureInvalidError';
    this.code = 'PAYMENT_SIGNATURE_INVALID';
    this.statusCode = 422;
  }
}

class RechargeOrderNotFoundError extends Error {
  constructor(message = 'Recharge order record not found') {
    super(message);
    this.name = 'RechargeOrderNotFoundError';
    this.code = 'RECHARGE_ORDER_NOT_FOUND';
    this.statusCode = 404;
  }
}

module.exports = {
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  OrderNotShippableError,
  RateQuoteExpiredError,
  ProviderShipmentCreationFailedError,
  ShipmentNotCancellableError,
  BadRequestError,
  InsufficientBalanceError,
  PaymentSignatureInvalidError,
  RechargeOrderNotFoundError,
};

