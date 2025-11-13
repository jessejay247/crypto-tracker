// ============ BTC SERVICE ============
// src/services/blockchain/btcService.js
const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const ecc = require('@bitcoinerlab/secp256k1');
const axios = require('axios');

const ECPair = ECPairFactory(ecc);
bitcoin.initEccLib(ecc);

class BitcoinService {
  constructor(network = 'mainnet') {
    this.network = network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
    this.isTestnet = network === 'testnet';
    this.tatumApiKey = this.isTestnet 
      ? process.env.TATUM_TESTNET_API_KEY 
      : process.env.TATUM_MAINNET_API_KEY;
    this.tatumBaseUrl = 'https://api.tatum.io/v3';
  }

  async generateWallet() {
    const keyPair = ECPair.makeRandom({ network: this.network });
    const { address } = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network: this.network });
    return { address, privateKey: keyPair.toWIF(), publicKey: keyPair.publicKey.toString('hex') };
  }

  async getBalance(address) {
    try {
      const { data } = await axios.get(`${this.tatumBaseUrl}/bitcoin/address/balance/${address}`, {
        headers: { 'x-api-key': this.tatumApiKey }, timeout: 15000
      });
      return data.incoming || '0';
    } catch (error) {
      console.error('BTC balance error:', error.response?.data || error.message);
      return '0';
    }
  }

  async getTransactionHistory(address, limit = 50) {
    try {
      const { data } = await axios.get(`${this.tatumBaseUrl}/bitcoin/transaction/address/${address}`, {
        headers: { 'x-api-key': this.tatumApiKey }, params: { pageSize: limit }, timeout: 15000
      });
      return (data || []).map(tx => ({
        txHash: tx.hash,
        confirmations: tx.confirmations || 0,
        time: new Date(tx.time * 1000),
        value: this.calculateTxValue(tx, address),
        status: tx.confirmations > 0 ? 'confirmed' : 'pending'
      }));
    } catch (error) {
      return [];
    }
  }

  async sendTransaction(privateKey, toAddress, amount) {
    try {
      const keyPair = ECPair.fromWIF(privateKey, this.network);
      const { address: fromAddress } = bitcoin.payments.p2wpkh({ 
        pubkey: keyPair.publicKey, 
        network: this.network 
      });

      // Check balance first
      const balance = await this.getBalance(fromAddress);
      console.log(`BTC Address ${fromAddress} has ${balance} BTC`);
      
      if (parseFloat(balance) < parseFloat(amount) + 0.0001) {
        throw new Error(`Insufficient balance. Have: ${balance} BTC, Need: ${parseFloat(amount) + 0.0001} BTC (with fee)`);
      }

      const { data } = await axios.post(`${this.tatumBaseUrl}/bitcoin/transaction`, {
        fromAddress: [{
          address: fromAddress,
          privateKey: privateKey
        }],
        to: [{
          address: toAddress,
          value: parseFloat(amount)
        }]
      }, {
        headers: { 
          'x-api-key': this.tatumApiKey, 
          'Content-Type': 'application/json' 
        }, 
        timeout: 30000
      });
      
      console.log('✅ BTC transaction:', data.txId);
      return data.txId;
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      console.error('BTC send error:', errMsg);
      if (errMsg.includes('broadcast')) {
        throw new Error('Transaction broadcast failed. UTXOs may be pending confirmation. Wait 10 minutes and retry, or fund address with more testnet BTC.');
      }
      throw new Error(errMsg);
    }
  }

  calculateTxValue(tx, address) {
    let received = 0, sent = 0;
    if (tx.outputs) for (const o of tx.outputs) if (o.address === address) received += parseFloat(o.value);
    if (tx.inputs?.some(i => i.coin?.address === address) && tx.outputs) for (const o of tx.outputs) sent += parseFloat(o.value);
    return (received - sent).toString();
  }

  validateAddress(address) {
    try { bitcoin.address.toOutputScript(address, this.network); return true; } catch { return false; }
  }
}

module.exports = BitcoinService;


