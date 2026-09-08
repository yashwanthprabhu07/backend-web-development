const { validationResult } = require('express-validator');
const AppError = require('./AppError');

module.exports = (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    return next(new AppError('Validation failed', 422));
  }

  next();
};