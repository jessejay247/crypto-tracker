
// ============================================
// backend/src/models/CommissionTransaction.js
// ============================================
const mongoose = require('mongoose');

const commissionTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  network: {
    type: String,
    required: true,
    uppercase: true
  },
  originalTxHash: {
    type: String,
    required: true
  },
  commissionTxHash: String,
  commissionAmount: {
    type: String,
    required: true
  },
  commissionAddress: {
    type: String,
    required: true
  },
  commissionRate: Number,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes
commissionTransactionSchema.index({ userId: 1, timestamp: -1 });
commissionTransactionSchema.index({ network: 1 });
commissionTransactionSchema.index({ originalTxHash: 1 });

module.exports = mongoose.model('CommissionTransaction', commissionTransactionSchema);
