// scripts/test-polygon-tokens.js
require('dotenv').config();
const PolygonService = require('../src/services/blockchain/polygonService');

// Test wallet (replace with your funded wallet)
const TEST_WALLET = {
  address: 'YOUR_POLYGON_ADDRESS',
  privateKey: 'YOUR_POLYGON_PRIVATE_KEY'
};

// Testnet tokens on Polygon Amoy
const TOKENS = {
  USDT: {
    address: '0x3813e82e6f7098b9583FC0F33a962D02018B6803',
    decimals: 6
  },
  USDC: {
    address: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97',
    decimals: 6
  },
  WETH: {
    address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    decimals: 18
  }
};

async function testPolygonTokens() {
  console.log('💜 Testing ERC20 Tokens on Polygon Amoy Testnet\n');
  
  const polygonService = new PolygonService('testnet');
  
  // Check if wallet is configured
  if (TEST_WALLET.privateKey === 'YOUR_POLYGON_PRIVATE_KEY') {
    console.log('⚠️  Please configure TEST_WALLET in the script first.');
    console.log('   1. Generate wallet using: node scripts/test-polygon-only.js');
    console.log('   2. Fund it with Amoy MATIC:');
    console.log('      - https://faucet.polygon.technology/');
    console.log('      - https://www.alchemy.com/faucets/polygon-amoy');
    console.log('   3. Get testnet ERC20 tokens from faucets');
    console.log('   4. Update TEST_WALLET in this script\n');
    return;
  }
  
  const { address, privateKey } = TEST_WALLET;
  
  console.log(`Wallet: ${address}\n`);
  
  // Check MATIC balance for gas
  const maticBalance = await polygonService.getBalance(address);
  console.log(`MATIC Balance: ${maticBalance} MATIC (needed for gas)\n`);
  
  if (parseFloat(maticBalance) < 0.01) {
    console.log('⚠️  Need at least 0.01 MATIC for gas fees.');
    return;
  }
  
  // Check all token balances
  console.log('Checking token balances...');
  for (const [symbol, token] of Object.entries(TOKENS)) {
    try {
      const tokenBalance = await polygonService.getTokenBalance(address, token.address);
      console.log(`${symbol}: ${tokenBalance}`);
    } catch (error) {
      console.log(`${symbol}: Error - ${error.message}`);
    }
  }
  console.log();
  
  // Check USDT balance
  const usdtBalance = await polygonService.getTokenBalance(address, TOKENS.USDT.address);
  
  if (parseFloat(usdtBalance) < 1) {
    console.log('⚠️  Need at least 1 USDT for testing.');
    console.log('💡 Get testnet USDT from:');
    console.log('   - https://faucet.polygon.technology/');
    console.log('   - ERC20 token faucets for Polygon Amoy\n');
    return;
  }
  
  // Send USDT
  console.log('Testing USDT transfer...');
  try {
    const recipient = await polygonService.generateWallet();
    console.log(`Recipient: ${recipient.address}`);
    
    const txId = await polygonService.sendToken(
      privateKey,
      TOKENS.USDT.address,
      recipient.address,
      0.1,
      TOKENS.USDT.decimals
    );
    console.log(`✅ Success: ${txId}`);
    console.log(`Explorer: https://amoy.polygonscan.com/tx/${txId}\n`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
  }
  
  console.log('✅ Polygon token tests complete!');
}

testPolygonTokens().catch(console.error);