// src/services/blockchain/polygonService.js
const axios = require('axios');
const { ethers } = require('ethers');

class PolygonService {
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
        `${this.tatumBaseUrl}/polygon/account/balance/${address}`,
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
        `${this.tatumBaseUrl}/polygon/account/balance/erc20/${address}`,
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
        `${this.tatumBaseUrl}/polygon/transaction/address/${address}`,
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
    console.log(`MATIC Address ${fromAddress} has ${balance} MATIC`);

    const sendAmount = parseFloat(amount);
    const totalBalance = parseFloat(balance);

    if (totalBalance < sendAmount + 0.001) {
      throw new Error(`Insufficient balance. Have: ${balance} MATIC, Need: ${sendAmount + 0.001} MATIC`);
    }

    const payload = {
      fromPrivateKey: privateKey.replace('0x', ''), // ✅ FIXED
      to: toAddress,
      amount: sendAmount.toString(),
      currency: 'MATIC'
    };

    console.log('Sending MATIC transaction:', JSON.stringify({
      ...payload,
      fromPrivateKey: '[REDACTED]'
    }, null, 2));

    const { data } = await axios.post(
      `${this.tatumBaseUrl}/polygon/transaction`,
      payload,
      {
        headers: {
          'x-api-key': this.tatumApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ MATIC transaction:', data.txId);
    return data.txId;
  } catch (error) {
    console.error('Full MATIC error:', JSON.stringify(error.response?.data, null, 2));
    throw new Error(error.response?.data?.message || error.message);
  }
}

  async sendToken(privateKey, tokenAddress, toAddress, amount, decimals = 18) {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const fromAddress = wallet.address;

      console.log(`Sending ${amount} ERC20 tokens from ${fromAddress}`);

      const payload = {
        privateKey: privateKey,
        to: toAddress,
        amount: amount.toString(),
        contractAddress: tokenAddress,
        digits: decimals
      };

      console.log('Sending ERC20 transaction:', JSON.stringify(payload, null, 2));

      const { data } = await axios.post(
        `${this.tatumBaseUrl}/polygon/erc20/transaction`,
        payload,
        {
          headers: {
            'x-api-key': this.tatumApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✅ ERC20 transaction:', data.txId);
      return data.txId;
    } catch (error) {
      console.error('Full ERC20 error:', JSON.stringify(error.response?.data, null, 2));
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  validateAddress(address) {
    return ethers.isAddress(address);
  }
}

module.exports = PolygonService;