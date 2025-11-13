// scripts/test-dash-only.js
require('dotenv').config();
const DashService = require('../src/services/blockchain/dashService');

async function testDash() {
  console.log('💎 Testing DASH\n');
  
  const dashService = new DashService('testnet');
  
  // 1. Generate wallet
  console.log('1️⃣ Generating wallet...');
  const wallet = await dashService.generateWallet();
  console.log(`   Address: ${wallet.address}`);
  console.log(`   Private Key: ${wallet.privateKey}\n`);
  
  // 2. Check balance
  console.log('2️⃣ Checking balance...');
  const balance = await dashService.getBalance(wallet.address);
  console.log(`   Balance: ${balance} DASH\n`);
  
  if (parseFloat(balance) < 0.1) {
    console.log('⚠️  Need at least 0.1 DASH for testing.');
    console.log('💡 Get testnet DASH from: http://faucet.test.dash.org/');
    console.log('\nℹ️  Save this wallet for testing:');
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Private Key: ${wallet.privateKey}`);
    return;
  }
  
  // 3. Test transaction
  console.log('3️⃣ Testing send 0.01 DASH...');
  try {
    const recipient = await dashService.generateWallet();
    console.log(`   Recipient: ${recipient.address}`);
    
    const txId = await dashService.sendTransaction(
      wallet.privateKey,
      recipient.address,
      0.01
    );
    console.log(`   ✅ Success: ${txId}`);
    console.log(`   Explorer: https://testnet-insight.dashevo.org/insight/tx/${txId}\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }
  
  console.log('✅ DASH tests complete!');
}

testDash().catch(console.error);