// ============================================
// backend/src/services/gasTankService.js - ENHANCED
// Customer-specific gas tank management
// ============================================
const User = require('../models/User');
const GasTankTransaction = require('../models/GasTankTransaction');
const { ethers } = require('ethers');
const providers = require('../config/providers');

class GasTankService {
  /**
   * Setup gas tank for customer
   */
  static async setupGasTank(userId, network, privateKey, minBalance) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const networkUpper = network.toUpperCase();
    
    // Validate network
    const supportedNetworks = ['ETH', 'BSC', 'POLYGON', 'SOL', 'TRX'];
    if (!supportedNetworks.includes(networkUpper)) {
      throw new Error(`Gas tank not supported for ${network}`);
    }
    
    // Derive address from private key
    let address;
    if (['ETH', 'BSC', 'POLYGON'].includes(networkUpper)) {
      const wallet = new ethers.Wallet(privateKey);
      address = wallet.address;
    } else if (networkUpper === 'SOL') {
      // Solana address derivation would go here
      address = 'SOL_ADDRESS_PLACEHOLDER';
    } else if (networkUpper === 'TRX') {
      // Tron address derivation would go here
      address = 'TRX_ADDRESS_PLACEHOLDER';
    }
    
    // Update user's gas tank config
    await user.updateGasTankConfig(networkUpper, {
      enabled: true,
      address,
      privateKey,
      minBalance: minBalance.toString(),
      tokenFeeRate: 0.5 // Default fee rate
    });
    
    return user.getGasTankConfig(networkUpper);
  }
  
  /**
   * Get customer's gas tank configuration
   */
  static async getGasTankConfig(userId, network) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.getGasTankConfig(network);
  }
  
  /**
   * Get all gas tank configurations for customer
   */
  static async getAllGasTankConfigs(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.gasTankConfig || [];
  }
  
  /**
   * Enable/disable gas tank for network
   */
  static async toggleGasTank(userId, network, enabled) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const config = user.getGasTankConfig(network);
    
    if (!config.address || !config.privateKey) {
      throw new Error('Gas tank not set up for this network. Please set up first.');
    }
    
    await user.updateGasTankConfig(network, { enabled });
    
    return user.getGasTankConfig(network);
  }
  
  /**
   * Update token fee rate
   */
  static async updateTokenFeeRate(userId, network, feeRate) {
    if (feeRate < 0 || feeRate > 10) {
      throw new Error('Fee rate must be between 0% and 10%');
    }
    
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    await user.updateGasTankConfig(network, { tokenFeeRate: feeRate });
    
    return user.getGasTankConfig(network);
  }
  
  /**
   * Get gas tank balance
   */
  static async getBalance(userId, network) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const config = user.getGasTankConfig(network);
    
    if (!config.address) {
      return '0';
    }
    
    const networkUpper = network.toUpperCase();
    
    try {
      if (['ETH', 'BSC', 'POLYGON'].includes(networkUpper)) {
        const provider = this.getProvider(networkUpper);
        const balance = await provider.getBalance(config.address);
        return ethers.formatEther(balance);
      } else if (networkUpper === 'SOL') {
        // Solana balance check
        return '0'; // Implement Solana balance check
      } else if (networkUpper === 'TRX') {
        // Tron balance check
        return '0'; // Implement Tron balance check
      }
    } catch (error) {
      console.error(`Error getting gas tank balance for ${network}:`, error);
      return '0';
    }
  }
  
  /**
   * Check if gas tank has sufficient balance
   */
  static async hasSufficientBalance(userId, network) {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }
    
    const config = user.getGasTankConfig(network);
    
    if (!config.enabled) {
      return false;
    }
    
    const balance = await this.getBalance(userId, network);
    const minBalance = parseFloat(config.minBalance || '0.1');
    
    return parseFloat(balance) >= minBalance;
  }
  
  /**
   * Sponsor gas for token transaction
   */
  static async sponsorGas(userId, network, tokenContract, estimatedGas) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const config = user.getGasTankConfig(network);
    
    if (!config.enabled) {
      throw new Error('Gas tank is not enabled for this network');
    }
    
    if (!config.address || !config.privateKey) {
      throw new Error('Gas tank not configured');
    }
    
    // Check balance
    const hasSufficient = await this.hasSufficientBalance(userId, network);
    if (!hasSufficient) {
      throw new Error('Insufficient gas tank balance. Please fund your gas tank.');
    }
    
    const networkUpper = network.toUpperCase();
    
    if (['ETH', 'BSC', 'POLYGON'].includes(networkUpper)) {
      return await this.sponsorEVMGas(userId, networkUpper, config, estimatedGas);
    } else if (networkUpper === 'SOL') {
      return await this.sponsorSOLGas(userId, config, estimatedGas);
    } else if (networkUpper === 'TRX') {
      return await this.sponsorTRONGas(userId, config, estimatedGas);
    }
    
    throw new Error(`Gas sponsorship not implemented for ${network}`);
  }
  
  /**
   * Sponsor gas for EVM networks
   */
  static async sponsorEVMGas(userId, network, config, estimatedGas) {
    const provider = this.getProvider(network);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    
    const feeData = await provider.getFeeData();
    const gasCost = BigInt(estimatedGas) * feeData.gasPrice;
    
    // Check if gas tank has enough
    const balance = await provider.getBalance(config.address);
    if (balance < gasCost) {
      throw new Error(`Insufficient gas tank balance. Need ${ethers.formatEther(gasCost)} ${network}, have ${ethers.formatEther(balance)}`);
    }
    
    // Record gas usage
    await this.recordGasUsage(userId, network, ethers.formatEther(gasCost));
    
    return {
      gasProvided: ethers.formatEther(gasCost),
      network,
      gasTankAddress: config.address
    };
  }
  
  /**
   * Sponsor gas for Solana
   */
  static async sponsorSOLGas(userId, config, estimatedGas) {
    // Implement Solana gas sponsorship
    const gasAmount = '0.000005'; // Typical SOL fee
    
    await this.recordGasUsage(userId, 'SOL', gasAmount);
    
    return {
      gasProvided: gasAmount,
      network: 'SOL',
      gasTankAddress: config.address
    };
  }
  
  /**
   * Sponsor gas for Tron
   */
  static async sponsorTRONGas(userId, config, estimatedGas) {
    // Implement Tron gas sponsorship (energy/bandwidth)
    const gasAmount = '10'; // Typical TRX for energy
    
    await this.recordGasUsage(userId, 'TRX', gasAmount);
    
    return {
      gasProvided: gasAmount,
      network: 'TRX',
      gasTankAddress: config.address
    };
  }
  
  /**
   * Record gas usage
   */
  static async recordGasUsage(userId, network, amount) {
    const transaction = new GasTankTransaction({
      userId: userId.toString(),
      network: network.toUpperCase(),
      txHash: `gas_${Date.now()}`, // Placeholder
      gasUsed: amount,
      gasCost: amount,
      timestamp: new Date()
    });
    
    await transaction.save();
    
    // Update user stats
    const user = await User.findById(userId);
    if (user && user.stats) {
      const currentGasSpent = parseFloat(user.stats.totalGasSpent || '0');
      user.stats.totalGasSpent = (currentGasSpent + parseFloat(amount)).toString();
      await user.save();
    }
  }
  
  /**
   * Get gas tank statistics for customer
   */
  static async getCustomerGasStats(userId, network = null) {
    const query = { userId: userId.toString() };
    
    if (network) {
      query.network = network.toUpperCase();
    }
    
    const stats = await GasTankTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$network',
          totalTransactions: { $sum: 1 },
          totalGasSpent: { $sum: { $toDouble: '$gasCost' } }
        }
      }
    ]);
    
    return stats;
  }
  
  /**
   * Get provider for EVM network
   */
  static getProvider(network) {
    const networkMap = {
      'ETH': providers.testnet.eth,
      'POLYGON': providers.testnet.polygon,
      'BSC': providers.testnet.bsc
    };
    
    return networkMap[network.toUpperCase()];
  }
}

module.exports = GasTankService;