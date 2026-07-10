const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const { sequelize } = require('./models');
const { getRedisClient } = require('./config/redis.config');
const cleanupJob = require('./jobs/cleanupExpiredTokens.job');

const startServer = async () => {
  try {
    // Check DB connection
    await sequelize.authenticate();
    logger.info('[DB] Connection has been established successfully.');

    // Initialize Redis
    getRedisClient();

    // Start background jobs
    cleanupJob.start();
    logger.info('[Jobs] Started background jobs.');

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
