// ============================================
// backend/src/models/GasTank.js
// ============================================
const mongoose = require('mongoose');

const gasTankSchema = new mongoose.Schema({
  network: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true
  },
  address: {
    type: String,
    required: true
  },
  privateKey: {
    type: String,
    required: true
  },
  balance: {
    type: String,
    default: '0'
  },
  minBalance: {
    type: String,
    required: true
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

module.exports = mongoose.model('GasTank', gasTankSchema);
