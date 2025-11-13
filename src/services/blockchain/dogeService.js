// src/services/blockchain/dogeService.js
const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const ecc = require('@bitcoinerlab/secp256k1');
const axios = require('axios');

const ECPair = ECPairFactory(ecc);
bitcoin.initEccLib(ecc);
class DogecoinService {
  constructor(network = 'mainnet') {
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
      }
    };
    
    this.network = network === 'mainnet' ? DOGECOIN.mainnet : DOGECOIN.testnet;
    this.isTestnet = network === 'testnet';
    this.tatumApiKey = this.isTestnet 
      ? process.env.TATUM_TESTNET_API_KEY 
      : process.env.TATUM_MAINNET_API_KEY;
    this.tatumBaseUrl = 'https://api.tatum.io/v3';
  }

  async generateWallet() {
    const keyPair = ECPair.makeRandom({ network: this.network });
    const { address } = bitcoin.payments.p2pkh({
      pubkey: keyPair.publicKey,
      network: this.network
    });
    return {
      address,
      privateKey: keyPair.toWIF(),
      publicKey: keyPair.publicKey.toString('hex')
    };
  }

  async getBalance(address) {
    try {
      const { data } = await axios.get(
        `${this.tatumBaseUrl}/dogecoin/address/balance/${address}`,
        {
          headers: { 'x-api-key': this.tatumApiKey },
          timeout: 15000
        }
      );
      return data.incoming || '0';
    } catch {
      return '0';
    }
  }

  async getTransactionHistory(address, limit = 50) {
    try {
      const { data } = await axios.get(
        `${this.tatumBaseUrl}/dogecoin/transaction/address/${address}`,
        {
          headers: { 'x-api-key': this.tatumApiKey },
          params: { pageSize: limit },
          timeout: 15000
        }
      );
      return (data || []).map(tx => ({
        txHash: tx.hash,
        confirmations: tx.confirmations || 0,
        time: new Date(tx.time * 1000),
        value: this.calculateTxValue(tx, address),
        status: tx.confirmations > 0 ? 'confirmed' : 'pending'
      }));
    } catch {
      return [];
    }
  }

  async sendTransaction(privateKey, toAddress, amount) {
    try {
      const keyPair = ECPair.fromWIF(privateKey, this.network);
      const { address: fromAddress } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network: this.network
      });

      const balance = await this.getBalance(fromAddress);
      console.log(`DOGE Address ${fromAddress} has ${balance} DOGE`);

      const sendAmount = parseFloat(amount);
      const totalBalance = parseFloat(balance);

      if (totalBalance < sendAmount + 1) {
        throw new Error(`Insufficient balance. Have: ${balance} DOGE, Need: ${sendAmount + 1} DOGE`);
      }

      const payload = {
        fromAddress: [{
          address: fromAddress,
          privateKey: privateKey
        }],
        to: [{
          address: toAddress,
          value: sendAmount
        }],
        fee: "1",
        changeAddress: fromAddress
      };

      console.log('Sending DOGE transaction:', JSON.stringify(payload, null, 2));

      const { data } = await axios.post(
        `${this.tatumBaseUrl}/dogecoin/transaction`,
        payload,
        {
          headers: {
            'x-api-key': this.tatumApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✅ DOGE transaction:', data.txId);
      console.log('🐕 Much transaction! Such blockchain! Wow!');
      return data.txId;
    } catch (error) {
      console.error('Full DOGE error:', JSON.stringify(error.response?.data, null, 2));
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  calculateTxValue(tx, address) {
    let received = 0, sent = 0;
    if (tx.outputs)
      for (const o of tx.outputs)
        if (o.address === address) received += parseFloat(o.value);
    if (tx.inputs?.some(i => i.coin?.address === address) && tx.outputs)
      for (const o of tx.outputs) sent += parseFloat(o.value);
    return (received - sent).toString();
  }

  validateAddress(address) {
    try {
      bitcoin.address.toOutputScript(address, this.network);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = DogecoinService;