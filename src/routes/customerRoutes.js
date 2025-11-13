// ============================================
// backend/src/routes/customerRoutes.js
// Customer Dashboard Routes
// ============================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const CustomerTokenService = require('../services/customerTokenService');
const GasTankService = require('../services/gasTankService');
const CommissionService = require('../services/commissionService');
const Transaction = require('../models/Transaction');

// All routes require authentication
router.use(authenticate);

// ========================================
// DASHBOARD OVERVIEW
// ========================================

router.get('/dashboard', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -apiKeys.key');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get statistics
    const stats = await user.getStats();
    
    // Get gas tank configurations
    const gasTanks = user.gasTankConfig || [];
    
    // Get recent transactions
    const recentTransactions = await Transaction.find({ userId: req.userId })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('network amount txHash timestamp status');
    
    res.json({
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
        memberSince: user.createdAt
      },
      stats,
      gasTanks: gasTanks.map(g => ({
        network: g.network,
        enabled: g.enabled,
        tokenFeeRate: g.tokenFeeRate,
        address: g.address
      })),
      recentTransactions
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// ========================================
// API KEY MANAGEMENT
// ========================================

router.get('/api-keys', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('apiKeys');
    
    // Don't send actual key values
    const keys = user.apiKeys.map(k => ({
      _id: k._id,
      name: k.name,
      permissions: k.permissions,
      isActive: k.isActive,
      lastUsed: k.lastUsed,
      createdAt: k.createdAt,
      keyPreview: k.key ? `${k.key.substring(0, 12)}...` : null
    }));
    
    res.json({ apiKeys: keys });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

router.post('/api-keys', async (req, res) => {
  try {
    const { name, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'API key name is required' });
    }
    
    const user = await User.findById(req.userId);
    
    // Check limit
    const activeKeys = user.apiKeys.filter(k => k.isActive).length;
    if (activeKeys >= 10) {
      return res.status(400).json({ error: 'Maximum API key limit reached (10)' });
    }
    
    const apiKey = user.generateApiKey(name, permissions);
    await user.save();
    
    res.status(201).json({
      message: 'API key generated successfully',
      key: apiKey,
      warning: 'Store this key securely. You will not be able to see it again.'
    });
  } catch (error) {
    console.error('Generate API key error:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

router.delete('/api-keys/:keyId', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.revokeApiKey(req.params.keyId);
    await user.save();
    
    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// ========================================
// GAS TANK MANAGEMENT
// ========================================

router.get('/gas-tanks', async (req, res) => {
  try {
    const configs = await GasTankService.getAllGasTankConfigs(req.userId);
    
    // Get balances for each
    const gasTanksWithBalances = await Promise.all(
      configs.map(async config => {
        const balance = await GasTankService.getBalance(req.userId, config.network);
        return {
          network: config.network,
          enabled: config.enabled,
          address: config.address,
          balance,
          minBalance: config.minBalance,
          tokenFeeRate: config.tokenFeeRate,
          needsRefill: parseFloat(balance) < parseFloat(config.minBalance)
        };
      })
    );
    
    res.json({ gasTanks: gasTanksWithBalances });
  } catch (error) {
    console.error('Get gas tanks error:', error);
    res.status(500).json({ error: 'Failed to get gas tanks' });
  }
});

router.post('/gas-tanks/:network/setup', async (req, res) => {
  try {
    const { network } = req.params;
    const { privateKey, minBalance } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    const config = await GasTankService.setupGasTank(
      req.userId,
      network,
      privateKey,
      minBalance || '0.1'
    );
    
    res.json({
      message: 'Gas tank setup successfully',
      config: {
        network: config.network,
        address: config.address,
        enabled: config.enabled,
        tokenFeeRate: config.tokenFeeRate
      }
    });
  } catch (error) {
    console.error('Setup gas tank error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/gas-tanks/:network/toggle', async (req, res) => {
  try {
    const { network } = req.params;
    const { enabled } = req.body;
    
    const config = await GasTankService.toggleGasTank(req.userId, network, enabled);
    
    res.json({
      message: `Gas tank ${enabled ? 'enabled' : 'disabled'}`,
      config: {
        network: config.network,
        enabled: config.enabled
      }
    });
  } catch (error) {
    console.error('Toggle gas tank error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/gas-tanks/:network/fee-rate', async (req, res) => {
  try {
    const { network } = req.params;
    const { feeRate } = req.body;
    
    if (feeRate === undefined) {
      return res.status(400).json({ error: 'Fee rate is required' });
    }
    
    const config = await GasTankService.updateTokenFeeRate(req.userId, network, feeRate);
    
    res.json({
      message: 'Token fee rate updated',
      config: {
        network: config.network,
        tokenFeeRate: config.tokenFeeRate
      }
    });
  } catch (error) {
    console.error('Update fee rate error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/gas-tanks/stats', async (req, res) => {
  try {
    const stats = await GasTankService.getCustomerGasStats(req.userId);
    res.json({ stats });
  } catch (error) {
    console.error('Get gas stats error:', error);
    res.status(500).json({ error: 'Failed to get gas tank statistics' });
  }
});

// ========================================
// TOKEN MANAGEMENT
// ========================================

router.get('/tokens', async (req, res) => {
  try {
    const { network } = req.query;
    
    if (network) {
      const tokens = await CustomerTokenService.getCustomerTokens(req.userId, network);
      res.json({ tokens });
    } else {
      const allTokens = await CustomerTokenService.getAllCustomerTokens(req.userId);
      res.json({ tokens: allTokens });
    }
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ error: 'Failed to get tokens' });
  }
});

router.get('/tokens/pre-approved', async (req, res) => {
  try {
    const { network } = req.query;
    
    if (!network) {
      return res.status(400).json({ error: 'Network parameter is required' });
    }
    
    const tokens = await CustomerTokenService.getPreApprovedTokens(network);
    res.json({ tokens });
  } catch (error) {
    console.error('Get pre-approved tokens error:', error);
    res.status(500).json({ error: 'Failed to get pre-approved tokens' });
  }
});

router.post('/tokens', async (req, res) => {
  try {
    const { network, contractAddress, name, symbol, decimals, logo } = req.body;
    
    if (!network || !contractAddress || !name || !symbol || decimals === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: network, contractAddress, name, symbol, decimals' 
      });
    }
    
    const token = await CustomerTokenService.addToken(req.userId, {
      network,
      contractAddress,
      name,
      symbol,
      decimals,
      logo
    });
    
    res.status(201).json({
      message: 'Token added successfully',
      token
    });
  } catch (error) {
    console.error('Add token error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/tokens/import/:network/:contractAddress', async (req, res) => {
  try {
    const { network, contractAddress } = req.params;
    
    const token = await CustomerTokenService.importPreApprovedToken(
      req.userId,
      network,
      contractAddress
    );
    
    res.status(201).json({
      message: 'Token imported successfully',
      token
    });
  } catch (error) {
    console.error('Import token error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/tokens/:tokenId/toggle', async (req, res) => {
  try {
    const token = await CustomerTokenService.toggleToken(req.userId, req.params.tokenId);
    
    res.json({
      message: `Token ${token.enabled ? 'enabled' : 'disabled'}`,
      token
    });
  } catch (error) {
    console.error('Toggle token error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/tokens/:tokenId', async (req, res) => {
  try {
    const result = await CustomerTokenService.deleteToken(req.userId, req.params.tokenId);
    res.json(result);
  } catch (error) {
    console.error('Delete token error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// ANALYTICS & EARNINGS
// ========================================

router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Transaction stats
    const transactionStats = await Transaction.getCustomerStats(req.userId, start, end);
    
    // Fee earnings
    const feeStats = await CommissionService.getCustomerFeeStats(req.userId, start, end);
    
    // Gas usage
    const gasStats = await GasTankService.getCustomerGasStats(req.userId);
    
    res.json({
      period: { start, end },
      transactions: transactionStats,
      feeEarnings: feeStats,
      gasUsage: gasStats
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

module.exports = router;