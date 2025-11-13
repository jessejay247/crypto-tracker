// ============================================
// scripts/quick-wallet-test.js
// Quick script to generate and save wallets
// ============================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const WalletGenerator = require('../src/services/walletGenerator');

async function quickWalletTest() {
  console.log('🔧 Quick Wallet Generation Test\n');
  console.log('=' .repeat(60));
  
  const networks = ['BTC', 'LTC', 'DOGE'];
  const wallets = {};
  
  // Generate wallets
  for (const network of networks) {
    try {
      console.log(`\n📝 Generating ${network} wallet...`);
      const wallet = await WalletGenerator.generate(network, 'testnet');
      
      wallets[network] = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ ${network} Wallet Generated`);
      console.log(`   Address: ${wallet.address}`);
      console.log(`   Private Key: ${wallet.privateKey.substring(0, 25)}...`);
      
    } catch (error) {
      console.error(`❌ ${network} Failed:`, error.message);
      wallets[network] = { error: error.message };
    }
  }
  
  // Save to file
  const outputFile = path.join(__dirname, 'test-wallets.json');
  fs.writeFileSync(outputFile, JSON.stringify(wallets, null, 2));
  console.log(`\n💾 Wallets saved to: ${outputFile}`);
  
  // Display faucet instructions
  console.log('\n' + '='.repeat(60));
  console.log('📍 NEXT STEP: Fund these wallets');
  console.log('='.repeat(60));
  
  const faucets = {
    BTC: 'https://coinfaucet.eu/en/btc-testnet/',
    LTC: 'https://testnet-faucet.com/ltc-testnet/',
    DOGE: 'https://testnet-faucet.com/doge-testnet/'
  };
  
  for (const [network, url] of Object.entries(faucets)) {
    if (wallets[network] && !wallets[network].error) {
      console.log(`\n${network}:`);
      console.log(`  Address: ${wallets[network].address}`);
      console.log(`  Faucet: ${url}`);
    }
  }
  
  console.log('\n⏳ Wait 10-15 minutes for confirmations');
  console.log('💡 Then run: npm run test:balance');
  console.log('='.repeat(60) + '\n');
}

quickWalletTest().catch(console.error);

