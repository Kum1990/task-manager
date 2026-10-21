const { Pool, types } = require('pg');
const config = require('./index');
const logger = require('./logger');

// Return DATE columns as 'YYYY-MM-DD' strings instead of JS Dates (avoids timezone shifts).
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => logger.error({ err }, 'Unexpected PostgreSQL pool error'));

async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  logger.debug({ durationMs: Date.now() - start, rowCount: result.rowCount }, 'db query');
  return result;
}

async function waitForDatabase({ retries = 15, delayMs = 2000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      logger.info('Database connection established');
      return;
    } catch (err) {
      logger.warn({ attempt, retries, error: err.message }, 'Database not ready, retrying');
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Database is not reachable');
}

module.exports = { pool, query, waitForDatabase };
