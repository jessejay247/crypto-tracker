// ============================================
// backend/src/models/SystemConfig.js - ENHANCED
// System-wide Configuration (Admin Panel)
// ============================================
const mongoose = require('mongoose');

// Commission configuration per network
const commissionAddressSchema = new mongoose.Schema({
  network: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['BTC', 'ETH', 'POLYGON', 'BSC', 'SOL', 'TRX', 'LTC', 'DOGE', 'DASH', 'XRP']
  },
  address: {
    type: String,
    default: ''
  },
  enabled: {
    type: Boolean,
    default: false
  }
});

// Pre-approved tokens that customers can enable
const preApprovedTokenSchema = new mongoose.Schema({
  network: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['ETH', 'BSC', 'POLYGON', 'SOL', 'TRX']
  },
  contractAddress: {
    type: String,
    required: true
  },
  name: String,
  symbol: String,
  decimals: Number,
  logo: String,
  enabled: {
    type: Boolean,
    default: true
  },
  verified: {
    type: Boolean,
    default: true
  }
});

const systemConfigSchema = new mongoose.Schema({
  // Native Transaction Commission (BTC, ETH, BNB, etc.)
  nativeCommissionRate: {
    type: Number,
    default: 0.5, // 0.5%
    min: 0,
    max: 10
  },
  
  // Token Transaction Commission (when gas tank is used)
  tokenCommissionRate: {
    type: Number,
    default: 0.3, // 0.3%
    min: 0,
    max: 10
  },
  
  // Whether to charge commission on token transactions without gas tank
  chargeTokenFeeWithoutGasTank: {
    type: Boolean,
    default: false // Don't charge if customer isn't using gas tank
  },
  
  // Commission addresses per network
  commissionAddresses: [commissionAddressSchema],
  
  // Pre-approved tokens
  preApprovedTokens: [preApprovedTokenSchema],
  
  // System settings
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  allowNewRegistrations: {
    type: Boolean,
    default: true
  },
  maxWalletsPerUser: {
    type: Number,
    default: 100
  },
  maxApiKeysPerUser: {
    type: Number,
    default: 10
  },
  
  // Rate limiting
  rateLimit: {
    transactionsPerHour: {
      type: Number,
      default: 100
    },
    walletsPerDay: {
      type: Number,
      default: 50
    }
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Singleton pattern - only one config document
systemConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    // Create default configuration
    config = await this.create({
      nativeCommissionRate: 0.5,
      tokenCommissionRate: 0.3,
      chargeTokenFeeWithoutGasTank: false,
      commissionAddresses: [
        { network: 'BTC', address: '', enabled: false },
        { network: 'ETH', address: '', enabled: false },
        { network: 'POLYGON', address: '', enabled: false },
        { network: 'BSC', address: '', enabled: false },
        { network: 'SOL', address: '', enabled: false },
        { network: 'TRX', address: '', enabled: false },
        { network: 'LTC', address: '', enabled: false },
        { network: 'DOGE', address: '', enabled: false },
        { network: 'XRP', address: '', enabled: false },
        
      ],
      preApprovedTokens: []
    });
  }
  return config;
};

// Update config
systemConfigSchema.statics.updateConfig = async function(updates, userId) {
  const config = await this.getConfig();
  Object.assign(config, updates);
  config.updatedAt = new Date();
  config.updatedBy = userId;
  await config.save();
  return config;
};

// Get commission address for network
systemConfigSchema.statics.getCommissionAddress = async function(network) {
  const config = await this.getConfig();
  const networkUpper = network.toUpperCase();
  const commissionConfig = config.commissionAddresses.find(
    addr => addr.network === networkUpper && addr.enabled
  );
  
  if (!commissionConfig || !commissionConfig.address) {
    return null;
  }
  
  return commissionConfig.address;
};

// Check if commission is enabled for network
systemConfigSchema.statics.isCommissionEnabled = async function(network) {
  const config = await this.getConfig();
  const networkUpper = network.toUpperCase();
  const commissionConfig = config.commissionAddresses.find(
    addr => addr.network === networkUpper && addr.enabled
  );
  
  return commissionConfig && commissionConfig.address && commissionConfig.address !== '';
};

// Add pre-approved token
systemConfigSchema.methods.addPreApprovedToken = function(tokenData) {
  // Check if already exists
  const exists = this.preApprovedTokens.find(
    t => t.contractAddress.toLowerCase() === tokenData.contractAddress.toLowerCase() &&
         t.network === tokenData.network.toUpperCase()
  );
  
  if (exists) {
    throw new Error('Token already exists in pre-approved list');
  }
  
  this.preApprovedTokens.push({
    network: tokenData.network.toUpperCase(),
    contractAddress: tokenData.contractAddress,
    name: tokenData.name,
    symbol: tokenData.symbol.toUpperCase(),
    decimals: tokenData.decimals,
    logo: tokenData.logo,
    enabled: true,
    verified: true
  });
};

// Get pre-approved tokens for network
systemConfigSchema.statics.getPreApprovedTokens = async function(network, enabledOnly = true) {
  const config = await this.getConfig();
  const networkUpper = network.toUpperCase();
  
  let tokens = config.preApprovedTokens.filter(t => t.network === networkUpper);
  
  if (enabledOnly) {
    tokens = tokens.filter(t => t.enabled);
  }
  
  return tokens;
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);