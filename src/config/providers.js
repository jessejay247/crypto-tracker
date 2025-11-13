// src/config/providers.js
const { ethers } = require('ethers');
const { Connection, clusterApiUrl } = require('@solana/web3.js');

class RPCProvider {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
  }

  async call(method, params = []) {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
  }
}

// Testnet Providers
const testnet = {
  // Ethereum Sepolia
  eth: new ethers.JsonRpcProvider(
    process.env.ETH_TESTNET_RPC_URL || 'https://eth-sepolia.public.blastapi.io'
  ),

  // Polygon Amoy (Testnet)
  polygon: new ethers.JsonRpcProvider(
    process.env.POLYGON_TESTNET_RPC_URL || 'https://rpc-amoy.polygon.technology'
  ),

  // BSC Testnet
  bsc: new ethers.JsonRpcProvider(
    process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545'
  ),

  // Solana Devnet
  solana: new Connection(
    process.env.SOLANA_DEVNET_RPC_URL || clusterApiUrl('devnet'),
    'confirmed'
  ),

  // Dash Testnet
  dash: new RPCProvider(
    process.env.DASH_TESTNET_RPC || 'https://testnet-insight.dash.org/insight-api'
  ),

  // ZCash Testnet
  zec: new RPCProvider(
    process.env.ZEC_TESTNET_RPC || 'https://api.tatum.io/v3/blockchain/node/zcash-testnet'
  ),

  // Monero Testnet
  xmr: new RPCProvider(
    process.env.XMR_TESTNET_RPC || 'https://testnet.xmr.ditatompel.com'
  )
};

// Mainnet Providers
const mainnet = {
  // Ethereum Mainnet
  eth: new ethers.JsonRpcProvider(
    process.env.ETH_RPC_URL || 'https://eth.llamarpc.com'
  ),

  // Polygon Mainnet
  polygon: new ethers.JsonRpcProvider(
    process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'
  ),

  // BSC Mainnet
  bsc: new ethers.JsonRpcProvider(
    process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org'
  ),

  // Solana Mainnet
  solana: new Connection(
    process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'),
    'confirmed'
  ),

  // Dash Mainnet
  dash: new RPCProvider(
    process.env.DASH_RPC_URL || 'https://insight.dash.org/insight-api'
  ),

  // ZCash Mainnet
  zec: new RPCProvider(
    process.env.ZEC_MAINNET_RPC || 'https://api.zcha.in'
  ),

  // Monero Mainnet
  xmr: new RPCProvider(
    process.env.XMR_MAINNET_RPC || 'https://xmr.getblock.io/mainnet'
  )
};

// Blockchain explorers
const explorers = {
  testnet: {
    BTC: 'https://blockstream.info/testnet',
    ETH: 'https://sepolia.etherscan.io',
    POLYGON: 'https://amoy.polygonscan.com',
    BSC: 'https://testnet.bscscan.com',
    SOL: 'https://explorer.solana.com/?cluster=devnet',
    TRX: 'https://shasta.tronscan.org',
    LTC: 'https://blockexplorer.one/litecoin/testnet',
    DOGE: 'https://sochain.com/testnet/doge',
    XRP: 'https://livenet.xrpl.org'
  },
  mainnet: {
    BTC: 'https://blockstream.info',
    ETH: 'https://etherscan.io',
    POLYGON: 'https://polygonscan.com',
    BSC: 'https://bscscan.com',
    SOL: 'https://explorer.solana.com',
    TRX: 'https://tronscan.org',
    LTC: 'https://blockexplorer.one/litecoin/mainnet',
    DOGE: 'https://dogechain.info',
    XRP: 'https://testnet.xrpl.org'
  }
};

// Get provider based on environment
function getProvider(network, environment = 'testnet') {
  const env = environment === 'mainnet' ? mainnet : testnet;
  const networkLower = network.toLowerCase();
  
  if (!env[networkLower]) {
    throw new Error(`Provider not configured for ${network} on ${environment}`);
  }
  
  return env[networkLower];
}

// Get explorer URL
function getExplorerUrl(network, txHash, environment = 'testnet') {
  const env = explorers[environment];
  const base = env[network.toUpperCase()];
  
  if (!base) return null;
  
  return `${base}/tx/${txHash}`;
}

// Check provider health
async function checkProviderHealth(network, environment = 'testnet') {
  try {
    const provider = getProvider(network, environment);
    
    if (provider instanceof ethers.JsonRpcProvider) {
      const blockNumber = await provider.getBlockNumber();
      return { healthy: true, blockNumber };
    } else if (provider instanceof Connection) {
      const slot = await provider.getSlot();
      return { healthy: true, slot };
    }
    
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

module.exports = {
  testnet,
  mainnet,
  explorers,
  getProvider,
  getExplorerUrl,
  checkProviderHealth,
  RPCProvider
};