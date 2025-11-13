// backend/src/config/networks.js
/**
 * Network Configurations for All Supported Blockchains
 * Uses FREE public APIs - NO Tatum required
 */

const bitcoin = require('bitcoinjs-lib');

// Bitcoin Network Parameters
const BITCOIN = {
  mainnet: bitcoin.networks.bitcoin,
  testnet: bitcoin.networks.testnet,
  api: {
    mainnet: process.env.BTC_MAINNET_API || 'https://blockstream.info/api',
    testnet: process.env.BTC_TESTNET_API || 'https://blockstream.info/testnet/api'
  },
  explorer: {
    mainnet: 'https://blockstream.info',
    testnet: 'https://blockstream.info/testnet'
  },
  faucet: 'https://coinfaucet.eu/en/btc-testnet/'
};

// Update backend/src/config/networks.js

// Replace LITECOIN configuration:
const LITECOIN = {
  mainnet: {
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'ltc',
    bip32: { public: 0x019da462, private: 0x019d9cfe },
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0
  },
  testnet: {
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'tltc',
    bip32: { public: 0x043587cf, private: 0x04358394 },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef
  },
  api: {
    // Use BlockCypher for both mainnet and testnet
    mainnet: 'https://api.blockcypher.com/v1/ltc/main',
    testnet: 'https://api.blockcypher.com/v1/ltc/test3'
  },
  explorer: {
    mainnet: 'https://live.blockcypher.com/ltc',
    testnet: 'https://live.blockcypher.com/ltc-testnet'
  },
  faucet: 'https://testnet-faucet.com/ltc-testnet/'
};

// Replace DOGECOIN configuration:
const DOGECOIN = {
  mainnet: {
    messagePrefix: '\x19Dogecoin Signed Message:\n',
    bech32: 'doge',
    bip32: { public: 0x02facafd, private: 0x02fac398 },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e
  },
  testnet: {
    messagePrefix: '\x19Dogecoin Signed Message:\n',
    bech32: 'tdge',
    bip32: { public: 0x043587cf, private: 0x04358394 },
    pubKeyHash: 0x71,
    scriptHash: 0xc4,
    wif: 0xf1
  },
  api: {
    // Use QED Electrs API for testnet, BlockCypher for mainnet
    base: 'https://doge-testnet-explorer.qed.me/api',
    mainnet: 'https://api.blockcypher.com/v1/doge/main',
    testnet: 'https://doge-testnet-explorer.qed.me/api'
  },
  explorer: {
    mainnet: 'https://dogechain.info',
    testnet: 'https://doge-testnet-explorer.qed.me'
  },
  faucet: 'https://testnet-faucet.com/doge-testnet/',
  fixedFee: 1e8, // 1 DOGE
  dustLimit: 1e8 // 1 DOGE
};

// Ethereum RPC URLs
const ETHEREUM = {
  rpc: {
    mainnet: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
    testnet: process.env.ETH_TESTNET_RPC_URL || 'https://eth-sepolia.public.blastapi.io'
  },
  explorer: {
    mainnet: 'https://etherscan.io',
    testnet: 'https://sepolia.etherscan.io'
  },
  explorerApi: {
    mainnet: 'https://api.etherscan.io/api',
    testnet: 'https://api-sepolia.etherscan.io/api'
  },
  faucet: 'https://sepoliafaucet.com/',
  chainId: {
    mainnet: 1,
    testnet: 11155111 // Sepolia
  }
};

// Polygon RPC URLs
const POLYGON = {
  rpc: {
    mainnet: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    testnet: process.env.POLYGON_TESTNET_RPC_URL || 'https://rpc-amoy.polygon.technology'
  },
  explorer: {
    mainnet: 'https://polygonscan.com',
    testnet: 'https://amoy.polygonscan.com'
  },
  explorerApi: {
    mainnet: 'https://api.polygonscan.com/api',
    testnet: 'https://api-amoy.polygonscan.com/api'
  },
  faucet: 'https://faucet.polygon.technology/',
  chainId: {
    mainnet: 137,
    testnet: 80002 // Amoy
  }
};

// BSC RPC URLs
const BSC = {
  rpc: {
    mainnet: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    testnet: process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545'
  },
  explorer: {
    mainnet: 'https://bscscan.com',
    testnet: 'https://testnet.bscscan.com'
  },
  explorerApi: {
    mainnet: 'https://api.bscscan.com/api',
    testnet: 'https://api-testnet.bscscan.com/api'
  },
  faucet: 'https://testnet.bnbchain.org/faucet-smart',
  chainId: {
    mainnet: 56,
    testnet: 97
  }
};

// Solana RPC URLs
const SOLANA = {
  rpc: {
    mainnet: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    testnet: process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com'
  },
  explorer: {
    mainnet: 'https://explorer.solana.com',
    testnet: 'https://explorer.solana.com/?cluster=devnet'
  },
  faucet: 'https://faucet.solana.com/',
  faucetCommand: 'solana airdrop 2 <ADDRESS> --url devnet'
};

// Tron Configuration
const TRON = {
  fullNode: {
    mainnet: process.env.TRON_MAINNET_URL || 'https://api.trongrid.io',
    testnet: process.env.TRON_TESTNET_URL || 'https://api.shasta.trongrid.io'
  },
  solidityNode: {
    mainnet: process.env.TRON_MAINNET_URL || 'https://api.trongrid.io',
    testnet: process.env.TRON_TESTNET_URL || 'https://api.shasta.trongrid.io'
  },
  eventServer: {
    mainnet: process.env.TRON_MAINNET_URL || 'https://api.trongrid.io',
    testnet: process.env.TRON_TESTNET_URL || 'https://api.shasta.trongrid.io'
  },
  explorer: {
    mainnet: 'https://tronscan.org',
    testnet: 'https://shasta.tronscan.org'
  },
  faucet: 'https://www.trongrid.io/shasta'
};

// Dash Configuration
const DASH = {
  mainnet: {
    messagePrefix: '\x19DarkCoin Signed Message:\n',
    bech32: 'dash',
    bip32: { public: 0x0488b21e, private: 0x0488ade4 },
    pubKeyHash: 0x4c,
    scriptHash: 0x10,
    wif: 0xcc
  },
  testnet: {
    messagePrefix: '\x19DarkCoin Signed Message:\n',
    bech32: 'tdash',
    bip32: { public: 0x043587cf, private: 0x04358394 },
    pubKeyHash: 0x8c,
    scriptHash: 0x13,
    wif: 0xef
  },
  api: {
    mainnet: process.env.DASH_MAINNET_API || 'https://insight.dash.org/insight-api',
    testnet: process.env.DASH_TESTNET_API || 'https://testnet-insight.dashevo.org/insight-api'
  },
  explorer: {
    mainnet: 'https://insight.dash.org',
    testnet: 'https://testnet-insight.dashevo.org'
  },
  faucet: 'http://faucet.test.dash.org/'
};

// Export all configurations
module.exports = {
  BITCOIN,
  LITECOIN,
  DOGECOIN,
  ETHEREUM,
  POLYGON,
  BSC,
  SOLANA,
  TRON,
  DASH,
  
  // Supported networks list
  SUPPORTED_NETWORKS: ['BTC', 'LTC', 'DOGE', 'ETH', 'POLYGON', 'BSC', 'SOL', 'TRX', 'DASH', 'XRP'],
  
  // Get configuration for a specific network
  getConfig: (network) => {
    const configs = {
      BTC: BITCOIN,
      LTC: LITECOIN,
      DOGE: DOGECOIN,
      ETH: ETHEREUM,
      POLYGON: POLYGON,
      MATIC: POLYGON, // Alias
      BSC: BSC,
      BNB: BSC, // Alias
      SOL: SOLANA,
      TRX: TRON,
      DASH: DASH,
      // XRP: RIPPLE
    };
    return configs[network.toUpperCase()];
  }
};