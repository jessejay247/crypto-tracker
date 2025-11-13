// scripts/test-tron-only.js
require('dotenv').config();
const TronService = require('../src/services/blockchain/tronService');

// Common TRC20 tokens on Shasta Testnet
const TESTNET_TOKENS = {
  USDT: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs', // Shasta USDT (example)
  USDC: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8'  // Shasta USDC (example)
};

async function testTron() {
  console.log('🔴 Testing TRON (Shasta Testnet)\n');
  
  const tronService = new TronService('testnet');
  
  // 1. Generate wallet
  console.log('1️⃣ Generating wallet...');
  const wallet = await tronService.generateWallet();
  console.log(`   Address: ${wallet.address}`);
  console.log(`   Private Key: ${wallet.privateKey}\n`);
  
  // 2. Check TRX balance
  console.log('2️⃣ Checking TRX balance...');
  const balance = await tronService.getBalance(wallet.address);
  console.log(`   Balance: ${balance} TRX\n`);
  
  if (parseFloat(balance) < 10) {
    console.log('⚠️  Need at least 10 TRX for testing.');
    console.log('💡 Get testnet TRX from: https://www.trongrid.io/shasta');
    console.log('   Or: https://shasta.tronex.io/');
    console.log('\nℹ️  Save this wallet for testing:');
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Private Key: ${wallet.privateKey}`);
    return;
  }
  
  // 3. Test TRX transfer
  console.log('3️⃣ Testing send 1 TRX...');
  try {
    const recipient = await tronService.generateWallet();
    console.log(`   Recipient: ${recipient.address}`);
    
    const txId = await tronService.sendTransaction(
      wallet.privateKey,
      recipient.address,
      1
    );
    console.log(`   ✅ Success: ${txId}`);
    console.log(`   Explorer: https://shasta.tronscan.org/#/transaction/${txId}\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }
  
  // 4. Check TRC20 token balances
  console.log('4️⃣ Checking TRC20 token balances...');
  for (const [symbol, address] of Object.entries(TESTNET_TOKENS)) {
    try {
      const tokenBalance = await tronService.getTokenBalance(wallet.address, address);
      console.log(`   ${symbol}: ${tokenBalance}`);
    } catch (error) {
      console.log(`   ${symbol}: Error - ${error.message}`);
    }
  }
  console.log();
  
  console.log('✅ TRON tests complete!');
}

testTron().catch(console.error);