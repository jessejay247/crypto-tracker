// scripts/test-sol-only.js
require('dotenv').config();
const SolanaService = require('../src/services/blockchain/solService');

// Common SPL tokens on Devnet
const TESTNET_TOKENS = {
  USDC: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', // Devnet USDC
  USDT: 'EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS'  // Devnet USDT (example)
};

async function testSol() {
  console.log('☀️ Testing SOLANA (Devnet)\n');
  
  const solService = new SolanaService('testnet');
  
  // 1. Generate wallet
  console.log('1️⃣ Generating wallet...');
  const wallet = await solService.generateWallet();
  console.log(`   Address: ${wallet.address}`);
  console.log(`   Private Key: ${wallet.privateKey}\n`);
  
  // 2. Check SOL balance
  console.log('2️⃣ Checking SOL balance...');
  const balance = await solService.getBalance(wallet.address);
  console.log(`   Balance: ${balance} SOL\n`);
  
  if (parseFloat(balance) < 0.1) {
    console.log('⚠️  Need at least 0.1 SOL for testing.');
    console.log('💡 Get devnet SOL:');
    console.log('   Method 1: solana airdrop 1 ' + wallet.address + ' --url devnet');
    console.log('   Method 2: https://faucet.solana.com/');
    console.log('\nℹ️  Save this wallet for testing:');
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Private Key: ${wallet.privateKey}`);
    return;
  }
  
  // 3. Test SOL transfer
  console.log('3️⃣ Testing send 0.01 SOL...');
  try {
    const recipient = await solService.generateWallet();
    console.log(`   Recipient: ${recipient.address}`);
    
    const txId = await solService.sendTransaction(
      wallet.privateKey,
      recipient.address,
      0.01
    );
    console.log(`   ✅ Success: ${txId}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${txId}?cluster=devnet\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }
  
  // 4. Check SPL token balances
  console.log('4️⃣ Checking SPL token balances...');
  for (const [symbol, address] of Object.entries(TESTNET_TOKENS)) {
    try {
      const tokenBalance = await solService.getTokenBalance(wallet.address, address);
      console.log(`   ${symbol}: ${tokenBalance}`);
    } catch (error) {
      console.log(`   ${symbol}: Error - ${error.message}`);
    }
  }
  console.log();
  
  console.log('✅ SOL tests complete!');
}

testSol().catch(console.error);