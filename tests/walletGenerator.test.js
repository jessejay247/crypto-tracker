// backend/tests/walletGenerator.test.js
const WalletGenerator = require('../src/services/walletGenerator');

describe('Wallet Generator', () => {
  describe('BTC wallet generation', () => {
    it('should generate valid BTC mainnet wallet', async () => {
      const wallet = await WalletGenerator.generate('BTC', 'mainnet');

      expect(wallet).toHaveProperty('address');
      expect(wallet).toHaveProperty('privateKey');
      expect(wallet.address).toBeTruthy();
    });

    it('should generate valid BTC testnet wallet', async () => {
      const wallet = await WalletGenerator.generate('BTC', 'testnet');
      expect(wallet.address).toBeTruthy();
    });
  });

  describe('ETH wallet generation', () => {
    it('should generate valid ETH wallet', async () => {
      const wallet = await WalletGenerator.generate('ETH');

      expect(wallet).toHaveProperty('address');
      expect(wallet).toHaveProperty('privateKey');
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe('SOL wallet generation', () => {
    it('should generate valid SOL wallet', async () => {
      const wallet = await WalletGenerator.generate('SOL');

      expect(wallet).toHaveProperty('address');
      expect(wallet).toHaveProperty('privateKey');
      expect(wallet.address).toBeTruthy();
    });
  });

  describe('validateAddress', () => {
    it('should validate ETH address', () => {
      const isValid = WalletGenerator.validateAddress(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        'ETH'
      );
      expect(isValid).toBe(true);
    });

    it('should reject invalid ETH address', () => {
      const isValid = WalletGenerator.validateAddress(
        'invalid_address',
        'ETH'
      );
      expect(isValid).toBe(false);
    });
  });
});
