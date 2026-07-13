const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const routes = require('./routes/index.routes');
const errorHandler = require('./middlewares/errorHandler.middleware');
const requestLogger = require('./middlewares/requestLogger.middleware');
const { tenantScopeMiddleware } = require('./middlewares/tenantScope.middleware');
const { globalLimiter } = require('./middlewares/rateLimiter.middleware');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: [config.frontendUrl, config.platformAdminFrontendUrl],
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Compression
app.use(compression());

// Request tracking & logging
app.use(requestLogger);

// Global rate limiting
app.use(globalLimiter);

// Tenant Scope Initialization
app.use(tenantScopeMiddleware);

// API Routes
app.use('/api/v1', routes);

// Inbound webhook receivers (outside /v1/ — URLs registered with external platforms)
app.use('/api/webhooks/razorpay', require('./routes/razorpayWebhook.routes'));
app.use('/api/webhooks', require('./routes/storefrontWebhookReceiver.routes'));

// Static uploads serving
const path = require('path');
app.use(`/${config.storage.uploadDir}`, express.static(path.join(__dirname, '..', config.storage.uploadDir)));


// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
