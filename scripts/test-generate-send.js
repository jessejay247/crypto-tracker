// scripts/test-generate-send.js
require('dotenv').config();
const BitcoinService = require('../src/services/blockchain/btcService');
const LitecoinService = require('../src/services/blockchain/ltcService');
const DogecoinService = require('../src/services/blockchain/dogeService');

// Test credentials (DO NOT USE IN PRODUCTION)
const TEST_CREDENTIALS = {
  BTC: {
    address: 'tb1qs6qu9dmmfqu790z4t68lz48sjcvjpz9eycjfgl',
    privateKey: 'cRyZY9gv4EvL5eQTZK4Qe3ApM2ngE23d1ujZDu6WqWEyU9W964fa'
  },
  DOGE: {
    address: 'nhFg6KnSsN9fbCdFBHcXErS4GW28sJUtUr',
    privateKey: 'chbKq9hCtB1nqmxFAg4Q2wWGpSQ4THsDbQFGwWuw7h6f3pB4oENp'
  },
  LTC: {
    address: 'tltc1qvh79n9jqsat5g795ckctmk0e3x5r0mtvnusct2',
    privateKey: 'cVWKqmWuq4hQZVTZhaM7gJMG3cbWSH2anZGQjijLW1etSwXEgNzF'
  }
};

async function testBitcoin() {
  console.log('\n' + '='.repeat(60));
  console.log('🟠 BITCOIN (BTC) TESTS');
  console.log('='.repeat(60));
  
  const btcService = new BitcoinService('testnet');
  
  // Test 1: Generate new wallet
  console.log('\n1️⃣ Testing wallet generation...');
  try {
    const newWallet = await btcService.generateWallet();
    console.log('✅ Generated BTC wallet:');
    console.log(`   Address: ${newWallet.address}`);
    console.log(`   Private Key: ${newWallet.privateKey.substring(0, 20)}...`);
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
  }
  
  // Test 2: Check balance
  console.log('\n2️⃣ Testing balance check...');
  try {
    const balance = await btcService.getBalance(TEST_CREDENTIALS.BTC.address);
    console.log(`✅ Balance: ${balance} BTC`);
    
    if (parseFloat(balance) === 0) {
      console.log('⚠️  No balance to test sending');
      return;
    }
  } catch (error) {
    console.error('❌ Balance check failed:', error.message);
    return;
  }
  
  // Test 3: Get transaction history
  console.log('\n3️⃣ Testing transaction history...');
  try {
    const history = await btcService.getTransactionHistory(TEST_CREDENTIALS.BTC.address, 5);
    console.log(`✅ Found ${history.length} transactions`);
    if (history.length > 0) {
      console.log(`   Latest: ${history[0].txHash.substring(0, 20)}...`);
    }
  } catch (error) {
    console.error('❌ History failed:', error.message);
  }
  
  // Test 4: Send transaction
  console.log('\n4️⃣ Testing send transaction...');
  try {
    // Generate a new address to send to
    const recipient = await btcService.generateWallet();
    console.log(`   Recipient: ${recipient.address}`);
    
    const txHash = await btcService.sendTransaction(
      TEST_CREDENTIALS.BTC.privateKey,
      recipient.address,
      0.00001 // Send 0.00001 BTC
    );
    console.log(`✅ Transaction sent!`);
    console.log(`   TX Hash: ${txHash}`);
    console.log(`   Explorer: https://blockstream.info/testnet/tx/${txHash}`);
  } catch (error) {
    console.error('❌ Send failed:', error.message);
  }
}

async function testLitecoin() {
  console.log('\n' + '='.repeat(60));
  console.log('⚪ LITECOIN (LTC) TESTS');
  console.log('='.repeat(60));
  
  const ltcService = new LitecoinService('testnet');
  
  // Test 1: Generate new wallet
  console.log('\n1️⃣ Testing wallet generation...');
  try {
    const newWallet = await ltcService.generateWallet();
    console.log('✅ Generated LTC wallet:');
    console.log(`   Address: ${newWallet.address}`);
    console.log(`   Private Key: ${newWallet.privateKey.substring(0, 20)}...`);
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
  }
  
  // Test 2: Check balance
  console.log('\n2️⃣ Testing balance check...');
  try {
    const balance = await ltcService.getBalance(TEST_CREDENTIALS.LTC.address);
    console.log(`✅ Balance: ${balance} LTC`);
    
    if (parseFloat(balance) === 0) {
      console.log('⚠️  No balance to test sending');
      return;
    }
  } catch (error) {
    console.error('❌ Balance check failed:', error.message);
    return;
  }
  
  // Test 3: Get transaction history
  console.log('\n3️⃣ Testing transaction history...');
  try {
    const history = await ltcService.getTransactionHistory(TEST_CREDENTIALS.LTC.address, 5);
    console.log(`✅ Found ${history.length} transactions`);
    if (history.length > 0) {
      console.log(`   Latest: ${history[0].txHash.substring(0, 20)}...`);
    }
  } catch (error) {
    console.error('❌ History failed:', error.message);
  }
  
  // Test 4: Send transaction
  console.log('\n4️⃣ Testing send transaction...');
  try {
    // Generate a new address to send to
    const recipient = await ltcService.generateWallet();
    console.log(`   Recipient: ${recipient.address}`);
    
    const txHash = await ltcService.sendTransaction(
      TEST_CREDENTIALS.LTC.privateKey,
      recipient.address,
      0.001 // Send 0.001 LTC
    );
    console.log(`✅ Transaction sent!`);
    console.log(`   TX Hash: ${txHash}`);
    console.log(`   Explorer: https://blockexplorer.one/litecoin/testnet/tx/${txHash}`);
  } catch (error) {
    console.error('❌ Send failed:', error.message);
  }
}

async function testDogecoin() {
  console.log('\n' + '='.repeat(60));
  console.log('🟡 DOGECOIN (DOGE) TESTS');
  console.log('='.repeat(60));
  
  const dogeService = new DogecoinService('testnet');
  
  // Test 1: Generate new wallet
  console.log('\n1️⃣ Testing wallet generation...');
  try {
    const newWallet = await dogeService.generateWallet();
    console.log('✅ Generated DOGE wallet:');
    console.log(`   Address: ${newWallet.address}`);
    console.log(`   Private Key: ${newWallet.privateKey.substring(0, 20)}...`);
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
  }
  
  // Test 2: Check balance
  console.log('\n2️⃣ Testing balance check...');
  try {
    const balance = await dogeService.getBalance(TEST_CREDENTIALS.DOGE.address);
    console.log(`✅ Balance: ${balance} DOGE`);
    
    if (parseFloat(balance) === 0) {
      console.log('⚠️  No balance to test sending');
      return;
    }
  } catch (error) {
    console.error('❌ Balance check failed:', error.message);
    return;
  }
  
  // Test 3: Get transaction history
  console.log('\n3️⃣ Testing transaction history...');
  try {
    const history = await dogeService.getTransactionHistory(TEST_CREDENTIALS.DOGE.address, 5);
    console.log(`✅ Found ${history.length} transactions`);
    if (history.length > 0) {
      console.log(`   Latest: ${history[0].txHash.substring(0, 20)}...`);
    }
  } catch (error) {
    console.error('❌ History failed:', error.message);
  }
  
  // Test 4: Send transaction
  console.log('\n4️⃣ Testing send transaction...');
  try {
    // Generate a new address to send to
    const recipient = await dogeService.generateWallet();
    console.log(`   Recipient: ${recipient.address}`);
    
    const txHash = await dogeService.sendTransaction(
      TEST_CREDENTIALS.DOGE.privateKey,
      recipient.address,
      10 // Send 10 DOGE (min recommended due to 1 DOGE fee)
    );
    console.log(`✅ Transaction sent! 🐕`);
    console.log(`   TX Hash: ${txHash}`);
    console.log(`   Explorer: https://sochain.com/tx/DOGETEST/${txHash}`);
  } catch (error) {
    console.error('❌ Send failed:', error.message);
  }
}

async function runAllTests() {
  console.log('\n🚀 STARTING COMPREHENSIVE TESTS');
  console.log('Testing: Wallet Generation + Balance + History + Send Transaction');
  
  await testBitcoin();
  await testLitecoin();
  await testDogecoin();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL TESTS COMPLETED');
  console.log('='.repeat(60));
}

runAllTests().catch(console.error);