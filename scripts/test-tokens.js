// scripts/test-tokens.js
require('dotenv').config();
const EthereumService = require('../src/services/blockchain/ethService');
const BscService = require('../src/services/blockchain/bscService');

// Test wallets (replace with your funded wallets)
const TEST_WALLETS = {
  ETH: {
    address: 'YOUR_ETH_ADDRESS',
    privateKey: 'YOUR_ETH_PRIVATE_KEY'
  },
  BSC: {
    address: 'YOUR_BSC_ADDRESS',
    privateKey: 'YOUR_BSC_PRIVATE_KEY'
  }
};

// Testnet tokens
const TOKENS = {
  ETH: {
    USDT: {
      address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
      decimals: 6
    },
    USDC: {
      address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
      decimals: 6
    }
  },
  BSC: {
    USDT: {
      address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
      decimals: 18
    },
    BUSD: {
      address: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
      decimals: 18
    }
  }
};

async function testERC20() {
  console.log('💎 Testing ERC20 Tokens on Ethereum Sepolia\n');
  
  const ethService = new EthereumService('testnet');
  
  // Check if wallet is configured
  if (TEST_WALLETS.ETH.privateKey === 'YOUR_ETH_PRIVATE_KEY') {
    console.log('⚠️  Please configure TEST_WALLETS.ETH in the script first.');
    console.log('   1. Generate wallet using: node scripts/test-eth-only.js');
    console.log('   2. Fund it with Sepolia ETH: https://sepoliafaucet.com/');
    console.log('   3. Get testnet tokens from faucets');
    console.log('   4. Update TEST_WALLETS.ETH in this script\n');
    return;
  }
  
  const { address, privateKey } = TEST_WALLETS.ETH;
  
  console.log(`Wallet: ${address}\n`);
  
  // Check ETH balance for gas
  const ethBalance = await ethService.getBalance(address);
  console.log(`ETH Balance: ${ethBalance} ETH (needed for gas)\n`);
  
  if (parseFloat(ethBalance) < 0.001) {
    console.log('⚠️  Need at least 0.001 ETH for gas fees.');
    return;
  }
  
  // Check USDT balance
  console.log('Checking USDT balance...');
  const usdtBalance = await ethService.getTokenBalance(address, TOKENS.ETH.USDT.address);
  console.log(`USDT Balance: ${usdtBalance}\n`);
  
  if (parseFloat(usdtBalance) < 10) {
    console.log('⚠️  Need at least 10 USDT for testing.');
    console.log('💡 Get testnet USDT from token faucets\n');
    return;
  }
  
  // Send USDT
  console.log('Testing USDT transfer...');
  try {
    const recipient = await ethService.generateWallet();
    console.log(`Recipient: ${recipient.address}`);
    
    const txId = await ethService.sendToken(
      privateKey,
      TOKENS.ETH.USDT.address,
      recipient.address,
      1,
      TOKENS.ETH.USDT.decimals
    );
    console.log(`✅ Success: ${txId}`);
    console.log(`Explorer: https://sepolia.etherscan.io/tx/${txId}\n`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
  }
}

async function testBEP20() {
  console.log('💛 Testing BEP20 Tokens on BSC Testnet\n');
  
  const bscService = new BscService('testnet');
  
  // Check if wallet is configured
  if (TEST_WALLETS.BSC.privateKey === 'YOUR_BSC_PRIVATE_KEY') {
    console.log('⚠️  Please configure TEST_WALLETS.BSC in the script first.');
    console.log('   1. Generate wallet using: node scripts/test-bsc-only.js');
    console.log('   2. Fund it with testnet BNB: https://testnet.bnbchain.org/faucet-smart');
    console.log('   3. Get testnet tokens from faucets');
    console.log('   4. Update TEST_WALLETS.BSC in this script\n');
    return;
  }
  
  const { address, privateKey } = TEST_WALLETS.BSC;
  
  console.log(`Wallet: ${address}\n`);
  
  // Check BNB balance for gas
  const bnbBalance = await bscService.getBalance(address);
  console.log(`BNB Balance: ${bnbBalance} BNB (needed for gas)\n`);
  
  if (parseFloat(bnbBalance) < 0.001) {
    console.log('⚠️  Need at least 0.001 BNB for gas fees.');
    return;
  }
  
  // Check USDT balance
  console.log('Checking USDT balance...');
  const usdtBalance = await bscService.getTokenBalance(address, TOKENS.BSC.USDT.address);
  console.log(`USDT Balance: ${usdtBalance}\n`);
  
  if (parseFloat(usdtBalance) < 10) {
    console.log('⚠️  Need at least 10 USDT for testing.');
    console.log('💡 Get testnet USDT from token faucets\n');
    return;
  }
  
  // Send USDT
  console.log('Testing USDT transfer...');
  try {
    const recipient = await bscService.generateWallet();
    console.log(`Recipient: ${recipient.address}`);
    
    const txId = await bscService.sendToken(
      privateKey,
      TOKENS.BSC.USDT.address,
      recipient.address,
      1,
      TOKENS.BSC.USDT.decimals
    );
    console.log(`✅ Success: ${txId}`);
    console.log(`Explorer: https://testnet.bscscan.com/tx/${txId}\n`);
  } catch (error) {
    console.log(`❌ Failed: ${error.message}\n`);
  }
}

async function runTests() {
  await testERC20();
  console.log('='.repeat(60) + '\n');
  await testBEP20();
  console.log('\n✅ All token tests complete!');
}

runTests().catch(console.error);