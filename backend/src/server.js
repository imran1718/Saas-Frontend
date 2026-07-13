const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const { sequelize } = require('./models');
const { getRedisClient } = require('./config/redis.config');
const cleanupJob = require('./jobs/cleanupExpiredTokens.job');
const webhookProcessWorker = require('./workers/webhookProcess.worker');
const trackingPollWorker = require('./workers/trackingPoll.worker');
const ndrDetectionWorker = require('./workers/ndrDetection.worker');
const { startScheduler, stopScheduler } = require('./queues/trackingPollScheduler');
const monthlyStatementWorker = require('./workers/monthlyStatement.worker');
const { scheduleMonthlyStatements } = require('./schedulers/monthlyStatementScheduler');
const planRenewalWorker = require('./workers/planRenewal.worker');
const { schedulePlanRenewals } = require('./schedulers/planRenewalScheduler');
const notificationDispatchWorker = require('./queue/workers/notificationDispatch.worker');
const { webhookDeliveryWorker } = require('./queue/workers/webhookDelivery.worker');
const { analyticsSnapshotWorker, scheduleNightlySnapshots } = require('./jobs/analyticsSnapshot.worker');
const reportExportWorker = require('./workers/reportExport.worker');
const { auditLogRetentionWorker, scheduleAuditLogRetention } = require('./workers/auditLogRetention.worker');
const sandboxStatusProgressionWorker = require('./jobs/sandboxStatusProgression.worker');
const codRemittanceReconciliationWorker = require('./jobs/codRemittanceReconciliation.worker');

const startServer = async () => {
  try {
    // Check DB connection
    await sequelize.authenticate();
    logger.info('[DB] Connection has been established successfully.');

    // Initialize Redis
    getRedisClient();

    // Initialize central event subscriptions mapping (Module 14 Hook)
    const { initializeSubscriptions } = require('./events/eventSubscriptions');
    initializeSubscriptions();

    // Start background jobs

    cleanupJob.start();
    logger.info('[Jobs] Started background jobs.');

    // Start BullMQ workers
    logger.info('[Workers] Webhook process worker started.');
    logger.info('[Workers] Tracking poll worker started.');
    logger.info('[Workers] NDR detection worker started.');

    // Start repeatable tracking poll scheduler
    await startScheduler();
    logger.info('[Scheduler] Tracking poll scheduler registered.');

    // Start repeatable billing statements scheduler
    await scheduleMonthlyStatements();
    logger.info('[Scheduler] Monthly billing statements scheduler registered.');

    // Start repeatable subscription renewal scheduler
    await schedulePlanRenewals();
    logger.info('[Scheduler] Subscription plan renewals scheduler registered.');

    // Start repeatable analytics daily snapshots pre-aggregation scheduler
    await scheduleNightlySnapshots();
    logger.info('[Scheduler] Nightly analytics snapshots scheduler registered.');

    // Start repeatable audit log retention purge scheduler (nightly, 2am UTC)
    await scheduleAuditLogRetention();
    logger.info('[Scheduler] Nightly audit log retention scheduler registered.');

    // Start SLA breach checker cron (every 30 minutes)
    const cron = require('node-cron');
    const ticketSlaService = require('./services/ticketSla.service');
    cron.schedule('*/30 * * * *', async () => {
      try {
        await ticketSlaService.checkSlaBreaches();
      } catch (err) {
        logger.error(`[SlaCron] SLA check failed: ${err.message}`);
      }
    });
    logger.info('[Scheduler] Ticket SLA breach checker registered (every 30m).');

    // Start Express server
    const server = app.listen(config.port, () => {
      logger.info(`[Server] Listening on port ${config.port} in ${config.nodeEnv} mode`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('[Server] Shutting down gracefully...');
      server.close(() => {
        logger.info('[Server] HTTP server closed.');
      });
      cleanupJob.stop();
      await webhookProcessWorker.close();
      await trackingPollWorker.close();
      await ndrDetectionWorker.close();
      await monthlyStatementWorker.close();
      await planRenewalWorker.close();
      await notificationDispatchWorker.close();
      await webhookDeliveryWorker.close();
      await analyticsSnapshotWorker.close();
      await reportExportWorker.close();
      await auditLogRetentionWorker.close();
      await sandboxStatusProgressionWorker.close();
      await codRemittanceReconciliationWorker.close();
      await stopScheduler();

      await sequelize.close();
      const redisClient = getRedisClient();
      if (redisClient) {
        await redisClient.quit();
      }
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('[Server] Failed to start:', { error: error.message });
    process.exit(1);
  }
};

startServer();
