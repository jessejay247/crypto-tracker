
// src/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const CommissionTransaction = require('../models/CommissionTransaction');

const AnalyticsController = require('../controllers/analyticsController');


router.get('/', authenticate, AnalyticsController.getAnalytics);

// Get user analytics
router.get('/user', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, network } = req.query;

    const query = { userId: req.userId };
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (network) {
      query.network = network.toUpperCase();
    }

    // Transaction stats
    const transactionStats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: { $toDouble: '$amount' } }
        }
      }
    ]);

    // Network breakdown
    const networkBreakdown = await Transaction.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: '$network',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Commission paid
    const commissionPaid = await Transaction.aggregate([
      { 
        $match: { 
          userId: req.userId,
          commissionApplied: true
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: '$commissionAmount' } }
        }
      }
    ]);

    res.json({
      transactionStats,
      networkBreakdown,
      commissionPaid: commissionPaid[0]?.total || 0
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Get transaction history with filters
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { 
      walletId, 
      network, 
      type, 
      status,
      startDate, 
      endDate,
      limit = 20, 
      offset = 0 
    } = req.query;

    const query = { userId: req.userId };

    if (walletId) query.walletId = walletId;
    if (network) query.network = network.toUpperCase();
    if (type) query.type = type;
    if (status) query.status = status;
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('walletId', 'network address label');

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > (parseInt(offset) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

module.exports = router;
