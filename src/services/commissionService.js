// ============================================
// backend/src/services/commissionService.js - ENHANCED
// Handles both Admin and Customer fee calculations
// ============================================
const SystemConfig = require('../models/SystemConfig');
const CommissionTransaction = require('../models/CommissionTransaction');
const User = require('../models/User');
const { ethers } = require('ethers');

class CommissionService {
  /**
   * Calculate all fees for a transaction
   * Returns complete fee breakdown
   */
  static async calculateTransactionFees(userId, network, amount, isTokenTransaction, gasTankUsed) {
    const config = await SystemConfig.getConfig();
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const networkUpper = network.toUpperCase();
    let amountNum = parseFloat(amount);
    
    // Initialize fee structure
    const feeBreakdown = {
      originalAmount: amountNum,
      adminCommission: {
        enabled: false,
        amount: 0,
        rate: 0,
        address: null
      },
      customerFee: {
        enabled: false,
        amount: 0,
        rate: 0
      },
      netAmount: amountNum,
      totalFees: 0
    };
    
    // ========================================
    // ADMIN COMMISSION CALCULATION
    // ========================================
    
    // Check if admin commission is enabled for this network
    const commissionAddress = await SystemConfig.getCommissionAddress(networkUpper);
    const commissionEnabled = await SystemConfig.isCommissionEnabled(networkUpper);
    
    if (commissionEnabled && commissionAddress) {
      let adminRate = 0;
      
      if (isTokenTransaction) {
        // Token transaction with gas tank = charge commission
        if (gasTankUsed) {
          adminRate = config.tokenCommissionRate;
        } else if (config.chargeTokenFeeWithoutGasTank) {
          // Only if admin enabled charging without gas tank
          adminRate = config.tokenCommissionRate;
        }
      } else {
        // Native transaction - always charge commission
        adminRate = config.nativeCommissionRate;
      }
      
      if (adminRate > 0) {
        const adminCommissionAmount = (amountNum * (adminRate / 100));
        
        feeBreakdown.adminCommission = {
          enabled: true,
          amount: adminCommissionAmount,
          rate: adminRate,
          address: commissionAddress
        };
        
        feeBreakdown.netAmount -= adminCommissionAmount;
        feeBreakdown.totalFees += adminCommissionAmount;
      }
    }
    
    // ========================================
    // CUSTOMER FEE CALCULATION (Token transactions with gas tank)
    // ========================================
    
    if (isTokenTransaction && gasTankUsed) {
      const gasTankConfig = user.getGasTankConfig(networkUpper);
      
      if (gasTankConfig && gasTankConfig.enabled && gasTankConfig.tokenFeeRate > 0) {
        const customerFeeAmount = (amountNum * (gasTankConfig.tokenFeeRate / 100));
        
        feeBreakdown.customerFee = {
          enabled: true,
          amount: customerFeeAmount,
          rate: gasTankConfig.tokenFeeRate
        };
        
        feeBreakdown.netAmount -= customerFeeAmount;
        feeBreakdown.totalFees += customerFeeAmount;
      }
    }
    
    return feeBreakdown;
  }
  
  /**
   * Get commission address for a specific network
   */
  static async getCommissionAddress(network) {
    return await SystemConfig.getCommissionAddress(network);
  }
  
  /**
   * Check if commission is enabled for network
   */
  static async isCommissionEnabled(network) {
    return await SystemConfig.isCommissionEnabled(network);
  }
  
  /**
   * Record commission transaction in database
   */
  static async recordCommission(data) {
    const commission = new CommissionTransaction({
      userId: data.userId,
      network: data.network,
      originalTxHash: data.txHash,
      commissionTxHash: data.commissionTxHash,
      commissionAmount: data.commissionAmount.toString(),
      commissionAddress: data.commissionAddress,
      commissionRate: data.commissionRate,
      status: data.status || 'completed',
      timestamp: new Date()
    });
    
    await commission.save();
    return commission;
  }
  
  /**
   * Process native transaction with commission
   * Handles sending commission to admin address
   */
  static async processNativeTransaction(network, fromPrivateKey, toAddress, amount, feeBreakdown) {
    // The service calling this should:
    // 1. Send net amount to recipient
    // 2. Send commission amount to admin address (if enabled)
    // 3. Record both transactions
    
    return {
      recipientAmount: feeBreakdown.netAmount,
      commissionAmount: feeBreakdown.adminCommission.amount,
      commissionAddress: feeBreakdown.adminCommission.address,
      shouldSendCommission: feeBreakdown.adminCommission.enabled
    };
  }
  
  /**
   * Process token transaction with fees
   * Handles both admin commission and customer fees
   */
  static async processTokenTransaction(userId, network, tokenAddress, amount, feeBreakdown) {
    const user = await User.findById(userId);
    const gasTankConfig = user.getGasTankConfig(network);
    
    return {
      recipientAmount: feeBreakdown.netAmount,
      customerFeeAmount: feeBreakdown.customerFee.amount,
      adminCommissionAmount: feeBreakdown.adminCommission.amount,
      adminCommissionAddress: feeBreakdown.adminCommission.address,
      customerFeeRate: gasTankConfig?.tokenFeeRate || 0,
      shouldChargeAdminCommission: feeBreakdown.adminCommission.enabled,
      shouldChargeCustomerFee: feeBreakdown.customerFee.enabled
    };
  }
  
  /**
   * Get customer's fee earnings statistics
   */
  static async getCustomerFeeStats(userId, startDate, endDate) {
    const query = {
      userId,
      'customerFee.applied': true
    };
    
    if (startDate && endDate) {
      query.timestamp = { $gte: startDate, $lte: endDate };
    }
    
    const Transaction = require('../models/Transaction');
    
    const stats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$network',
          totalFees: { $sum: { $toDouble: '$customerFee.amount' } },
          transactionCount: { $sum: 1 }
        }
      }
    ]);
    
    return stats;
  }
  
  /**
   * Get admin commission statistics
   */
  static async getAdminCommissionStats(startDate, endDate) {
    const query = {};
    
    if (startDate && endDate) {
      query.timestamp = { $gte: startDate, $lte: endDate };
    }
    
    const stats = await CommissionTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$network',
          totalCommission: { $sum: { $toDouble: '$commissionAmount' } },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $project: {
          network: '$_id',
          totalCommission: 1,
          transactionCount: 1,
          _id: 0
        }
      }
    ]);
    
    return stats;
  }
  
  /**
   * Calculate total admin earnings
   */
  static async getTotalAdminEarnings() {
    const stats = await CommissionTransaction.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: '$commissionAmount' } },
          count: { $sum: 1 }
        }
      }
    ]);
    
    return stats[0] || { total: 0, count: 0 };
  }
}

module.exports = CommissionService;