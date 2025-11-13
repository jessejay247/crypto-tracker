// ============================================
// backend/src/models/CustomerTokenConfig.js
// Customer's Supported Tokens Configuration
// ============================================
const mongoose = require('mongoose');

const customerTokenConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  name: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  decimals: {
    type: Number,
    required: true,
    min: 0,
    max: 18
  },
  logo: String, // URL to token logo
  
  // Token status
  enabled: {
    type: Boolean,
    default: true
  },
  verified: {
    type: Boolean,
    default: false // Admin can verify popular tokens
  },
  
  // Statistics
  totalTransactions: {
    type: Number,
    default: 0
  },
  totalVolume: {
    type: String,
    default: '0'
  },
  lastUsed: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
customerTokenConfigSchema.index({ userId: 1, network: 1 });
customerTokenConfigSchema.index({ userId: 1, contractAddress: 1, network: 1 }, { unique: true });
customerTokenConfigSchema.index({ network: 1, enabled: 1 });

// Update timestamp on save
customerTokenConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Statics: Get customer's tokens for a network
customerTokenConfigSchema.statics.getCustomerTokens = async function(userId, network, enabledOnly = false) {
  const query = {
    userId,
    network: network.toUpperCase()
  };
  
  if (enabledOnly) {
    query.enabled = true;
  }
  
  return await this.find(query).sort({ symbol: 1 });
};

// Statics: Check if token exists for customer
customerTokenConfigSchema.statics.tokenExists = async function(userId, network, contractAddress) {
  const count = await this.countDocuments({
    userId,
    network: network.toUpperCase(),
    contractAddress: contractAddress.toLowerCase()
  });
  
  return count > 0;
};

// Statics: Update token statistics
customerTokenConfigSchema.statics.updateTokenStats = async function(userId, network, contractAddress, volumeToAdd) {
  await this.updateOne(
    {
      userId,
      network: network.toUpperCase(),
      contractAddress: contractAddress.toLowerCase()
    },
    {
      $inc: { totalTransactions: 1 },
      $set: { 
        lastUsed: new Date(),
        totalVolume: volumeToAdd // This should be calculated properly
      }
    }
  );
};

module.exports = mongoose.model('CustomerTokenConfig', customerTokenConfigSchema);