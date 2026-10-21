const AppError = require('../utils/AppError');

function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      return next(new AppError(400, 'Validation failed', details));
    }
    req.body = result.data;
    return next();
  };
}

module.exports = validate;
