// src/services/blockchain/xrpService.js
const axios = require('axios');
const rippleKeypairs = require('ripple-keypairs');

class XrpService {
  constructor(network = 'mainnet') {
    this.isTestnet = network === 'testnet';
    this.tatumApiKey = this.isTestnet 
      ? process.env.TATUM_TESTNET_API_KEY 
      : process.env.TATUM_MAINNET_API_KEY;
    this.tatumBaseUrl = 'https://api.tatum.io/v3';
  }

  async generateWallet() {
    const seed = rippleKeypairs.generateSeed();
    const keypair = rippleKeypairs.deriveKeypair(seed);
    const address = rippleKeypairs.deriveAddress(keypair.publicKey);
    
    return {
      address,
      privateKey: seed,
      publicKey: keypair.publicKey
    };
  }

  async getBalance(address) {
    try {
      const { data } = await axios.get(
        `${this.tatumBaseUrl}/xrp/account/${address}`,
        {
          headers: { 'x-api-key': this.tatumApiKey },
          timeout: 15000
        }
      );
      return data.balance || '0';
    } catch {
      return '0';
    }
  }

  async getTransactionHistory(address, limit = 50) {
    try {
      const { data } = await axios.get(
        `${this.tatumBaseUrl}/xrp/account/tx/${address}`,
        {
          headers: { 'x-api-key': this.tatumApiKey },
          params: { pageSize: limit },
          timeout: 15000
        }
      );
      
      if (!data || !data.transactions) return [];
      
      return data.transactions.map(tx => ({
        txHash: tx.hash,
        time: new Date(tx.date),
        value: tx.Amount ? (parseFloat(tx.Amount) / 1000000).toString() : '0',
        status: tx.validated ? 'confirmed' : 'pending'
      }));
    } catch {
      return [];
    }
  }

  async sendTransaction(privateKey, toAddress, amount, destinationTag = null) {
    try {
      const keypair = rippleKeypairs.deriveKeypair(privateKey);
      const fromAddress = rippleKeypairs.deriveAddress(keypair.publicKey);

      const balance = await this.getBalance(fromAddress);
      console.log(`XRP Address ${fromAddress} has ${balance} XRP`);

      const sendAmount = parseFloat(amount);
      const totalBalance = parseFloat(balance);
      const fee = 0.00001; // XRP transaction fee

      if (totalBalance < sendAmount + fee + 10) { // 10 XRP reserve
        throw new Error(`Insufficient balance. Have: ${balance} XRP, Need: ${sendAmount + fee + 10} XRP (includes 10 XRP reserve)`);
      }

      const payload = {
        fromAccount: fromAddress,
        to: toAddress,
        amount: sendAmount.toString(),
        fromSecret: privateKey,
        fee: fee.toString()
      };

      if (destinationTag) {
        payload.destinationTag = destinationTag;
      }

      console.log('Sending XRP transaction:', JSON.stringify(payload, null, 2));

      const { data } = await axios.post(
        `${this.tatumBaseUrl}/xrp/transaction`,
        payload,
        {
          headers: {
            'x-api-key': this.tatumApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✅ XRP transaction:', data.txId);
      return data.txId;
    } catch (error) {
      console.error('Full XRP error:', JSON.stringify(error.response?.data, null, 2));
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  validateAddress(address) {
    try {
      return rippleKeypairs.isValidAddress(address);
    } catch {
      return false;
    }
  }
}

module.exports = XrpService;