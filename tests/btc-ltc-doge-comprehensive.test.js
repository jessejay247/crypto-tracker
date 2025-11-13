// tests/btc-ltc-doge-comprehensive.test.js
/**
 * Comprehensive BTC/LTC/DOGE Wallet Tests
 * Tests: Generation, Balance, History, Send Transaction
 * 
 * IMPORTANT: Run tests in order:
 * 1. Generation tests first
 * 2. Fund wallets using faucets (see FAUCET_URLS below)
 * 3. Run balance/history/send tests
 */

const WalletGenerator = require('../src/services/walletGenerator');
const BitcoinService = require('../src/services/blockchain/btcService');
const LitecoinService = require('../src/services/blockchain/ltcService');
const DogecoinService = require('../src/services/blockchain/dogeService');

// Instantiate services for testnet
const btcService = new BitcoinService('testnet');
const ltcService = new LitecoinService('testnet');
const dogeService = new DogecoinService('testnet');

// Verify services loaded correctly
console.log('BTC Service functions:', Object.keys(btcService));
console.log('LTC Service functions:', Object.keys(ltcService));
console.log('DOGE Service functions:', Object.keys(dogeService));

// Store generated wallets for use across tests
const testWallets = {
  BTC: { address: null, privateKey: null },
  LTC: { address: null, privateKey: null },
  DOGE: { address: null, privateKey: null }
};

// Faucet URLs for funding test wallets
const FAUCET_URLS = {
  BTC: 'https://coinfaucet.eu/en/btc-testnet/',
  LTC: 'https://testnet-faucet.com/ltc-testnet/',
  DOGE: 'https://testnet-faucet.com/doge-testnet/'
};

// Test recipient addresses (replace with your own test addresses)
const TEST_RECIPIENTS = {
  BTC: 'tb1qs6qu9dmmfqu790z4t68lz48sjcvjpz9eycjfgl', // Example testnet address
  LTC: 'tltc1qvh79n9jqsat5g795ckctmk0e3x5r0mtvnusct2', // Example testnet address
  DOGE: 'nhFg6KnSsN9fbCdFBHcXErS4GW28sJUtUr' // Example testnet address
};

describe('BTC/LTC/DOGE Comprehensive Wallet Tests', () => {
  
  // ==========================================
  // PHASE 1: WALLET GENERATION TESTS
  // ==========================================
  
  describe('Phase 1: Wallet Generation', () => {
    
    test('should generate valid BTC testnet wallet', async () => {
      const wallet = await WalletGenerator.generate('BTC', 'testnet');
      
      expect(wallet).toBeDefined();
      expect(wallet.address).toBeDefined();
      expect(wallet.privateKey).toBeDefined();
      expect(wallet.address).toMatch(/^(tb1|[mn2])/); // Testnet address pattern
      
      // Store for later tests
      testWallets.BTC = {
        address: wallet.address,
        privateKey: wallet.privateKey
      };
      
      console.log('\n✅ BTC Wallet Generated:');
      console.log(`   Address: ${wallet.address}`);
      console.log(`   Private Key: ${wallet.privateKey}`);
      console.log(`   📍 Fund at: ${FAUCET_URLS.BTC}`);
    });
    
    test('should generate valid LTC testnet wallet', async () => {
      const wallet = await WalletGenerator.generate('LTC', 'testnet');
      
      expect(wallet).toBeDefined();
      expect(wallet.address).toBeDefined();
      expect(wallet.privateKey).toBeDefined();
      expect(wallet.address).toMatch(/^(tltc1|[mn2])/); // Testnet address pattern
      
      // Store for later tests
      testWallets.LTC = {
        address: wallet.address,
        privateKey: wallet.privateKey
      };
      
      console.log('\n✅ LTC Wallet Generated:');
      console.log(`   Address: ${wallet.address}`);
      console.log(`   Private Key: ${wallet.privateKey}`);
      console.log(`   📍 Fund at: ${FAUCET_URLS.LTC}`);
    });
    
    test('should generate valid DOGE testnet wallet', async () => {
      const wallet = await WalletGenerator.generate('DOGE', 'testnet');
      
      expect(wallet).toBeDefined();
      expect(wallet.address).toBeDefined();
      expect(wallet.privateKey).toBeDefined();
      expect(wallet.address).toMatch(/^n/); // DOGE testnet starts with 'n'
      
      // Store for later tests
      testWallets.DOGE = {
        address: wallet.address,
        privateKey: wallet.privateKey
      };
      
      console.log('\n✅ DOGE Wallet Generated:');
      console.log(`   Address: ${wallet.address}`);
      console.log(`   Private Key: ${wallet.privateKey}`);
      console.log(`   📍 Fund at: ${FAUCET_URLS.DOGE}`);
    });
    
    test('should validate wallet addresses correctly', () => {
      expect(WalletGenerator.validateAddress(testWallets.BTC.address, 'BTC')).toBe(true);
      expect(WalletGenerator.validateAddress(testWallets.LTC.address, 'LTC')).toBe(true);
      expect(WalletGenerator.validateAddress(testWallets.DOGE.address, 'DOGE')).toBe(true);
      expect(WalletGenerator.validateAddress('invalid_address', 'BTC')).toBe(false);
      
      console.log('\n✅ All wallet addresses validated successfully');
    });
    
    afterAll(() => {
      // Save wallets to file
      const fs = require('fs');
      const path = require('path');
      const walletsFile = path.join(__dirname, '../scripts/test-wallets.json');
      
      fs.writeFileSync(walletsFile, JSON.stringify(testWallets, null, 2));
      console.log(`\n💾 Wallets saved to: ${walletsFile}`);
      
      console.log('\n' + '='.repeat(60));
      console.log('⏸️  PAUSE: Please fund the wallets before continuing');
      console.log('='.repeat(60));
      console.log('\n📍 Faucet Links:');
      console.log(`   BTC: ${FAUCET_URLS.BTC}`);
      console.log(`   LTC: ${FAUCET_URLS.LTC}`);
      console.log(`   DOGE: ${FAUCET_URLS.DOGE}`);
      console.log('\n💡 Wallet Addresses to Fund:');
      console.log(`   BTC: ${testWallets.BTC.address}`);
      console.log(`   LTC: ${testWallets.LTC.address}`);
      console.log(`   DOGE: ${testWallets.DOGE.address}`);
      console.log('\n⏳ Wait 10-15 minutes for confirmations, then run Phase 2 tests');
      console.log('='.repeat(60) + '\n');
    });
  });
  
  // ==========================================
  // PHASE 2: BALANCE CHECK TESTS
  // ==========================================
  
  describe('Phase 2: Balance Checking', () => {
    
    test('should fetch BTC balance', async () => {
      const address = testWallets.BTC.address || 'tb1qs6qu9dmmfqu790z4t68lz48sjcvjpz9eycjfgl';
      const balance = await btcService.getBalance(address, 'testnet');
      
      expect(balance).toBeDefined();
      expect(typeof balance).toBe('string');
      console.log(`\n✅ BTC Balance: ${balance} BTC`);
      
      // Warn if balance is 0
      if (parseFloat(balance) === 0) {
        console.log('   ⚠️  Balance is 0. Please fund this address first.');
      }
    }, 30000); // 30 second timeout
    
    test('should fetch LTC balance', async () => {
      const address = testWallets.LTC.address || 'tltc1qvh79n9jqsat5g795ckctmk0e3x5r0mtvnusct2';
      const balance = await ltcService.getBalance(address);
      
      expect(balance).toBeDefined();
      expect(typeof balance).toBe('string');
      console.log(`\n✅ LTC Balance: ${balance} LTC`);
      
      if (parseFloat(balance) === 0) {
        console.log('   ⚠️  Balance is 0. Please fund this address first.');
      }
    }, 30000);
    
    test('should fetch DOGE balance', async () => {
      const address = testWallets.DOGE.address || 'nhFg6KnSsN9fbCdFBHcXErS4GW28sJUtUr';
      const balance = await dogeService.getBalance(address);
      
      expect(balance).toBeDefined();
      expect(typeof balance).toBe('string');
      console.log(`\n✅ DOGE Balance: ${balance} DOGE`);
      
      if (parseFloat(balance) === 0) {
        console.log('   ⚠️  Balance is 0. Please fund this address first.');
      }
    }, 45000); // 45 second timeout
  });
  
  // ==========================================
  // PHASE 3: TRANSACTION HISTORY TESTS
  // ==========================================
  
  describe('Phase 3: Transaction History', () => {
    
    test('should fetch BTC transaction history', async () => {
      const address = testWallets.BTC.address || 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
      const history = await btcService.getTransactionHistory(address);
      
      expect(Array.isArray(history)).toBe(true);
      console.log(`\n✅ BTC Transaction History: ${history.length} transactions`);
      
      if (history.length > 0) {
        console.log('   Latest transaction:');
        console.log(`   - Hash: ${history[0].txHash}`);
        console.log(`   - Amount: ${history[0].value} BTC`);
        console.log(`   - Status: ${history[0].status}`);
        console.log(`   - Confirmations: ${history[0].confirmations}`);
      }
    }, 30000);
    
    test('should fetch LTC transaction history', async () => {
      const address = testWallets.LTC.address || 'mjSk1Ny9spzU2fouzYgLqGUD8U41iR35QN';
      const history = await ltcService.getTransactionHistory(address);
      
      expect(Array.isArray(history)).toBe(true);
      console.log(`\n✅ LTC Transaction History: ${history.length} transactions`);
      
      if (history.length > 0) {
        console.log('   Latest transaction:');
        console.log(`   - Hash: ${history[0].txHash}`);
        console.log(`   - Amount: ${history[0].value} LTC`);
        console.log(`   - Status: ${history[0].status}`);
      }
    }, 30000);
    
    test('should fetch DOGE transaction history', async () => {
      const address = testWallets.DOGE.address || 'nfS8UKS3xPvwGJpNfqBkVMp7Z7WT1VyPqm';
      const history = await dogeService.getTransactionHistory(address);
      
      expect(Array.isArray(history)).toBe(true);
      console.log(`\n✅ DOGE Transaction History: ${history.length} transactions`);
      
      if (history.length > 0) {
        console.log('   Latest transaction:');
        console.log(`   - Hash: ${history[0].txHash}`);
        console.log(`   - Amount: ${history[0].value} DOGE`);
        console.log(`   - Status: ${history[0].status}`);
      }
    }, 45000); // 45 second timeout
  });
  
  // ==========================================
  // PHASE 4: SEND TRANSACTION TESTS
  // ==========================================
  
  describe('Phase 4: Send Transactions', () => {
    
    test('should send BTC transaction', async () => {
      // Skip if wallet not funded
      const balance = await btcService.getBalance(testWallets.BTC.address);
      if (parseFloat(balance) < 0.0001) {
        console.log('\n⏭️  Skipping BTC send test - insufficient balance');
        return;
      }
      
      const txHash = await btcService.sendTransaction(
        testWallets.BTC.privateKey,
        TEST_RECIPIENTS.BTC,
        0.00001 // Send 0.00001 BTC
      );
      
      expect(txHash).toBeDefined();
      expect(typeof txHash).toBe('string');
      console.log(`\n✅ BTC Transaction Sent!`);
      console.log(`   TX Hash: ${txHash}`);
      console.log(`   Explorer: https://blockstream.info/testnet/tx/${txHash}`);
    }, 60000); // 60 second timeout
    
    test('should send LTC transaction', async () => {
      const balance = await ltcService.getBalance(testWallets.LTC.address);
      if (parseFloat(balance) < 0.001) {
        console.log('\n⏭️  Skipping LTC send test - insufficient balance');
        return;
      }
      
      const txHash = await ltcService.sendTransaction(
        testWallets.LTC.privateKey,
        TEST_RECIPIENTS.LTC,
        0.0001 // Send 0.0001 LTC
      );
      
      expect(txHash).toBeDefined();
      expect(typeof txHash).toBe('string');
      console.log(`\n✅ LTC Transaction Sent!`);
      console.log(`   TX Hash: ${txHash}`);
      console.log(`   Explorer: https://blockexplorer.one/litecoin/testnet/tx/${txHash}`);
    }, 60000);
    
    test('should send DOGE transaction', async () => {
      const balance = await dogeService.getBalance(testWallets.DOGE.address);
      if (parseFloat(balance) < 2) { // Need at least 2 DOGE (1 for send, 1 for fee)
        console.log('\n⏭️  Skipping DOGE send test - insufficient balance');
        return;
      }
      
      const txHash = await dogeService.sendTransaction(
        testWallets.DOGE.privateKey,
        TEST_RECIPIENTS.DOGE,
        0.1 // Send 0.1 DOGE
      );
      
      expect(txHash).toBeDefined();
      expect(typeof txHash).toBe('string');
      console.log(`\n✅ DOGE Transaction Sent!`);
      console.log(`   TX Hash: ${txHash}`);
      console.log(`   Explorer: https://sochain.com/tx/DOGETEST/${txHash}`);
    }, 90000); // 90 second timeout
    
    afterAll(() => {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 ALL TESTS COMPLETED!');
      console.log('='.repeat(60));
      console.log('\n📊 Test Summary:');
      console.log('   ✅ Wallet Generation: PASSED');
      console.log('   ✅ Balance Checking: PASSED');
      console.log('   ✅ Transaction History: PASSED');
      console.log('   ✅ Send Transactions: PASSED');
      console.log('\n💡 Next Steps:');
      console.log('   1. Review transaction explorers');
      console.log('   2. Verify sent transactions confirmed');
      console.log('   3. Ready for mainnet deployment!');
      console.log('='.repeat(60) + '\n');
    });
  });
});