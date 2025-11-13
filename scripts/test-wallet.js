// scripts/test-wallet.js - Test wallet generation
require('dotenv').config();
const WalletGenerator = require('../src/services/walletGenerator');

async function testWallet() {
  console.log('🔧 Testing wallet generation...\n');

  const networks = ['BTC', 'ETH', 'POLYGON', 'BSC', 'SOL', 'TRX', 'LTC', 'DOGE'];

  for (const network of networks) {
    try {
      console.log(`Testing ${network}...`);
      const wallet = await WalletGenerator.generate(network, 'testnet');
      console.log(`✓ ${network} wallet generated`);
      console.log(`  Address: ${wallet.address}`);
      console.log(`  Private Key: ${wallet.privateKey.substring(0, 20)}...`);
      console.log('');
    } catch (error) {
      console.log(`✗ ${network} failed: ${error.message}\n`);
    }
  }

  console.log('✓ Wallet generation test completed');
}

testWallet();

