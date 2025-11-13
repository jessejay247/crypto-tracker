// src/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authenticateApiKey } = require('../middleware/auth');
const Transaction = require('../models/Transaction');

const auth = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  if (apiKey) {
    return authenticateApiKey(req, res, next);
  }
  return authenticate(req, res, next);
};

// Get transaction by hash
router.get('/:txHash', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      userId: req.userId,
      txHash: req.params.txHash
    }).populate('walletId', 'network address label');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({ error: 'Failed to get transaction' });
  }
});

// Get transaction status
router.get('/:txHash/status', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      userId: req.userId,
      txHash: req.params.txHash
    }).select('status confirmations txHash timestamp');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      txHash: transaction.txHash,
      status: transaction.status,
      confirmations: transaction.confirmations,
      timestamp: transaction.timestamp
    });
  } catch (error) {
    console.error('Error getting transaction status:', error);
    res.status(500).json({ error: 'Failed to get transaction status' });
  }
});

module.exports = router;