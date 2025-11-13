// ============================================
// backend/src/models/Transaction.js - ENHANCED
// ============================================
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // User/Customer who owns this transaction
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  
  // Network & Type
  network: {
    type: String,
    required: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['send', 'receive', 'internal'],
    required: true
  },
  
  // Transaction details
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  
  // Is this a token transaction?
  isTokenTransaction: {
    type: Boolean,
    default: false
  },
  
  // Token-specific fields
  tokenAddress: String,
  tokenSymbol: String,
  tokenDecimals: Number,
  
  // Transaction hash & details
  txHash: {
    type: String,
    required: true
  },
  blockNumber: Number,
  gasUsed: String,
  gasPrice: String,
  fee: String,
  
  // ========================================
  // ADMIN COMMISSION TRACKING
  // ========================================
  adminCommission: {
    applied: {
      type: Boolean,
      default: false
    },
    amount: String, // Commission amount deducted
    rate: Number, // Commission rate used (0.5% or 0.3%)
    address: String, // Admin commission address
    txHash: String // Separate transaction hash if commission sent separately
  },
  
  // ========================================
  // CUSTOMER FEE TRACKING (what customer charges their user)
  // ========================================
  customerFee: {
    applied: {
      type: Boolean,
      default: false
    },
    amount: String, // Fee customer charged their end user
    rate: Number // Customer's token fee rate
  },
  
  // ========================================
  // GAS TANK USAGE
  // ========================================
  gasTank: {
    used: {
      type: Boolean,
      default: false
    },
    amount: String, // Amount of native token used from gas tank
    network: String // Network where gas was sponsored
  },
  
  // Original amounts before fees
  originalAmount: String, // Amount before any fees
  netAmount: String, // Amount after all fees
  
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  confirmations: {
    type: Number,
    default: 0
  },
  error: String,
  
  // Additional metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    apiKeyUsed: String,
    note: String
  },
  
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
transactionSchema.index({ userId: 1, timestamp: -1 });
transactionSchema.index({ walletId: 1, timestamp: -1 });
transactionSchema.index({ txHash: 1 });
transactionSchema.index({ network: 1, status: 1 });
transactionSchema.index({ userId: 1, network: 1, isTokenTransaction: 1 });
transactionSchema.index({ 'adminCommission.applied': 1, timestamp: -1 });
transactionSchema.index({ 'gasTank.used': 1, timestamp: -1 });

// Virtual: Calculate total fees
transactionSchema.virtual('totalFees').get(function() {
  let total = 0;
  
  if (this.adminCommission.applied && this.adminCommission.amount) {
    total += parseFloat(this.adminCommission.amount);
  }
  
  if (this.customerFee.applied && this.customerFee.amount) {
    total += parseFloat(this.customerFee.amount);
  }
  
  return total.toString();
});

// Method: Mark as confirmed
transactionSchema.methods.markAsConfirmed = async function(confirmations = 1) {
  this.status = 'confirmed';
  this.confirmations = confirmations;
  await this.save();
};

// Method: Mark as failed
transactionSchema.methods.markAsFailed = async function(error) {
  this.status = 'failed';
  this.error = error;
  await this.save();
};

// Statics: Get customer's transaction stats
transactionSchema.statics.getCustomerStats = async function(userId, startDate, endDate) {
  const query = { userId };
  
  if (startDate && endDate) {
    query.timestamp = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalVolume: { $sum: { $toDouble: '$amount' } },
        totalFees: { $sum: { $toDouble: '$customerFee.amount' } },
        totalGasSpent: { $sum: { $toDouble: '$gasTank.amount' } }
      }
    }
  ]);
  
  return stats[0] || {
    totalTransactions: 0,
    totalVolume: 0,
    totalFees: 0,
    totalGasSpent: 0
  };
};

// Statics: Get admin commission stats
transactionSchema.statics.getAdminCommissionStats = async function(startDate, endDate) {
  const query = { 'adminCommission.applied': true };
  
  if (startDate && endDate) {
    query.timestamp = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$network',
        totalCommission: { $sum: { $toDouble: '$adminCommission.amount' } },
        transactionCount: { $sum: 1 }
      }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('Transaction', transactionSchema);