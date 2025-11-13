
// src/routes/walletRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authenticateApiKey } = require('../middleware/auth');
const { validate, walletValidation, transactionValidation } = require('../middleware/validator');
const { transactionLimiter } = require('../middleware/rateLimiter');
const WalletController = require('../controllers/walletController');

// Support both JWT and API key authentication
const auth = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  if (apiKey) {
    return authenticateApiKey(req, res, next);
  }
  return authenticate(req, res, next);
};

// Wallet routes
router.post('/create', auth, validate(walletValidation), WalletController.createWallet);
router.get('/wallets', auth, WalletController.getWallets);
router.get('/wallets/:walletId', auth, WalletController.getBalance);
router.get('/transactions', auth, WalletController.getTransactions);


// NEW: Bulk operations
router.post('/bulk-create', auth, WalletController.bulkCreateWallets);
router.get('/bulk-balance', auth, WalletController.bulkGetBalances);


// Transaction routes
router.post(
  '/send', 
  auth, 
  transactionLimiter,
  validate(transactionValidation), 
  WalletController.sendTransaction
);

module.exports = router;

