// ============ LTC SERVICE ============
// src/services/blockchain/ltcService.js  
const bitcoin2 = require('bitcoinjs-lib');
const { ECPairFactory: ECPairFactory2 } = require('ecpair');
const ecc2 = require('@bitcoinerlab/secp256k1');
const axios2 = require('axios');

const ECPair2 = ECPairFactory2(ecc2);
bitcoin2.initEccLib(ecc2);

class LitecoinService {
  constructor(network = 'mainnet') {
    const LITECOIN = {
      mainnet: { messagePrefix: '\x19Litecoin Signed Message:\n', bech32: 'ltc', bip32: { public: 0x019da462, private: 0x019d9cfe }, pubKeyHash: 0x30, scriptHash: 0x32, wif: 0xb0 },
      testnet: { messagePrefix: '\x19Litecoin Signed Message:\n', bech32: 'tltc', bip32: { public: 0x043587cf, private: 0x04358394 }, pubKeyHash: 0x6f, scriptHash: 0xc4, wif: 0xef }
    };
    this.network = network === 'mainnet' ? LITECOIN.mainnet : LITECOIN.testnet;
    this.isTestnet = network === 'testnet';
    this.tatumApiKey = this.isTestnet 
      ? process.env.TATUM_TESTNET_API_KEY 
      : process.env.TATUM_MAINNET_API_KEY;
    this.tatumBaseUrl = 'https://api.tatum.io/v3';
  }

  async generateWallet() {
    const keyPair = ECPair2.makeRandom({ network: this.network });
    const { address } = bitcoin2.payments.p2wpkh({ pubkey: keyPair.publicKey, network: this.network });
    return { address, privateKey: keyPair.toWIF(), publicKey: keyPair.publicKey.toString('hex') };
  }

  async getBalance(address) {
    try {
      const { data } = await axios2.get(`${this.tatumBaseUrl}/litecoin/address/balance/${address}`, {
        headers: { 'x-api-key': this.tatumApiKey }, timeout: 15000
      });
      return data.incoming || '0';
    } catch (error) { return '0'; }
  }

  async getTransactionHistory(address, limit = 50) {
    try {
      const { data } = await axios2.get(`${this.tatumBaseUrl}/litecoin/transaction/address/${address}`, {
        headers: { 'x-api-key': this.tatumApiKey }, params: { pageSize: limit }, timeout: 15000
      });
      return (data || []).map(tx => ({
        txHash: tx.hash, confirmations: tx.confirmations || 0, time: new Date(tx.time * 1000),
        value: this.calculateTxValue(tx, address), status: tx.confirmations > 0 ? 'confirmed' : 'pending'
      }));
    } catch { return []; }
  }

  async sendTransaction(privateKey, toAddress, amount) {
    try {
      const keyPair = ECPair2.fromWIF(privateKey, this.network);
      const { address: fromAddress } = bitcoin2.payments.p2wpkh({ 
        pubkey: keyPair.publicKey, 
        network: this.network 
      });

      // Check balance first
      const balance = await this.getBalance(fromAddress);
      console.log(`LTC Address ${fromAddress} has ${balance} LTC`);
      
      if (parseFloat(balance) < parseFloat(amount) + 0.001) {
        throw new Error(`Insufficient balance. Have: ${balance} LTC, Need: ${parseFloat(amount) + 0.001} LTC (with fee)`);
      }

      const { data } = await axios2.post(`${this.tatumBaseUrl}/litecoin/transaction`, {
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
      
      console.log('✅ LTC transaction:', data.txId);
      return data.txId;
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      console.error('LTC send error:', errMsg);
      if (errMsg.includes('broadcast')) {
        throw new Error('Transaction broadcast failed. UTXOs may be pending confirmation. Wait 10 minutes and retry, or fund address with more testnet LTC.');
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
    try { bitcoin2.address.toOutputScript(address, this.network); return true; } catch { return false; }
  }
}

module.exports = LitecoinService;
