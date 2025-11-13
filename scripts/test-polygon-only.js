// scripts/test-polygon-only.js
require('dotenv').config();
const PolygonService = require('../src/services/blockchain/polygonService');

// Common testnet ERC20 tokens on Polygon Amoy
const TESTNET_TOKENS = {
  USDT: '0x3813e82e6f7098b9583FC0F33a962D02018B6803', // Amoy USDT (example)
  USDC: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97', // Amoy USDC (example)
  DAI: '0x001B3B4d0F3714Ca98ba10F6042DaEbF0B1B7b6F'   // Amoy DAI (example)
};

async function testPolygon() {
  console.log('💜 Testing POLYGON (Amoy Testnet)\n');
  
  const polygonService = new PolygonService('testnet');
  
  // 1. Generate wallet
  console.log('1️⃣ Generating wallet...');
  const wallet = await polygonService.generateWallet();
  console.log(`   Address: ${wallet.address}`);
  console.log(`   Private Key: ${wallet.privateKey}\n`);
  
  // 2. Check MATIC balance
  console.log('2️⃣ Checking MATIC balance...');
  const balance = await polygonService.getBalance(wallet.address);
  console.log(`   Balance: ${balance} MATIC\n`);
  
  if (parseFloat(balance) < 0.1) {
    console.log('⚠️  Need at least 0.1 MATIC for testing.');
    console.log('💡 Get testnet MATIC from:');
    console.log('   - https://faucet.polygon.technology/');
    console.log('   - https://www.alchemy.com/faucets/polygon-amoy');
    console.log('\nℹ️  Save this wallet for testing:');
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Private Key: ${wallet.privateKey}`);
    return;
  }
  
  // 3. Test MATIC transfer
  console.log('3️⃣ Testing send 0.01 MATIC...');
  try {
    const recipient = await polygonService.generateWallet();
    console.log(`   Recipient: ${recipient.address}`);
    
    const txId = await polygonService.sendTransaction(
      wallet.privateKey,
      recipient.address,
      0.01
    );
    console.log(`   ✅ Success: ${txId}`);
    console.log(`   Explorer: https://amoy.polygonscan.com/tx/${txId}\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }
  
  // 4. Check token balances
  console.log('4️⃣ Checking ERC20 token balances...');
  for (const [symbol, address] of Object.entries(TESTNET_TOKENS)) {
    try {
      const tokenBalance = await polygonService.getTokenBalance(wallet.address, address);
      console.log(`   ${symbol}: ${tokenBalance}`);
    } catch (error) {
      console.log(`   ${symbol}: Error - ${error.message}`);
    }
  }
  console.log();
  
  console.log('✅ Polygon tests complete!');
}

testPolygon().catch(console.error);