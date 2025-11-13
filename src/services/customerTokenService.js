// ============================================
// backend/src/services/customerTokenService.js
// Manages customer's token configurations
// ============================================
const CustomerTokenConfig = require('../models/CustomerTokenConfig');
const SystemConfig = require('../models/SystemConfig');
const { ethers } = require('ethers');

class CustomerTokenService {
  /**
   * Add a new token for customer
   */
  static async addToken(userId, tokenData) {
    const { network, contractAddress, name, symbol, decimals, logo } = tokenData;
    
    // Validate network
    const supportedNetworks = ['ETH', 'BSC', 'POLYGON', 'SOL', 'TRX'];
    if (!supportedNetworks.includes(network.toUpperCase())) {
      throw new Error(`Network ${network} is not supported for tokens`);
    }
    
    // Validate contract address format
    this.validateContractAddress(network, contractAddress);
    
    // Check if token already exists for this customer
    const exists = await CustomerTokenConfig.tokenExists(userId, network, contractAddress);
    if (exists) {
      throw new Error('Token already exists in your configuration');
    }
    
    // Validate decimals
    if (decimals < 0 || decimals > 18) {
      throw new Error('Decimals must be between 0 and 18');
    }
    
    // Create token configuration
    const token = new CustomerTokenConfig({
      userId,
      network: network.toUpperCase(),
      contractAddress: contractAddress.toLowerCase(),
      name,
      symbol: symbol.toUpperCase(),
      decimals,
      logo,
      enabled: true,
      verified: false // Only admin can mark as verified
    });
    
    await token.save();
    return token;
  }
  
  /**
   * Validate contract address based on network
   */
  static validateContractAddress(network, address) {
    const networkUpper = network.toUpperCase();
    
    if (['ETH', 'BSC', 'POLYGON'].includes(networkUpper)) {
      // EVM networks - validate Ethereum address
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid EVM contract address');
      }
    } else if (networkUpper === 'SOL') {
      // Solana - validate base58 address (basic check)
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
        throw new Error('Invalid Solana token mint address');
      }
    } else if (networkUpper === 'TRX') {
      // Tron - validate Tron address
      if (!address.startsWith('T') || address.length !== 34) {
        throw new Error('Invalid Tron contract address');
      }
    }
    
    return true;
  }
  
  /**
   * Get customer's tokens for a network
   */
  static async getCustomerTokens(userId, network, enabledOnly = false) {
    return await CustomerTokenConfig.getCustomerTokens(userId, network, enabledOnly);
  }
  
  /**
   * Get all customer's tokens across all networks
   */
  static async getAllCustomerTokens(userId, enabledOnly = false) {
    const query = { userId };
    if (enabledOnly) {
      query.enabled = true;
    }
    
    const tokens = await CustomerTokenConfig.find(query).sort({ network: 1, symbol: 1 });
    
    // Group by network
    const grouped = {};
    tokens.forEach(token => {
      if (!grouped[token.network]) {
        grouped[token.network] = [];
      }
      grouped[token.network].push(token);
    });
    
    return grouped;
  }
  
  /**
   * Toggle token enabled status
   */
  static async toggleToken(userId, tokenId) {
    const token = await CustomerTokenConfig.findOne({ _id: tokenId, userId });
    
    if (!token) {
      throw new Error('Token not found');
    }
    
    token.enabled = !token.enabled;
    await token.save();
    
    return token;
  }
  
  /**
   * Update token details
   */
  static async updateToken(userId, tokenId, updates) {
    const token = await CustomerTokenConfig.findOne({ _id: tokenId, userId });
    
    if (!token) {
      throw new Error('Token not found');
    }
    
    // Only allow updating certain fields
    const allowedUpdates = ['name', 'logo', 'enabled'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        token[key] = updates[key];
      }
    });
    
    await token.save();
    return token;
  }
  
  /**
   * Delete token
   */
  static async deleteToken(userId, tokenId) {
    const result = await CustomerTokenConfig.deleteOne({ _id: tokenId, userId });
    
    if (result.deletedCount === 0) {
      throw new Error('Token not found or already deleted');
    }
    
    return { success: true, message: 'Token deleted successfully' };
  }
  
  /**
   * Get pre-approved tokens from system config
   */
  static async getPreApprovedTokens(network) {
    return await SystemConfig.getPreApprovedTokens(network, true);
  }
  
  /**
   * Import pre-approved token to customer's config
   */
  static async importPreApprovedToken(userId, network, contractAddress) {
    const preApproved = await SystemConfig.getPreApprovedTokens(network, false);
    
    const token = preApproved.find(
      t => t.contractAddress.toLowerCase() === contractAddress.toLowerCase()
    );
    
    if (!token) {
      throw new Error('Token not found in pre-approved list');
    }
    
    // Check if already exists
    const exists = await CustomerTokenConfig.tokenExists(userId, network, contractAddress);
    if (exists) {
      throw new Error('Token already exists in your configuration');
    }
    
    // Create customer token config from pre-approved
    const customerToken = new CustomerTokenConfig({
      userId,
      network: token.network,
      contractAddress: token.contractAddress.toLowerCase(),
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      logo: token.logo,
      enabled: true,
      verified: true // Pre-approved tokens are verified
    });
    
    await customerToken.save();
    return customerToken;
  }
  
  /**
   * Update token statistics after transaction
   */
  static async updateTokenStats(userId, network, contractAddress, volumeToAdd) {
    await CustomerTokenConfig.updateTokenStats(userId, network, contractAddress, volumeToAdd);
  }
  
  /**
   * Get token details (verify it exists in customer's config)
   */
  static async getTokenDetails(userId, network, contractAddress) {
    const token = await CustomerTokenConfig.findOne({
      userId,
      network: network.toUpperCase(),
      contractAddress: contractAddress.toLowerCase(),
      enabled: true
    });
    
    if (!token) {
      throw new Error('Token not found in your configuration or is disabled');
    }
    
    return token;
  }
  
  /**
   * Verify token exists on blockchain (basic check)
   */
  static async verifyTokenOnChain(network, contractAddress) {
    // This would need proper implementation with blockchain providers
    // For now, just validate address format
    try {
      this.validateContractAddress(network, contractAddress);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = CustomerTokenService;