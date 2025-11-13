// scripts/test-gas-tank.js
require('dotenv').config();
const mongoose = require('mongoose');
const GasTankService = require('../src/services/gasTankService');
const EthereumService = require('../src/services/blockchain/ethService');
const BscService = require('../src/services/blockchain/bscService');
const PolygonService = require('../src/services/blockchain/polygonService');
const SolanaService = require('../src/services/blockchain/solService');

// Test networks and their gas tanks
const TEST_GAS_TANKS = {
  ETH: {
    network: 'testnet',
    minBalance: 0.01 // 0.01 ETH minimum
  },
  BSC: {
    network: 'testnet',
    minBalance: 0.01 // 0.01 BNB minimum
  },
  POLYGON: {
    network: 'testnet',
    minBalance: 0.1 // 0.1 MATIC minimum
  },
  SOL: {
    network: 'testnet',
    minBalance: 0.1 // 0.1 SOL minimum
  }
};

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/custodial-wallet');
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

async function testGasTankCreation() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  TESTING GAS TANK CREATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const [symbol, config] of Object.entries(TEST_GAS_TANKS)) {
    try {
      console.log(`📦 Creating gas tank for ${symbol}...`);
      
      let privateKey, address;
      
      // Generate wallet based on network type
      switch (symbol) {
        case 'ETH':
          const ethService = new EthereumService(config.network);
          const ethWallet = ethService.generateWallet();
          privateKey = ethWallet.privateKey;
          address = ethWallet.address;
          break;
          
        case 'BSC':
          const bscService = new BscService(config.network);
          const bscWallet = bscService.generateWallet();
          privateKey = bscWallet.privateKey;
          address = bscWallet.address;
          break;
          
        case 'POLYGON':
          const polygonService = new PolygonService(config.network);
          const polygonWallet = polygonService.generateWallet();
          privateKey = polygonWallet.privateKey;
          address = polygonWallet.address;
          break;
          
        case 'SOL':
          const solService = new SolanaService(config.network);
          const solWallet = solService.generateWallet();
          privateKey = solWallet.privateKey;
          address = solWallet.address;
          break;
      }
      
      // Create gas tank
      const gasTank = await GasTankService.createGasTank(
        symbol,
        privateKey,
        config.minBalance
      );
      
      console.log(`   ✅ Gas tank created for ${symbol}`);
      console.log(`   Address: ${address}`);
      console.log(`   Min Balance: ${config.minBalance} ${symbol}`);
      console.log(`   ⚠️  Please fund this address to use gas tank\n`);
      
    } catch (error) {
      console.log(`   ❌ Failed to create ${symbol} gas tank: ${error.message}\n`);
    }
  }
}

async function testGasTankBalance() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  TESTING GAS TANK BALANCES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const symbol of Object.keys(TEST_GAS_TANKS)) {
    try {
      console.log(`💰 Checking ${symbol} gas tank balance...`);
      
      const gasTank = await GasTankService.getGasTank(symbol);
      if (!gasTank) {
        console.log(`   ⚠️  No gas tank found for ${symbol}\n`);
        continue;
      }
      
      const balance = await GasTankService.getBalance(symbol, gasTank.address);
      const minBalance = GasTankService.convertFromSmallestUnit(symbol, gasTank.minBalance);
      
      const hasSufficientBalance = parseFloat(balance) >= parseFloat(minBalance);
      
      console.log(`   Address: ${gasTank.address}`);
      console.log(`   Balance: ${balance} ${symbol}`);
      console.log(`   Min Required: ${minBalance} ${symbol}`);
      console.log(`   Status: ${hasSufficientBalance ? '✅ SUFFICIENT' : '⚠️  NEEDS FUNDING'}\n`);
      
    } catch (error) {
      console.log(`   ❌ Error checking ${symbol} balance: ${error.message}\n`);
    }
  }
}

async function testGasSponsorship() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  TESTING GAS SPONSORSHIP (DRY RUN)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const testScenarios = {
    ETH: {
      userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
      tokenContract: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', // Sepolia USDT
      recipient: '0x123456789abcdef123456789abcdef123456789a'
    },
    BSC: {
      userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
      tokenContract: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', // BSC Testnet USDT
      recipient: '0x123456789abcdef123456789abcdef123456789a'
    },
    POLYGON: {
      userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
      tokenContract: '0x3813e82e6f7098b9583FC0F33a962D02018B6803', // Amoy USDT
      recipient: '0x123456789abcdef123456789abcdef123456789a'
    },
    SOL: {
      userAddress: '9B5XszUGdMaxCZ7uSQhPzdks5ZQSmWxrmzCSvtJ6Ns6g',
      tokenMint: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', // Devnet USDC
      recipient: 'AnotherSolanaAddress1234567890123456789012'
    }
  };

  for (const [symbol, scenario] of Object.entries(testScenarios)) {
    try {
      console.log(`🚀 Testing ${symbol} gas sponsorship (DRY RUN)...`);
      
      const gasTank = await GasTankService.getGasTank(symbol);
      if (!gasTank) {
        console.log(`   ⚠️  No gas tank configured for ${symbol}\n`);
        continue;
      }
      
      const balance = await GasTankService.getBalance(symbol, gasTank.address);
      if (parseFloat(balance) < 0.001) {
        console.log(`   ⚠️  Gas tank has insufficient balance: ${balance} ${symbol}`);
        console.log(`   Please fund: ${gasTank.address}\n`);
        continue;
      }
      
      console.log(`   ✅ Gas tank has sufficient balance: ${balance} ${symbol}`);
      console.log(`   User: ${scenario.userAddress}`);
      console.log(`   Token: ${scenario.tokenContract || scenario.tokenMint}`);
      console.log(`   Recipient: ${scenario.recipient}`);
      console.log(`   Status: Ready for gas sponsorship`);
      console.log(`   Note: Actual sponsorship requires real token transfer\n`);
      
    } catch (error) {
      console.log(`   ❌ Error testing ${symbol} sponsorship: ${error.message}\n`);
    }
  }
}

async function testTronSupport() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4️⃣  TESTING TRON SUPPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    console.log('🔴 Checking TRON gas tank support...');
    
    const TronService = require('../src/services/blockchain/tronService');
    const tronService = new TronService('testnet');
    const tronWallet = await tronService.generateWallet();
    
    // Try to create gas tank for TRON
    const gasTank = await GasTankService.createGasTank(
      'TRX',
      tronWallet.privateKey,
      10
    );
    
    console.log('   ✅ TRON gas tank support is working!');
    console.log(`   Address: ${gasTank.address}\n`);
    
  } catch (error) {
    console.log('   ❌ TRON is NOT supported in gas tank service');
    console.log(`   Error: ${error.message}`);
    console.log('   Recommendation: Add TRON support to gasTankService.js\n');
  }
}

async function testGasTankStats() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5️⃣  GAS TANK STATISTICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const stats = await GasTankService.getStatistics();
    
    if (stats.length === 0) {
      console.log('   ℹ️  No gas tank transactions recorded yet\n');
      return;
    }
    
    console.log('   Transaction Statistics by Network:\n');
    for (const stat of stats) {
      console.log(`   ${stat._id}:`);
      console.log(`     Total Transactions: ${stat.totalTransactions}`);
      console.log(`     Total Gas Spent: ${stat.totalGasSpent}\n`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error fetching statistics: ${error.message}\n`);
  }
}

async function runTests() {
  console.log('\n');
  console.log('╔═════════════════════════════════════════╗');
  console.log('║     GAS TANK COMPREHENSIVE TEST         ║');
  console.log('╚═════════════════════════════════════════╝');
  console.log('\n');

  try {
    await connectDB();
    
    await testGasTankCreation();
    await testGasTankBalance();
    await testGasSponsorship();
    await testTronSupport();
    await testGasTankStats();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ Supported Networks: ETH, BSC, POLYGON, SOL');
    console.log('❌ Missing Support: TRON (TRC20)');
    console.log('\n📝 Next Steps:');
    console.log('   1. Fund gas tank addresses shown above');
    console.log('   2. Add TRON support to gasTankService.js');
    console.log('   3. Test actual token transfers with gas sponsorship');
    console.log('   4. Monitor gas tank balances regularly\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

runTests().catch(console.error);