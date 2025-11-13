// src/services/blockchain/tronService.js
const axios = require('axios');
const { TronWeb } = require('tronweb')
class TronService {
  constructor(network = 'mainnet') {
    this.isTestnet = network === 'testnet';
    this.tatumApiKey = this.isTestnet 
      ? process.env.TATUM_TESTNET_API_KEY 
      : process.env.TATUM_MAINNET_API_KEY;
    this.tatumBaseUrl = 'https://api.tatum.io/v3';
    
    // For wallet generation and validation
    const fullHost = this.isTestnet 
      ? 'https://api.shasta.trongrid.io' 
      : 'https://api.trongrid.io';
    this.tronWeb = new TronWeb({ fullHost });
  }

  async generateWallet() {
    const account = await this.tronWeb.createAccount();
    return {
      address: account.address.base58,
      privateKey: account.privateKey
    };
  }

  async getBalance(address) {
    try {
      const { data } = await axios.get(
        `${this.tatumBaseUrl}/tron/account/${address}`,
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

  async getTokenBalance(address, tokenAddress) {
    try {
      const { data } = await axios.get(
        `${this.tatumBaseUrl}/tron/account/${address}/trc20/${tokenAddress}`,
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
        `${this.tatumBaseUrl}/tron/transaction/account/${address}`,
        {
          headers: { 'x-api-key': this.tatumApiKey },
          params: { pageSize: limit },
          timeout: 15000
        }
      );
      return (data || []).map(tx => ({
        txHash: tx.hash,
        time: new Date(tx.timestamp),
        from: tx.from,
        to: tx.to,
        value: tx.amount || '0',
        status: tx.confirmed ? 'confirmed' : 'pending'
      }));
    } catch {
      return [];
    }
  }

  async sendTransaction(privateKey, toAddress, amount) {
    try {
      const fromAddress = this.tronWeb.address.fromPrivateKey(privateKey);

      const balance = await this.getBalance(fromAddress);
      console.log(`TRX Address ${fromAddress} has ${balance} TRX`);

      const sendAmount = parseFloat(amount);
      const totalBalance = parseFloat(balance);

      if (totalBalance < sendAmount + 1) {
        throw new Error(`Insufficient balance. Have: ${balance} TRX, Need: ${sendAmount + 1} TRX`);
      }

      const payload = {
        fromPrivateKey: privateKey,
        to: toAddress,
        amount: sendAmount.toString()
      };

      console.log('Sending TRX transaction:', JSON.stringify(payload, null, 2));

      const { data } = await axios.post(
        `${this.tatumBaseUrl}/tron/transaction`,
        payload,
        {
          headers: {
            'x-api-key': this.tatumApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✅ TRX transaction:', data.txId);
      return data.txId;
    } catch (error) {
      console.error('Full TRX error:', JSON.stringify(error.response?.data, null, 2));
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  async sendToken(privateKey, tokenAddress, toAddress, amount, decimals = 6) {
    try {
      const fromAddress = this.tronWeb.address.fromPrivateKey(privateKey);

      console.log(`Sending ${amount} TRC20 tokens from ${fromAddress}`);

      const payload = {
        fromPrivateKey: privateKey,
        to: toAddress,
        tokenAddress: tokenAddress,
        amount: amount.toString(),
        feeLimit: 100
      };

      console.log('Sending TRC20 transaction:', JSON.stringify(payload, null, 2));

      const { data } = await axios.post(
        `${this.tatumBaseUrl}/tron/trc20/transaction`,
        payload,
        {
          headers: {
            'x-api-key': this.tatumApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✅ TRC20 transaction:', data.txId);
      return data.txId;
    } catch (error) {
      console.error('Full TRC20 error:', JSON.stringify(error.response?.data, null, 2));
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  validateAddress(address) {
    return this.tronWeb.isAddress(address);
  }
}

module.exports = TronService;