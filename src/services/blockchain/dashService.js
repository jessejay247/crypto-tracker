// src/services/blockchain/dashService.js
const bitcoin = require('bitcoinjs-lib');
const ECPairFactory = require('ecpair').ECPairFactory;
const ecc = require('@bitcoinerlab/secp256k1');
const ECPair = ECPairFactory(ecc);
const axios = require('axios');

const DASH = {
  messagePrefix: '\x19DarkCoin Signed Message:\n',
  bech32: 'dash',
  bip32: { public: 0x0488b21e, private: 0x0488ade4 },
  pubKeyHash: 0x4c,
  scriptHash: 0x10,
  wif: 0xcc
};

const DASH_TESTNET = {
  messagePrefix: '\x19DarkCoin Signed Message:\n',
  bech32: 'tdash',
  bip32: { public: 0x043587cf, private: 0x04358394 },
  pubKeyHash: 0x8c,
  scriptHash: 0x13,
  wif: 0xef
};

class DashService {
  constructor(network = 'mainnet') {
    this.network = network === 'mainnet' ? DASH : DASH_TESTNET;
    this.apiBase = network === 'mainnet'
      ? process.env.DASH_MAINNET_API || 'https://insight.dash.org/insight-api'
      : process.env.DASH_TESTNET_API || 'https://testnet-insight.dashevo.org/insight-api';
    this.isTestnet = network === 'testnet';
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
      const response = await axios.get(`${this.apiBase}/addr/${address}/balance`, { timeout: 10000 });
      return ((response.data || 0) / 1e8).toString();
    } catch (error) {
      console.error('Error getting DASH balance:', error.message);
      return '0';
    }
  }

  async sendTransaction(privateKey, toAddress, amount) {
    try {
      const keyPair = ECPair.fromWIF(privateKey, this.network);
      const { address: fromAddress } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network: this.network
      });

      console.log('Preparing DASH transaction:', { fromAddress, toAddress, amount });

      const utxosResponse = await axios.get(`${this.apiBase}/addr/${fromAddress}/utxo`);
      const utxos = utxosResponse.data;

      if (!utxos || utxos.length === 0) {
        throw new Error('No spendable outputs found');
      }

      let totalInput = 0;
      const psbt = new bitcoin.Psbt({ network: this.network });

      for (const utxo of utxos) {
        const txHex = await axios.get(`${this.apiBase}/rawtx/${utxo.txid}`);
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          nonWitnessUtxo: Buffer.from(txHex.data.rawtx, 'hex')
        });
        totalInput += utxo.satoshis;
      }

      const amountSatoshis = Math.floor(parseFloat(amount) * 1e8);
      const fee = 1000;

      if (totalInput < amountSatoshis + fee) {
        throw new Error(`Insufficient balance. Have: ${totalInput / 1e8} DASH, Need: ${(amountSatoshis + fee) / 1e8} DASH`);
      }

      psbt.addOutput({ address: toAddress, value: amountSatoshis });

      if (totalInput > amountSatoshis + fee) {
        psbt.addOutput({ address: fromAddress, value: totalInput - amountSatoshis - fee });
      }

      utxos.forEach((_, index) => psbt.signInput(index, keyPair));
      psbt.finalizeAllInputs();

      const tx = psbt.extractTransaction();
      const txHex = tx.toHex();

      const broadcastResponse = await axios.post(
        `${this.apiBase}/tx/send`,
        { rawtx: txHex },
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log('✅ DASH transaction:', broadcastResponse.data.txid);
      return broadcastResponse.data.txid;
    } catch (error) {
      console.error('DASH transaction error:', error.message);
      throw error;
    }
  }

  async getTransactionHistory(address) {
    try {
      const response = await axios.get(`${this.apiBase}/txs`, {
        params: { address },
        timeout: 15000
      });
      
      if (!response.data || !response.data.txs) return [];
      
      return response.data.txs.map(tx => ({
        txHash: tx.txid,
        time: new Date(tx.time * 1000),
        confirmations: tx.confirmations,
        value: ((tx.valueOut || 0) / 1e8).toString(),
        status: tx.confirmations > 0 ? 'confirmed' : 'pending'
      }));
    } catch (error) {
      console.error('Error fetching DASH history:', error.message);
      return [];
    }
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

module.exports = DashService;