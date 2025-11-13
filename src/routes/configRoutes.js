// src/routes/configRoutes.js - UPDATED
const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const SystemConfig = require('../models/SystemConfig');

// Get system configuration
router.get('/', authenticate, async (req, res) => {
  try {
    const config = await SystemConfig.getConfig();
    
    // Don't expose sensitive data to non-admins
    if (req.userRole !== 'admin') {
      return res.json({
        commissionRate: config.nativeCommissionRate,
        preApprovedTokens: (config.preApprovedTokens || []).filter(t => t.enabled), // Use preApprovedTokens
        maintenanceMode: config.maintenanceMode,
        allowNewRegistrations: config.allowNewRegistrations
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

// Get admin configuration
router.get('/admin/config', authenticate, adminOnly, async (req, res) => {
  try {
    const config = await SystemConfig.getConfig();
    res.json({ 
      config: {
        ...config.toObject(),
        preApprovedTokens: config.preApprovedTokens || [] // Use preApprovedTokens
      }
    });
  } catch (error) {
    console.error('Error getting admin config:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

// Update system configuration (admin only)
router.put('/', authenticate, adminOnly, async (req, res) => {
  try {
    const updates = req.body;
    const config = await SystemConfig.updateConfig(updates, req.userId);
    
    res.json({
      message: 'Configuration updated successfully',
      config
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Add pre-approved token (admin only) - UPDATED
router.post('/admin/tokens', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, symbol, network, contractAddress, decimals, icon } = req.body;

    if (!name || !symbol || !network || !contractAddress || !decimals) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const config = await SystemConfig.getConfig();
    
    // Use the model method to add token (it handles duplicates)
    config.addPreApprovedToken({
      network,
      contractAddress,
      name,
      symbol,
      decimals,
      logo: icon // Map icon to logo
    });

    config.updatedBy = req.userId;
    config.updatedAt = new Date();
    await config.save();

    res.json({
      message: 'Token added successfully',
      token: config.preApprovedTokens[config.preApprovedTokens.length - 1]
    });
  } catch (error) {
    console.error('Error adding token:', error);
    res.status(500).json({ error: error.message || 'Failed to add token' });
  }
});

// Update token (admin only) - UPDATED
router.patch('/tokens/:tokenId', authenticate, adminOnly, async (req, res) => {
  try {
    const config = await SystemConfig.getConfig();
    const token = config.preApprovedTokens.id(req.params.tokenId); // Use preApprovedTokens

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    Object.assign(token, req.body);
    config.updatedBy = req.userId;
    config.updatedAt = new Date();
    await config.save();

    res.json({
      message: 'Token updated successfully',
      token
    });
  } catch (error) {
    console.error('Error updating token:', error);
    res.status(500).json({ error: 'Failed to update token' });
  }
});

// Delete token (admin only) - UPDATED
router.delete('/tokens/:tokenId', authenticate, adminOnly, async (req, res) => {
  try {
    const config = await SystemConfig.getConfig();
    config.preApprovedTokens.pull(req.params.tokenId); // Use preApprovedTokens
    
    config.updatedBy = req.userId;
    config.updatedAt = new Date();
    await config.save();

    res.json({ message: 'Token removed successfully' });
  } catch (error) {
    console.error('Error deleting token:', error);
    res.status(500).json({ error: 'Failed to delete token' });
  }
});

module.exports = router;