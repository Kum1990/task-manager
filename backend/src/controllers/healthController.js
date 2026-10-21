const { pool } = require('../config/db');

function liveness(_req, res) {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
}

async function readiness(req, res) {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch (err) {
    req.log.error({ err }, 'Readiness check failed');
    res.status(503).json({ status: 'unavailable' });
  }
}

module.exports = { liveness, readiness };
