const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('../utils/AppError');

function authenticate(req, _res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Authentication required'));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: Number(payload.sub), username: payload.username };
    return next();
  } catch {
    return next(new AppError(401, 'Invalid or expired token'));
  }
}

module.exports = authenticate;
