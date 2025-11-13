// scripts/test-bsc-only.js
require('dotenv').config();
const BscService = require('../src/services/blockchain/bscService');

// Common testnet BEP20 tokens on BSC Testnet
const TESTNET_TOKENS = {
  USDT: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', // BSC Testnet USDT
  BUSD: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee', // BSC Testnet BUSD
  USDC: '0x64544969ed7EBf5f083679233325356EbE738930'  // BSC Testnet USDC
};

async function testBsc() {
  console.log('💛 Testing BINANCE SMART CHAIN (BSC Testnet)\n');
  
  const bscService = new BscService('testnet');
  
  // 1. Generate wallet
  console.log('1️⃣ Generating wallet...');
  const wallet = await bscService.generateWallet();
  console.log(`   Address: ${wallet.address}`);
  console.log(`   Private Key: ${wallet.privateKey}\n`);
  
  // 2. Check BNB balance
  console.log('2️⃣ Checking BNB balance...');
  const balance = await bscService.getBalance(wallet.address);
  console.log(`   Balance: ${balance} BNB\n`);
  
  if (parseFloat(balance) < 0.01) {
    console.log('⚠️  Need at least 0.01 BNB for testing.');
    console.log('💡 Get testnet BNB from: https://testnet.bnbchain.org/faucet-smart');
    console.log('\nℹ️  Save this wallet for testing:');
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Private Key: ${wallet.privateKey}`);
    return;
  }
  
  // 3. Test BNB transfer
  console.log('3️⃣ Testing send 0.001 BNB...');
  try {
    const recipient = await bscService.generateWallet();
    console.log(`   Recipient: ${recipient.address}`);
    
    const txId = await bscService.sendTransaction(
      wallet.privateKey,
      recipient.address,
      0.001
    );
    console.log(`   ✅ Success: ${txId}`);
    console.log(`   Explorer: https://testnet.bscscan.com/tx/${txId}\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }
  
  // 4. Check token balances
  console.log('4️⃣ Checking BEP20 token balances...');
  for (const [symbol, address] of Object.entries(TESTNET_TOKENS)) {
    try {
      const tokenBalance = await bscService.getTokenBalance(wallet.address, address);
      console.log(`   ${symbol}: ${tokenBalance}`);
    } catch (error) {
      console.log(`   ${symbol}: Error - ${error.message}`);
    }
  }
  console.log();
  
  console.log('✅ BSC tests complete!');
}

testBsc().catch(console.error);