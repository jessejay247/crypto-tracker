// src/routes/apiKeyRoutes.js (or add to authRoutes.js)
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');

// Generate new API key
router.post('/api-keys', authenticate, async (req, res) => {
  try {
    const { name, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'API key name is required' });
    }

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check API key limit (e.g., max 10 keys per user)
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
    console.error('Error generating API key:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// Get all API keys for user
router.get('/api-keys', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('apiKeys');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't send the actual key values
    const keys = user.apiKeys.map(k => ({
      _id: k._id,
      name: k.name,
      permissions: k.permissions,
      isActive: k.isActive,
      lastUsed: k.lastUsed,
      createdAt: k.createdAt,
      expiresAt: k.expiresAt,
      keyPreview: k.key ? `${k.key.substring(0, 12)}...` : null
    }));

    res.json({ apiKeys: keys });
  } catch (error) {
    console.error('Error getting API keys:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

// Revoke API key
router.delete('/api-keys/:keyId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.revokeApiKey(req.params.keyId);
    await user.save();

    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// Update API key (rename or change permissions)
router.patch('/api-keys/:keyId', authenticate, async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const apiKey = user.apiKeys.id(req.params.keyId);
    
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    if (name) apiKey.name = name;
    if (permissions) apiKey.permissions = permissions;

    await user.save();

    res.json({ 
      message: 'API key updated successfully',
      apiKey: {
        _id: apiKey._id,
        name: apiKey.name,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive
      }
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

module.exports = router;
