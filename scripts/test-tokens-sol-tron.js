// scripts/test-tokens-sol-tron.js
require('dotenv').config();
const SolanaService = require('../src/services/blockchain/solService');
const TronService = require('../src/services/blockchain/tronService');

// Test wallets (replace with your funded wallets)
const TEST_WALLETS = {
  SOL: {
    address: 'YOUR_SOL_ADDRESS',
    privateKey: 'YOUR_SOL_PRIVATE_KEY'
  },
  TRX: {
    address: 'YOUR_TRX_ADDRESS',
    privateKey: 'YOUR_TRX_PRIVATE_KEY'
  }
};

// Testnet tokens
const TOKENS = {
  SOL: {
    USDC: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
    USDT: 'EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS'
  },
  TRX: {
    USDT: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
    USDC: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8'
  }
};

async function testSPL() {
  console.log('☀️ Testing SPL Tokens on Solana Devnet\n');
  
  const solService = new SolanaService('testnet');
  
  // Check if wallet is configured
  if (TEST_WALLETS.SOL.privateKey === 'YOUR_SOL_PRIVATE_KEY') {
    console.log('⚠️  Please configure TEST_WALLETS.SOL in the script first.');
    console.log('   1. Generate wallet using: node scripts/test-sol-only.js');
    console.log('   2. Fund it with devnet SOL: solana airdrop 1 <ADDRESS> --url devnet');
    console.log('   3. Get testnet SPL tokens from faucets');
    console.log('   4. Update TEST_WALLETS.SOL in this script\n');
    return;
  }
  
  const { address, privateKey } = TEST_WALLETS.SOL;
  
  console.log(`Wallet: ${address}\n`);
  
  // Check SOL balance for gas
  const solBalance = await solService.getBalance(address);
  console.log(`SOL Balance: ${solBalance} SOL (needed for gas)\n`);
  
  if (parseFloat(solBalance) < 0.01) {
    console.log('⚠️  Need at least 0.01 SOL for transaction fees.');
    return;
  }
  
  // Check USDC balance
  console.log('Checking USDC balance...');
  const usdcBalance = await solService.getTokenBalance(address, TOKENS.SOL.USDC);
  console.log(`USDC Balance: ${usdcBalance}\n`);
  
  if (parseFloat(usdcBalance) < 1) {
    console.log('⚠️  Need at least 1 USDC for testing.');
    console.log('💡 Get testnet USDC from SPL token faucets\n');
    return;
  }
  
  // Send USDC
  console.log('Testing USDC transfer...');
  try {
    const recipient = await solService.generateWallet();
    console.log(`Recipient: ${recipient.address}`);
    
    const txId = await solService.sendToken(
      privateKey,
      TOKENS.SOL.USDC,
      recipient.address,
      0.1
    );
    console.log(`✅ Success: ${txId}`);
    console.log(`Explorer: https://explorer.solana.com/tx/${txId}?cluster=devnet\n`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
  }
}

async function testTRC20() {
  console.log('🔴 Testing TRC20 Tokens on Tron Shasta Testnet\n');
  
  const tronService = new TronService('testnet');
  
  // Check if wallet is configured
  if (TEST_WALLETS.TRX.privateKey === 'YOUR_TRX_PRIVATE_KEY') {
    console.log('⚠️  Please configure TEST_WALLETS.TRX in the script first.');
    console.log('   1. Generate wallet using: node scripts/test-tron-only.js');
    console.log('   2. Fund it with testnet TRX: https://www.trongrid.io/shasta');
    console.log('   3. Get testnet TRC20 tokens from faucets');
    console.log('   4. Update TEST_WALLETS.TRX in this script\n');
    return;
  }
  
  const { address, privateKey } = TEST_WALLETS.TRX;
  
  console.log(`Wallet: ${address}\n`);
  
  // Check TRX balance for gas
  const trxBalance = await tronService.getBalance(address);
  console.log(`TRX Balance: ${trxBalance} TRX (needed for gas)\n`);
  
  if (parseFloat(trxBalance) < 10) {
    console.log('⚠️  Need at least 10 TRX for transaction fees.');
    return;
  }
  
  // Check USDT balance
  console.log('Checking USDT balance...');
  const usdtBalance = await tronService.getTokenBalance(address, TOKENS.TRX.USDT);
  console.log(`USDT Balance: ${usdtBalance}\n`);
  
  if (parseFloat(usdtBalance) < 1) {
    console.log('⚠️  Need at least 1 USDT for testing.');
    console.log('💡 Get testnet USDT from TRC20 token faucets\n');
    return;
  }
  
  // Send USDT
  console.log('Testing USDT transfer...');
  try {
    const recipient = await tronService.generateWallet();
    console.log(`Recipient: ${recipient.address}`);
    
    const txId = await tronService.sendToken(
      privateKey,
      TOKENS.TRX.USDT,
      recipient.address,
      0.1,
      6 // USDT has 6 decimals
    );
    console.log(`✅ Success: ${txId}`);
    console.log(`Explorer: https://shasta.tronscan.org/#/transaction/${txId}\n`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
  }
}

async function runTests() {
  await testSPL();
  console.log('='.repeat(60) + '\n');
  await testTRC20();
  console.log('\n✅ All token tests complete!');
}

runTests().catch(console.error);