
// ============================================
// scripts/check-balances.js
// Check balances of generated wallets
// ============================================

const btcService = require('../src/services/blockchain/btcService');
const ltcService = require('../src/services/blockchain/ltcService');
const dogeService = require('../src/services/blockchain/dogeService');

async function checkBalances() {
  console.log('💰 Checking Wallet Balances\n');
  console.log('=' .repeat(60));
  
  // Load wallets from file
  const walletsFile = path.join(__dirname, 'test-wallets.json');
  
  if (!fs.existsSync(walletsFile)) {
    console.error('❌ No wallets file found. Run npm run test:generate first');
    process.exit(1);
  }
  
  const wallets = JSON.parse(fs.readFileSync(walletsFile, 'utf8'));
  
  // Check BTC
  if (wallets.BTC && wallets.BTC.address) {
    try {
      console.log('\n📊 BTC Balance:');
      const balance = await btcService.getBalance(wallets.BTC.address, 'testnet');
      console.log(`   Address: ${wallets.BTC.address}`);
      console.log(`   Balance: ${balance} BTC`);
      
      if (parseFloat(balance) === 0) {
        console.log('   ⚠️  Wallet is empty. Please fund it first.');
      } else {
        console.log('   ✅ Wallet is funded!');
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Check LTC
  if (wallets.LTC && wallets.LTC.address) {
    try {
      console.log('\n📊 LTC Balance:');
      const balance = await ltcService.getBalance(wallets.LTC.address, 'testnet');
      console.log(`   Address: ${wallets.LTC.address}`);
      console.log(`   Balance: ${balance} LTC`);
      
      if (parseFloat(balance) === 0) {
        console.log('   ⚠️  Wallet is empty. Please fund it first.');
      } else {
        console.log('   ✅ Wallet is funded!');
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Check DOGE
  if (wallets.DOGE && wallets.DOGE.address) {
    try {
      console.log('\n📊 DOGE Balance:');
      const balance = await dogeService.getBalance(wallets.DOGE.address, 'testnet');
      console.log(`   Address: ${wallets.DOGE.address}`);
      console.log(`   Balance: ${balance} DOGE`);
      
      if (parseFloat(balance) === 0) {
        console.log('   ⚠️  Wallet is empty. Please fund it first.');
      } else {
        console.log('   ✅ Wallet is funded!');
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 Next: npm run test:history (check transaction history)');
  console.log('💡 Then: npm run test:send (test sending)');
  console.log('='.repeat(60) + '\n');
}

if (require.main === module) {
  checkBalances().catch(console.error);
}

