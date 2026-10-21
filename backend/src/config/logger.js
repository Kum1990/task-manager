const pino = require('pino');
const config = require('./index');

const logger = pino({
  level: config.env === 'test' ? 'silent' : config.logLevel,
  base: { service: 'task-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['req.headers.authorization', 'password', '*.password'],
});

module.exports = logger;
