const AppError = require('../utils/AppError');
const logger = require('../config/logger');

function notFound(req, _res, next) {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
}

// Express recognises error handlers by their four arguments, so _next must stay.
function errorHandler(err, req, res, _next) {
  const log = req.log || logger;
  const statusCode = err.statusCode || err.status || 500;
  let message = err.message;

  if (err.type === 'entity.parse.failed') {
    message = 'Malformed JSON body';
  }

  if (statusCode >= 500) {
    log.error({ err }, 'Unhandled error');
    message = 'Internal server error';
  } else {
    log.warn({ statusCode, message }, 'Request failed');
  }

  res.status(statusCode).json({
    error: { message, ...(err.details && { details: err.details }) },
  });
}

module.exports = { notFound, errorHandler };
