// scripts/test-xrp-only.js
require('dotenv').config();
const XrpService = require('../src/services/blockchain/xrpService');

const TEST_XRP = {
  address: 'rEyVFCayvmq9bgBsVSefvZw4AwHPhpVhzN',
  privateKey: 'sEdV3L6fw6i9ZW1Q69jEF9pDWEuv4LM'
};

const RECIPIENT_ADDRESS = 'rfKXh4CEHYLG2qvmyxEJpNJ9T4gWUagx5v';

async function testXrp() {
  console.log('💧 Testing XRP (Ripple)\n');
  
  const xrpService = new XrpService('testnet');
  
  // 1. Check balance
  console.log('1️⃣ Checking balance...');
  const balance = await xrpService.getBalance(TEST_XRP.address);
  console.log(`   Balance: ${balance} XRP\n`);
  
  if (parseFloat(balance) < 20) {
    console.log('⚠️  Need at least 20 XRP for testing (10 XRP reserve + transaction).');
    console.log('💡 Get testnet XRP from: https://xrpl.org/xrp-testnet-faucet.html');
    return;
  }
  
  // 2. Test transaction
  console.log('2️⃣ Testing send 5 XRP...');
  console.log(`   Recipient: ${RECIPIENT_ADDRESS}`);
  
  try {
    const txId = await xrpService.sendTransaction(
      TEST_XRP.privateKey,
      RECIPIENT_ADDRESS,
      5
    );
    console.log(`   ✅ Success: ${txId}`);
    console.log(`   Explorer: https://testnet.xrpl.org/transactions/${txId}\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }
  
  console.log('✅ XRP tests complete!');
}

testXrp().catch(console.error);