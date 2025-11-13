// src/services/blockchain/bscService.js
const axios = require('axios');
const { ethers } = require('ethers');

class BscService {
  constructor(network = 'mainnet') {
    this.isTestnet = network === 'testnet';
    this.tatumApiKey = this.isTestnet 
      ? process.env.TATUM_TESTNET_API_KEY 
      : process.env.TATUM_MAINNET_API_KEY;
    this.tatumBaseUrl = 'https://api.tatum.io/v3';
  }

  generateWallet() {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase
    };
  }

  async getBalance(address) {
    try {
      const { data } = await axios.get(
        `${this.tatumBaseUrl}/bsc/account/balance/${address}`,
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
        `${this.tatumBaseUrl}/bsc/account/balance/erc20/${address}`,
        {
          headers: { 'x-api-key': this.tatumApiKey },
          params: { contractAddress: tokenAddress },
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
        `${this.tatumBaseUrl}/bsc/transaction/address/${address}`,
        {
          headers: { 'x-api-key': this.tatumApiKey },
          params: { pageSize: limit },
          timeout: 15000
        }
      );
      return (data || []).map(tx => ({
        txHash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value || '0'),
        time: new Date(tx.timestamp),
        status: tx.status ? 'confirmed' : 'failed'
      }));
    } catch {
      return [];
    }
  }

async sendTransaction(privateKey, toAddress, amount) {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const fromAddress = wallet.address;

    const balance = await this.getBalance(fromAddress);
    console.log(`BNB Address ${fromAddress} has ${balance} BNB`);

    const sendAmount = parseFloat(amount);
    const totalBalance = parseFloat(balance);

    if (totalBalance < sendAmount + 0.001) {
      throw new Error(`Insufficient balance. Have: ${balance} BNB, Need: ${sendAmount + 0.001} BNB`);
    }

    // ✅ FIXED: Use correct Tatum API format with currency
    const payload = {
      fromPrivateKey: privateKey.replace('0x', ''), // Remove 0x prefix
      to: toAddress,
      amount: sendAmount.toString(),
      currency: 'BSC' // ✅ This is required!
    };

    console.log('Sending BNB transaction:', JSON.stringify({
      ...payload,
      fromPrivateKey: '[REDACTED]' // Don't log private key
    }, null, 2));

    const { data } = await axios.post(
      `${this.tatumBaseUrl}/bsc/transaction`,
      payload,
      {
        headers: {
          'x-api-key': this.tatumApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ BNB transaction:', data.txId);
    return data.txId;
  } catch (error) {
    console.error('Full BNB error:', JSON.stringify(error.response?.data, null, 2));
    throw new Error(error.response?.data?.message || error.message);
  }
}

  async sendToken(privateKey, tokenAddress, toAddress, amount, decimals = 18) {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const fromAddress = wallet.address;

      console.log(`Sending ${amount} BEP20 tokens from ${fromAddress}`);

      // ✅ FIXED: Use correct Tatum API format
      const payload = {
        fromPrivateKey: privateKey.replace('0x', ''), // Remove 0x prefix
        to: toAddress,
        amount: amount.toString(),
        contractAddress: tokenAddress,
        digits: decimals
      };

      console.log('Sending BEP20 transaction:', JSON.stringify({
        ...payload,
        fromPrivateKey: '[REDACTED]' // Don't log private key
      }, null, 2));

      const { data } = await axios.post(
        `${this.tatumBaseUrl}/bsc/bep20/transaction`,
        payload,
        {
          headers: {
            'x-api-key': this.tatumApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✅ BEP20 transaction:', data.txId);
      return data.txId;
    } catch (error) {
      console.error('Full BEP20 error:', JSON.stringify(error.response?.data, null, 2));
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  validateAddress(address) {
    return ethers.isAddress(address);
  }
}

module.exports = BscService;