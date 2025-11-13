// backend/src/models/User.js - FIXED
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true
    // REMOVED: unique: true (causes issues with empty arrays)
  },
  name: { 
    type: String, 
    required: true 
  },
  permissions: [{
    type: String,
    enum: ['wallet:read', 'wallet:create', 'transaction:send', 'transaction:read']
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastUsed: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: Date
});

const gasTankConfigSchema = new mongoose.Schema({
  network: {
    type: String,
    required: true,
    enum: ['ETH', 'BSC', 'POLYGON', 'SOL', 'TRX']
  },
  enabled: {
    type: Boolean,
    default: false
  },
  address: String,
  privateKey: String,
  balance: {
    type: String,
    default: '0'
  },
  minBalance: {
    type: String,
    default: '0.1'
  },
  tokenFeeRate: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 10
  }
});

const customerStatsSchema = new mongoose.Schema({
  totalTransactions: { type: Number, default: 0 },
  totalVolume: { type: String, default: '0' },
  totalFeesEarned: { type: String, default: '0' },
  totalGasSpent: { type: String, default: '0' },
  lastTransactionDate: Date
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  companyName: String,
  website: String,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  apiKeys: [apiKeySchema],
  gasTankConfig: [gasTankConfigSchema],
  stats: {
    type: customerStatsSchema,
    default: () => ({})
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateEmailVerificationToken = function() {
  this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  return this.emailVerificationToken;
};

userSchema.methods.generatePasswordResetToken = function() {
  this.resetPasswordToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000;
  return this.resetPasswordToken;
};

userSchema.methods.generateApiKey = function(name, permissions = []) {
  const key = `wapi_${crypto.randomBytes(32).toString('hex')}`;
  
  this.apiKeys.push({
    key,
    name,
    permissions: permissions.length > 0 ? permissions : [
      'wallet:read',
      'wallet:create',
      'transaction:send',
      'transaction:read'
    ],
    isActive: true
  });
  
  return key;
};

userSchema.methods.revokeApiKey = function(keyId) {
  const apiKey = this.apiKeys.id(keyId);
  if (apiKey) {
    apiKey.isActive = false;
  }
};

userSchema.methods.updateApiKeyUsage = async function(key) {
  const apiKey = this.apiKeys.find(k => k.key === key);
  if (apiKey) {
    apiKey.lastUsed = new Date();
    await this.save();
  }
};

userSchema.methods.getGasTankConfig = function(network) {
  const networkUpper = network.toUpperCase();
  let config = this.gasTankConfig.find(g => g.network === networkUpper);
  
  if (!config) {
    config = {
      network: networkUpper,
      enabled: false,
      tokenFeeRate: 0.5
    };
    this.gasTankConfig.push(config);
  }
  
  return config;
};

userSchema.methods.updateGasTankConfig = async function(network, updates) {
  const networkUpper = network.toUpperCase();
  let config = this.gasTankConfig.find(g => g.network === networkUpper);
  
  if (!config) {
    config = { network: networkUpper };
    this.gasTankConfig.push(config);
    config = this.gasTankConfig[this.gasTankConfig.length - 1];
  }
  
  Object.assign(config, updates);
  await this.save();
  return config;
};

userSchema.methods.updateStats = async function(updates) {
  Object.assign(this.stats, updates);
  this.stats.lastTransactionDate = new Date();
  await this.save();
};

userSchema.methods.getStats = async function() {
  const Wallet = require('./Wallet');
  const Transaction = require('./Transaction');
  
  const walletCount = await Wallet.countDocuments({ userId: this._id });
  const transactionCount = await Transaction.countDocuments({ userId: this._id });
  
  return {
    wallets: walletCount,
    transactions: transactionCount,
    apiKeys: this.apiKeys.filter(k => k.isActive).length,
    memberSince: this.createdAt,
    ...this.stats.toObject()
  };
};

module.exports = mongoose.model('User', userSchema);