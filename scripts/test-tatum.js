// scripts/test-tatum.js
require('dotenv').config();
const LitecoinService = require('../src/services/blockchain/ltcService');
const DogecoinService = require('../src/services/blockchain/dogeService');

async function test() {
  console.log('🧪 Testing Tatum API Integration\n');
  
  // LTC Test
  console.log('=== LITECOIN TEST ===');
  const ltcService = new LitecoinService('testnet');
  const ltcTestAddress = 'tltc1qvh79n9jqsat5g795ckctmk0e3x5r0mtvnusct2';
  
  try {
    console.log('Testing LTC balance...');
    const ltcBalance = await ltcService.getBalance(ltcTestAddress);
    console.log(`✅ LTC Balance: ${ltcBalance} LTC`);
    
    console.log('Testing LTC history...');
    const ltcHistory = await ltcService.getTransactionHistory(ltcTestAddress, 5);
    console.log(`✅ LTC History: ${ltcHistory.length} transactions`);
  } catch (error) {
    console.error('❌ LTC Error:', error.message);
  }
  
  // DOGE Test
  console.log('\n=== DOGECOIN TEST ===');
  const dogeService = new DogecoinService('testnet');
  const dogeTestAddress = 'nhFg6KnSsN9fbCdFBHcXErS4GW28sJUtUr';
  
  try {
    console.log('Testing DOGE balance...');
    const dogeBalance = await dogeService.getBalance(dogeTestAddress);
    console.log(`✅ DOGE Balance: ${dogeBalance} DOGE`);
    
    console.log('Testing DOGE history...');
    const dogeHistory = await dogeService.getTransactionHistory(dogeTestAddress, 5);
    console.log(`✅ DOGE History: ${dogeHistory.length} transactions`);
  } catch (error) {
    console.error('❌ DOGE Error:', error.message);
  }
  
  console.log('\n✅ Tests complete!');
}

test().catch(console.error);