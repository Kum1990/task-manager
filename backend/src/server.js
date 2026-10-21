const config = require('./config');
const logger = require('./config/logger');
const { pool, waitForDatabase } = require('./config/db');
const { runMigrations } = require('./db/migrate');
const createApp = require('./app');

async function start() {
  await waitForDatabase();
  await runMigrations();

  const server = createApp().listen(config.port, () => {
    logger.info({ port: config.port, env: config.env }, 'Task API listening');
  });

  const shutdown = (signal) => {
    logger.info({ signal }, 'Shutting down gracefully');
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
