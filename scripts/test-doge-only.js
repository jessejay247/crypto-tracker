// scripts/test-doge-only.js
require('dotenv').config();
const DogecoinService = require('../src/services/blockchain/dogeService');

const TEST_DOGE = {
  address: 'nhFg6KnSsN9fbCdFBHcXErS4GW28sJUtUr',
  privateKey: 'chbKq9hCtB1nqmxFAg4Q2wWGpSQ4THsDbQFGwWuw7h6f3pB4oENp'
};

async function testDoge() {
  console.log('🐕 Testing DOGECOIN\n');
  
  const dogeService = new DogecoinService('testnet');
  
  // 1. Check balance
  console.log('1️⃣ Checking balance...');
  const balance = await dogeService.getBalance(TEST_DOGE.address);
  console.log(`   Balance: ${balance} DOGE\n`);
  
  if (parseFloat(balance) < 50) {
    console.log('⚠️  Need at least 50 DOGE for testing. Please fund the address.');
    return;
  }
  
  // 2. Test small amount (10 DOGE)
  console.log('2️⃣ Testing send 10 DOGE...');
  try {
    const recipient1 = await dogeService.generateWallet();
    console.log(`   Recipient: ${recipient1.address}`);
    
    const tx1 = await dogeService.sendTransaction(
      TEST_DOGE.privateKey,
      recipient1.address,
      10
    );
    console.log(`   ✅ Success: ${tx1}`);
    console.log(`   Explorer: https://sochain.com/tx/DOGETEST/${tx1}\n`);
    console.log('⏳ Note: Wait 10 minutes for confirmation before sending another transaction.\n');
    return; // Exit after first successful transaction
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }
  
  // 3. Test medium amount (50 DOGE) - if previous failed
  if (parseFloat(balance) >= 100) {
    console.log('3️⃣ Testing send 50 DOGE...');
    try {
      const recipient2 = await dogeService.generateWallet();
      console.log(`   Recipient: ${recipient2.address}`);
      
      const tx2 = await dogeService.sendTransaction(
        TEST_DOGE.privateKey,
        recipient2.address,
        50
      );
      console.log(`   ✅ Success: ${tx2}\n`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
    }
  }
  
  // 4. Test large amount (100 DOGE) - if previous failed
  if (parseFloat(balance) >= 200) {
    console.log('4️⃣ Testing send 100 DOGE...');
    try {
      const recipient3 = await dogeService.generateWallet();
      console.log(`   Recipient: ${recipient3.address}`);
      
      const tx3 = await dogeService.sendTransaction(
        TEST_DOGE.privateKey,
        recipient3.address,
        100
      );
      console.log(`   ✅ Success: ${tx3}\n`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
    }
  }
  
  console.log('✅ DOGE tests complete!');
}

testDoge().catch(console.error);