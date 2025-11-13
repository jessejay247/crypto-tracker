// ============================================
// backend/src/models/CustomerToken.js
// Tokens that customers add to their dashboard
// ============================================
const mongoose = require('mongoose');

const customerTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  network: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['ETH', 'POLYGON', 'BSC']
  },
  contractAddress: {
    type: String,
    required: true
  },
  decimals: {
    type: Number,
    required: true,
    default: 18
  },
  enabled: {
    type: Boolean,
    default: true
  },
  icon: String,
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate tokens per user
customerTokenSchema.index({ userId: 1, network: 1, contractAddress: 1 }, { unique: true });

module.exports = mongoose.model('CustomerToken', customerTokenSchema);