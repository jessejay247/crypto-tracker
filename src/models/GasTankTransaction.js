
// ============================================
// backend/src/models/GasTankTransaction.js
// ============================================
const mongoose = require('mongoose');

const gasTankTransactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  network: {
    type: String,
    required: true,
    uppercase: true
  },
  txHash: {
    type: String,
    required: true
  },
  gasUsed: {
    type: String,
    required: true
  },
  gasCost: {
    type: String,
    required: true
  },
  userAddress: String,
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes
gasTankTransactionSchema.index({ network: 1, timestamp: -1 });
gasTankTransactionSchema.index({ userId: 1 });

module.exports = mongoose.model('GasTankTransaction', gasTankTransactionSchema);
