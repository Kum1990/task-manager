const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const logger = require('../config/logger');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATION_LOCK_ID = 727274;

async function runMigrations() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);
    for (const file of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await client.query(sql);
      logger.info({ file }, 'Migration executed');
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]);
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      logger.fatal({ err }, 'Migration failed');
      process.exit(1);
    });
}

module.exports = { runMigrations };
