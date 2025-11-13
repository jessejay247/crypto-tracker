// src/services/blockchain/ethService.js
const axios = require('axios');
const { ethers } = require('ethers');

class EthereumService {
  constructor(network = 'mainnet') {
    this.isTestnet = network === 'testnet';
    this.tatumApiKey = this.isTestnet 
      ? process.env.TATUM_TESTNET_API_KEY 
      : process.env.TATUM_MAINNET_API_KEY;
    this.tatumBaseUrl = 'https://api.tatum.io/v3';
    this.chain = this.isTestnet ? 'ethereum-sepolia' : 'ethereum';
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
        `${this.tatumBaseUrl}/ethereum/account/balance/${address}`,
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
        `${this.tatumBaseUrl}/ethereum/account/balance/erc20/${address}`,
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
        `${this.tatumBaseUrl}/ethereum/transaction/address/${address}`,
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
    console.log(`ETH Address ${fromAddress} has ${balance} ETH`);

    const sendAmount = parseFloat(amount);
    const totalBalance = parseFloat(balance);

    if (totalBalance < sendAmount + 0.001) {
      throw new Error(`Insufficient balance. Have: ${balance} ETH, Need: ${sendAmount + 0.001} ETH`);
    }

    const payload = {
      fromPrivateKey: privateKey.replace('0x', ''), // ✅ FIXED
      to: toAddress,
      amount: sendAmount.toString(),
      currency: 'ETH'
    };

    console.log('Sending ETH transaction:', JSON.stringify({
      ...payload,
      fromPrivateKey: '[REDACTED]'
    }, null, 2));

    const { data } = await axios.post(
      `${this.tatumBaseUrl}/ethereum/transaction`,
      payload,
      {
        headers: {
          'x-api-key': this.tatumApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ ETH transaction:', data.txId);
    return data.txId;
  } catch (error) {
    console.error('Full ETH error:', JSON.stringify(error.response?.data, null, 2));
    throw new Error(error.response?.data?.message || error.message);
  }
}

  async sendToken(privateKey, tokenAddress, toAddress, amount, decimals = 18) {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const fromAddress = wallet.address;

      console.log(`Sending ${amount} tokens from ${fromAddress}`);

      const payload = {
        privateKey: privateKey,
        to: toAddress,
        amount: amount.toString(),
        contractAddress: tokenAddress,
        digits: decimals
      };

      console.log('Sending ERC20 transaction:', JSON.stringify(payload, null, 2));

      const { data } = await axios.post(
        `${this.tatumBaseUrl}/ethereum/erc20/transaction`,
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

module.exports = EthereumService;