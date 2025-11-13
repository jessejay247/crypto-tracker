// ============================================
// backend/src/controllers/customerTokenController.js
// ============================================
const CustomerToken = require('../models/CustomerToken');

class CustomerTokenController {
  /**
   * Add token to customer dashboard
   */
  static async addToken(req, res) {
    try {
      const { name, symbol, network, contractAddress, decimals = 18, icon } = req.body;

      // Validate EVM network
      if (!['ETH', 'POLYGON', 'BSC'].includes(network.toUpperCase())) {
        return res.status(400).json({ error: 'Only ETH, POLYGON, and BSC networks support tokens' });
      }

      // Check if token already exists
      const existing = await CustomerToken.findOne({
        userId: req.userId,
        network: network.toUpperCase(),
        contractAddress: contractAddress.toLowerCase()
      });

      if (existing) {
        return res.status(400).json({ error: 'Token already added' });
      }

      const token = new CustomerToken({
        userId: req.userId,
        name,
        symbol: symbol.toUpperCase(),
        network: network.toUpperCase(),
        contractAddress: contractAddress.toLowerCase(),
        decimals,
        icon
      });

      await token.save();

      res.status(201).json({
        message: 'Token added successfully',
        token: {
          id: token._id,
          name: token.name,
          symbol: token.symbol,
          network: token.network,
          contractAddress: token.contractAddress,
          decimals: token.decimals
        }
      });
    } catch (error) {
      console.error('Add token error:', error);
      res.status(500).json({ error: 'Failed to add token', details: error.message });
    }
  }

  /**
   * Get all customer tokens
   */
  static async getTokens(req, res) {
    try {
      const { network } = req.query;
      
      const query = { userId: req.userId };
      if (network) {
        query.network = network.toUpperCase();
      }

      const tokens = await CustomerToken.find(query).sort({ addedAt: -1 });

      res.json({ tokens });
    } catch (error) {
      console.error('Get tokens error:', error);
      res.status(500).json({ error: 'Failed to get tokens' });
    }
  }

  /**
   * Toggle token enabled status
   */
  static async toggleToken(req, res) {
    try {
      const { tokenId } = req.params;

      const token = await CustomerToken.findOne({
        _id: tokenId,
        userId: req.userId
      });

      if (!token) {
        return res.status(404).json({ error: 'Token not found' });
      }

      token.enabled = !token.enabled;
      await token.save();

      res.json({
        message: `Token ${token.enabled ? 'enabled' : 'disabled'}`,
        token: {
          id: token._id,
          symbol: token.symbol,
          enabled: token.enabled
        }
      });
    } catch (error) {
      console.error('Toggle token error:', error);
      res.status(500).json({ error: 'Failed to toggle token' });
    }
  }

  /**
   * Remove token
   */
  static async removeToken(req, res) {
    try {
      const { tokenId } = req.params;

      const result = await CustomerToken.deleteOne({
        _id: tokenId,
        userId: req.userId
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Token not found' });
      }

      res.json({ message: 'Token removed successfully' });
    } catch (error) {
      console.error('Remove token error:', error);
      res.status(500).json({ error: 'Failed to remove token' });
    }
  }
}

module.exports = CustomerTokenController;