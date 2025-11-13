// scripts/test-eth-only.js
require('dotenv').config();
const EthereumService = require('../src/services/blockchain/ethService');

// Common testnet ERC20 tokens on Sepolia
const TESTNET_TOKENS = {
  USDT: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', // Sepolia USDT
  USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // Sepolia USDC
  DAI: '0x68194a729C2450ad26072b3D33ADaCbcef39D574'   // Sepolia DAI
};

async function testEth() {
  console.log('💎 Testing ETHEREUM (Sepolia Testnet)\n');
  
  const ethService = new EthereumService('testnet');
  
  // 1. Generate wallet
  console.log('1️⃣ Generating wallet...');
  const wallet = await ethService.generateWallet();
  console.log(`   Address: ${wallet.address}`);
  console.log(`   Private Key: ${wallet.privateKey}\n`);
  
  // 2. Check ETH balance
  console.log('2️⃣ Checking ETH balance...');
  const balance = await ethService.getBalance(wallet.address);
  console.log(`   Balance: ${balance} ETH\n`);
  
  if (parseFloat(balance) < 0.01) {
    console.log('⚠️  Need at least 0.01 ETH for testing.');
    console.log('💡 Get testnet ETH from: https://sepoliafaucet.com/');
    console.log('\nℹ️  Save this wallet for testing:');
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Private Key: ${wallet.privateKey}`);
    return;
  }
  
  // 3. Test ETH transfer
  console.log('3️⃣ Testing send 0.001 ETH...');
  try {
    const recipient = await ethService.generateWallet();
    console.log(`   Recipient: ${recipient.address}`);
    
    const txId = await ethService.sendTransaction(
      wallet.privateKey,
      recipient.address,
      0.001
    );
    console.log(`   ✅ Success: ${txId}`);
    console.log(`   Explorer: https://sepolia.etherscan.io/tx/${txId}\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }
  
  // 4. Check token balances
  console.log('4️⃣ Checking ERC20 token balances...');
  for (const [symbol, address] of Object.entries(TESTNET_TOKENS)) {
    try {
      const tokenBalance = await ethService.getTokenBalance(wallet.address, address);
      console.log(`   ${symbol}: ${tokenBalance}`);
    } catch (error) {
      console.log(`   ${symbol}: Error - ${error.message}`);
    }
  }
  console.log();
  
  console.log('✅ ETH tests complete!');
}

testEth().catch(console.error);