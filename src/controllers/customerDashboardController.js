const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

class CustomerDashboardController {
  static async getDashboard(req, res) {
    try {
      const user = await User.findById(req.userId).select('-password');
      
      const walletCount = await Wallet.countDocuments({ userId: req.userId });
      const transactionCount = await Transaction.countDocuments({ userId: req.userId });
      
      const recentTransactions = await Transaction.find({ userId: req.userId })
        .sort({ timestamp: -1 })
        .limit(10)
        .select('network amount txHash status timestamp');

      res.json({
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        stats: {
          wallets: walletCount,
          transactions: transactionCount,
          totalFeesEarned: '0.00',
          totalGasSpent: '0.0000'
        },
        recentTransactions
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to load dashboard' });
    }
  }
}

module.exports = CustomerDashboardController;