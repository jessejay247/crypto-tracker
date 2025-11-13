// ============================================
// backend/src/routes/adminRoutes.js - ENHANCED
// ============================================
const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const CommissionTransaction = require('../models/CommissionTransaction');
const SystemConfig = require('../models/SystemConfig');
const CustomerTokenConfig = require('../models/CustomerTokenConfig');
const CommissionService = require('../services/commissionService');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

// ========================================
// DASHBOARD STATISTICS
// ========================================

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const activeUsers = await User.countDocuments({
      role: 'customer',
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    const totalWallets = await Wallet.countDocuments();
    const totalTransactions = await Transaction.countDocuments();

    // Admin commission stats
    const commissionEarnings = await CommissionService.getTotalAdminEarnings();
    
    const monthlyCommission = await CommissionTransaction.aggregate([
      {
        $match: {
          timestamp: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: '$commissionAmount' } }
        }
      }
    ]);

    const dailyCommission = await CommissionTransaction.aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: '$commissionAmount' } }
        }
      }
    ]);

    // Transaction volume by network
    const volumeByNetwork = await Transaction.aggregate([
      {
        $group: {
          _id: '$network',
          count: { $sum: 1 },
          volume: { $sum: { $toDouble: '$amount' } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers
      },
      wallets: {
        total: totalWallets
      },
      transactions: {
        total: totalTransactions,
        byNetwork: volumeByNetwork
      },
      commission: {
        total: commissionEarnings.total || 0,
        transactionCount: commissionEarnings.count || 0,
        monthly: monthlyCommission[0]?.total || 0,
        daily: dailyCommission[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// ========================================
// SYSTEM CONFIGURATION
// ========================================

router.get('/config', async (req, res) => {
  try {
    const config = await SystemConfig.getConfig();
    res.json({ config });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

router.put('/config', async (req, res) => {
  try {
    const updates = req.body;
    const config = await SystemConfig.updateConfig(updates, req.userId);
    
    res.json({
      message: 'Configuration updated successfully',
      config
    });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

router.patch('/config/commission/:network', async (req, res) => {
  try {
    const { network } = req.params;
    const { address, enabled } = req.body;
    
    const config = await SystemConfig.getConfig();
    
    const commissionConfig = config.commissionAddresses.find(
      c => c.network === network.toUpperCase()
    );
    
    if (!commissionConfig) {
      return res.status(404).json({ error: 'Network not found' });
    }
    
    if (address !== undefined) commissionConfig.address = address;
    if (enabled !== undefined) commissionConfig.enabled = enabled;
    
    config.updatedBy = req.userId;
    config.updatedAt = new Date();
    await config.save();
    
    res.json({
      message: 'Commission configuration updated',
      config: commissionConfig
    });
  } catch (error) {
    console.error('Update commission config error:', error);
    res.status(500).json({ error: 'Failed to update commission configuration' });
  }
});

// ========================================
// PRE-APPROVED TOKENS MANAGEMENT
// ========================================

router.get('/tokens/pre-approved', async (req, res) => {
  try {
    const config = await SystemConfig.getConfig();
    res.json({ tokens: config.preApprovedTokens });
  } catch (error) {
    console.error('Get pre-approved tokens error:', error);
    res.status(500).json({ error: 'Failed to get pre-approved tokens' });
  }
});

router.post('/tokens/pre-approved', async (req, res) => {
  try {
    const { network, contractAddress, name, symbol, decimals, logo } = req.body;
    
    if (!network || !contractAddress || !name || !symbol || decimals === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: network, contractAddress, name, symbol, decimals' 
      });
    }
    
    const config = await SystemConfig.getConfig();
    
    config.addPreApprovedToken({
      network,
      contractAddress,
      name,
      symbol,
      decimals,
      logo
    });
    
    config.updatedBy = req.userId;
    config.updatedAt = new Date();
    await config.save();
    
    res.status(201).json({
      message: 'Pre-approved token added successfully',
      token: config.preApprovedTokens[config.preApprovedTokens.length - 1]
    });
  } catch (error) {
    console.error('Add pre-approved token error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/tokens/pre-approved/:tokenId/toggle', async (req, res) => {
  try {
    const config = await SystemConfig.getConfig();
    const token = config.preApprovedTokens.id(req.params.tokenId);
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    token.enabled = !token.enabled;
    config.updatedBy = req.userId;
    config.updatedAt = new Date();
    await config.save();
    
    res.json({
      message: `Token ${token.enabled ? 'enabled' : 'disabled'}`,
      token
    });
  } catch (error) {
    console.error('Toggle pre-approved token error:', error);
    res.status(500).json({ error: 'Failed to toggle token' });
  }
});

router.delete('/tokens/pre-approved/:tokenId', async (req, res) => {
  try {
    const config = await SystemConfig.getConfig();
    config.preApprovedTokens.id(req.params.tokenId).remove();
    
    config.updatedBy = req.userId;
    config.updatedAt = new Date();
    await config.save();
    
    res.json({ message: 'Pre-approved token deleted successfully' });
  } catch (error) {
    console.error('Delete pre-approved token error:', error);
    res.status(500).json({ error: 'Failed to delete token' });
  }
});

// ========================================
// CUSTOMER MANAGEMENT
// ========================================

router.get('/customers', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const query = { role: 'customer' };
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const customers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    // Enrich with statistics
    const customersWithStats = await Promise.all(
      customers.map(async customer => {
        const walletCount = await Wallet.countDocuments({ userId: customer._id });
        const transactionCount = await Transaction.countDocuments({ userId: customer._id });
        
        return {
          ...customer.toObject(),
          stats: {
            ...customer.stats,
            walletCount,
            transactionCount
          }
        };
      })
    );
    
    res.json({
      customers: customersWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to get customers' });
  }
});

router.get('/customers/:customerId', async (req, res) => {
  try {
    const customer = await User.findById(req.params.customerId)
      .select('-password');
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const wallets = await Wallet.find({ userId: customer._id });
    const transactions = await Transaction.find({ userId: customer._id })
      .sort({ timestamp: -1 })
      .limit(20);
    
    const tokens = await CustomerTokenConfig.find({ userId: customer._id });
    
    res.json({
      customer,
      wallets,
      recentTransactions: transactions,
      tokens,
      gasTankConfig: customer.gasTankConfig
    });
  } catch (error) {
    console.error('Get customer details error:', error);
    res.status(500).json({ error: 'Failed to get customer details' });
  }
});

router.patch('/customers/:customerId/toggle', async (req, res) => {
  try {
    const customer = await User.findById(req.params.customerId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    customer.isActive = !customer.isActive;
    await customer.save();
    
    res.json({
      message: `Customer ${customer.isActive ? 'activated' : 'deactivated'}`,
      isActive: customer.isActive
    });
  } catch (error) {
    console.error('Toggle customer status error:', error);
    res.status(500).json({ error: 'Failed to toggle customer status' });
  }
});

// ========================================
// COMMISSION TRANSACTIONS
// ========================================

router.get('/commissions', async (req, res) => {
  try {
    const { limit = 50, offset = 0, network, startDate, endDate } = req.query;
    
    const query = {};
    
    if (network) {
      query.network = network.toUpperCase();
    }
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const commissions = await CommissionTransaction.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('userId', 'email firstName lastName companyName');
    
    const total = await CommissionTransaction.countDocuments(query);
    
    res.json({
      commissions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > (parseInt(offset) + parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({ error: 'Failed to get commission transactions' });
  }
});

router.get('/commissions/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await CommissionService.getAdminCommissionStats(start, end);
    
    res.json({ stats, period: { start, end } });
  } catch (error) {
    console.error('Get commission stats error:', error);
    res.status(500).json({ error: 'Failed to get commission statistics' });
  }
});

// ========================================
// TRANSACTIONS OVERVIEW
// ========================================

router.get('/transactions', async (req, res) => {
  try {
    const { limit = 50, offset = 0, network, status, userId } = req.query;
    
    const query = {};
    
    if (network) query.network = network.toUpperCase();
    if (status) query.status = status;
    if (userId) query.userId = userId;
    
    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('userId', 'email firstName lastName companyName')
      .populate('walletId', 'network address');
    
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
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

module.exports = router;