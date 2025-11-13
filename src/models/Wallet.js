// ============================================
// backend/src/models/Wallet.js - FIXED
// ============================================
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  network: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['BTC', 'ETH', 'POLYGON', 'BSC', 'SOL', 'TRX', 'LTC', 'DOGE', 'DASH', 'ZEC', 'XMR', 'XRP']
  },
  environment: {
    type: String,
    required: true,
    enum: ['mainnet', 'testnet'],
    default: 'mainnet'
  },
  address: {
    type: String,
    required: true
  },
  privateKey: {
    type: String,
    required: true
  },
  publicKey: String,
  label: String,
  balance: {
    type: String,
    default: '0'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastBalanceUpdate: Date
});

// Compound indexes for efficient queries
walletSchema.index({ userId: 1, network: 1, environment: 1 });
walletSchema.index({ address: 1 });

// Virtual for display name
walletSchema.virtual('displayName').get(function() {
  return this.label || `${this.network} ${this.environment === 'testnet' ? '(Testnet)' : '(Mainnet)'}`;
});

module.exports = mongoose.model('Wallet', walletSchema);