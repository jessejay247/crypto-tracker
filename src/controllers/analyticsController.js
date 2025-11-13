const Transaction = require('../models/Transaction');

class AnalyticsController {
  static async getAnalytics(req, res) {
    try {
      // Get last 7 days of transaction data
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const transactions = await Transaction.find({
        userId: req.userId,
        timestamp: { $gte: sevenDaysAgo }
      });

      // Transaction volume by day
      const volumeByDay = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayKey = date.toISOString().split('T')[0];
        volumeByDay[dayKey] = 0;
      }

      transactions.forEach(tx => {
        const dayKey = tx.timestamp.toISOString().split('T')[0];
        if (volumeByDay[dayKey] !== undefined) {
          volumeByDay[dayKey]++;
        }
      });

      const transactionVolume = Object.keys(volumeByDay).reverse().map((date, index) => ({
        label: `Day ${index + 1}`,
        count: volumeByDay[date]
      }));

      // Fees by network
      const feesByNetwork = {};
      transactions.forEach(tx => {
        if (tx.customerFee && tx.customerFee.applied) {
          if (!feesByNetwork[tx.network]) {
            feesByNetwork[tx.network] = 0;
          }
          feesByNetwork[tx.network] += parseFloat(tx.customerFee.amount || 0);
        }
      });

      const totalFees = Object.values(feesByNetwork).reduce((a, b) => a + b, 0);
      const feesByNetworkArray = Object.entries(feesByNetwork).map(([network, amount]) => ({
        network,
        amount: amount.toFixed(2),
        percentage: totalFees > 0 ? Math.round((amount / totalFees) * 100) : 0
      }));

      res.json({
        transactionVolume,
        feesByNetwork: feesByNetworkArray
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Failed to load analytics' });
    }
  }
}

module.exports = AnalyticsController;