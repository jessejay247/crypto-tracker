
// src/middleware/validator.js
const { body, param, query, validationResult } = require('express-validator');

exports.validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Return detailed error information
    res.status(400).json({ 
      error: 'Validation error',
      details: errors.array(),
      receivedData: req.body // ADD THIS to see what was received
    });
  };
};

// Common validation rules
exports.registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty()
];

// Wallet creation validation
exports.walletValidation = [
  body('network')
    .notEmpty()
    .withMessage('Network is required')
    .isIn(['BTC', 'ETH', 'POLYGON', 'BSC', 'SOL', 'TRX', 'LTC', 'DOGE', 'DASH', 'XRP'])
    .withMessage('Invalid network'),
  body('environment')
    .optional()
    .isIn(['mainnet', 'testnet'])
    .withMessage('Environment must be either mainnet or testnet'),
  body('label')
    .optional()
    .isString()
    .withMessage('Label must be a string')
];

// Transaction validation
exports.transactionValidation = [
  body('walletId')
    .notEmpty()
    .withMessage('Wallet ID is required')
    .isMongoId()
    .withMessage('Invalid wallet ID'),
  body('toAddress')
    .notEmpty()
    .withMessage('Recipient address is required')
    .isString()
    .withMessage('Address must be a string'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isNumeric()
    .withMessage('Amount must be numeric')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    }),
  body('tokenAddress')
    .optional()
    .isString()
    .withMessage('Token address must be a string')
];