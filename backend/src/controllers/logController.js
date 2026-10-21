const logger = require('../config/logger');

const frontendLogger = logger.child({ source: 'frontend' });

function ingest(req, res) {
  const { level, message, context, timestamp } = req.body;
  frontendLogger[level](
    { context, clientTimestamp: timestamp, userAgent: req.get('user-agent'), reqId: req.id },
    message,
  );
  res.status(202).end();
}

module.exports = { ingest };
