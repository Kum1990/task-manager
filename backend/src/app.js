const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');
const config = require('./config');
const logger = require('./config/logger');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const QUIET_PATHS = new Set(['/api/health', '/api/ready', '/api/logs']);

function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    pinoHttp({
      logger,
      // Reuse the request id from Nginx so one request can be traced across services.
      genReqId: (req, res) => {
        const id = req.headers['x-request-id'] || crypto.randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      autoLogging: { ignore: (req) => QUIET_PATHS.has(req.url) },
    }),
  );
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
