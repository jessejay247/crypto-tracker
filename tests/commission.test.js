
// backend/tests/commission.test.js
const CommissionService = require('../src/services/commissionService');
const SystemConfig = require('../src/models/SystemConfig');

describe('Commission Service', () => {
  beforeEach(async () => {
    await SystemConfig.create({
      commissionRate: 0.5,
      commissionAddresses: [
        { network: 'ETH', address: '0x123...', enabled: true }
      ]
    });
  });

  describe('calculateCommission', () => {
    it('should calculate 0.5% commission correctly', async () => {
      const result = await CommissionService.calculateCommission(100, 'ETH');

      expect(result.originalAmount).toBe(100);
      expect(result.commissionAmount).toBe(0.5);
      expect(result.netAmount).toBe(99.5);
      expect(result.commissionRate).toBe(0.5);
    });

    it('should handle different amounts', async () => {
      const result = await CommissionService.calculateCommission(1000, 'ETH');

      expect(result.commissionAmount).toBe(5);
      expect(result.netAmount).toBe(995);
    });
  });

  describe('getCommissionAddress', () => {
    it('should return commission address for enabled network', async () => {
      const address = await CommissionService.getCommissionAddress('ETH');
      expect(address).toBe('0x123...');
    });

    it('should throw error for unconfigured network', async () => {
      await expect(
        CommissionService.getCommissionAddress('BTC')
      ).rejects.toThrow();
    });
  });
});


