// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate user with JWT
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Authenticate with API key
exports.authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const user = await User.findOne({ 'apiKeys.key': apiKey });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const keyData = user.apiKeys.find(k => k.key === apiKey);
    
    if (!keyData.isActive) {
      return res.status(401).json({ error: 'API key is inactive' });
    }

    // Update last used
    await user.updateApiKeyUsage(apiKey);

    req.userId = user._id;
    req.apiKey = keyData;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Admin only middleware
exports.adminOnly = async (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
