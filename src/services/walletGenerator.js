// src/services/walletGenerator.js
const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const ecc = require('@bitcoinerlab/secp256k1');
const { ethers } = require('ethers');
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const TronWeb = require('tronweb');

const ECPair = ECPairFactory(ecc);
bitcoin.initEccLib(ecc);

// Network configurations
const NETWORKS = {
  BTC: {
    mainnet: bitcoin.networks.bitcoin,
    testnet: bitcoin.networks.testnet
  },
  LTC: {
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
    }
  },
  DOGE: {
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
    }
  }
};

class WalletGenerator {
  /**
   * Generate Bitcoin wallet
   */
  static async generateBTC(network = 'mainnet') {
    const net = NETWORKS.BTC[network];
    const keyPair = ECPair.makeRandom({ network: net });
    const { address } = bitcoin.payments.p2wpkh({ 
      pubkey: keyPair.publicKey, 
      network: net 
    });

    return {
      address,
      privateKey: keyPair.toWIF(),
      publicKey: keyPair.publicKey.toString('hex'),
      network: network
    };
  }

  /**
   * Generate Litecoin wallet
   */
  static async generateLTC(network = 'mainnet') {
    const net = NETWORKS.LTC[network];
    const keyPair = ECPair.makeRandom({ network: net });
    const { address } = bitcoin.payments.p2wpkh({ 
      pubkey: keyPair.publicKey, 
      network: net 
    });

    return {
      address,
      privateKey: keyPair.toWIF(),
      publicKey: keyPair.publicKey.toString('hex'),
      network: network
    };
  }

  /**
   * Generate Dogecoin wallet
   */
  static async generateDOGE(network = 'mainnet') {
    const net = NETWORKS.DOGE[network];
    const keyPair = ECPair.makeRandom({ network: net });
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: keyPair.publicKey, 
      network: net 
    });

    return {
      address,
      privateKey: keyPair.toWIF(),
      publicKey: keyPair.publicKey.toString('hex'),
      network: network
    };
  }

  /**
   * Generate Ethereum/Polygon/BSC wallet (EVM compatible)
   */
  static async generateEVM() {
    const wallet = ethers.Wallet.createRandom();
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
      mnemonic: wallet.mnemonic.phrase
    };
  }

  /**
   * Generate Solana wallet
   */
  static async generateSOL() {
    const keypair = Keypair.generate();
    
    return {
      address: keypair.publicKey.toString(),
      privateKey: bs58.encode(keypair.secretKey),
      publicKey: keypair.publicKey.toString()
    };
  }

  /**
   * Generate Tron wallet
   */
  static async generateTRX() {
    const account = await TronWeb.createAccount();
    
    return {
      address: account.address.base58,
      privateKey: account.privateKey,
      publicKey: account.publicKey
    };
  }

  /**
   * Universal wallet generator
   */
  static async generate(network, environment = 'mainnet') {
    const networkUpper = network.toUpperCase();
    
    switch(networkUpper) {
      case 'BTC':
        return await this.generateBTC(environment);
      case 'LTC':
        return await this.generateLTC(environment);
      case 'DOGE':
        return await this.generateDOGE(environment);
      case 'ETH':
      case 'POLYGON':
      case 'BSC':
      case 'MATIC':
      case 'BNB':
        const evmWallet = await this.generateEVM();
        return { ...evmWallet, network: networkUpper };
      case 'SOL':
        const solWallet = await this.generateSOL();
        return { ...solWallet, network: 'SOL' };
      case 'TRX':
        const trxWallet = await this.generateTRX();
        return { ...trxWallet, network: 'TRX' };
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  /**
   * Validate address format
   */
static validateAddress(address, network) {
  const networkUpper = network.toUpperCase();
  
  try {
    switch(networkUpper) {
      case 'BTC':
        bitcoin.address.toOutputScript(address, NETWORKS.BTC.testnet);
        return true;
      case 'LTC':
        bitcoin.address.toOutputScript(address, NETWORKS.LTC.testnet);
        return true;
      case 'DOGE':
        bitcoin.address.toOutputScript(address, NETWORKS.DOGE.testnet);
        return true;
      case 'ETH':
      case 'POLYGON':
      case 'BSC':
        return ethers.isAddress(address);
      case 'SOL':
        return address.length >= 32 && address.length <= 44;
      case 'TRX':
        return TronWeb.isAddress(address);
      default:
        return false;
    }
  } catch (error) {
    return false;
  }
}
}

module.exports = WalletGenerator;