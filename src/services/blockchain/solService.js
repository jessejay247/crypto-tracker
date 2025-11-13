// src/services/blockchain/solService.js
const axios = require('axios');
const bs58 = require('bs58').default;
const { Keypair } = require('@solana/web3.js');

class SolanaService {
  constructor(network = 'mainnet') {
    this.isTestnet = network === 'testnet';
    this.tatumApiKey = this.isTestnet 
      ? process.env.TATUM_TESTNET_API_KEY 
      : process.env.TATUM_MAINNET_API_KEY;
    this.tatumBaseUrl = 'https://api.tatum.io/v3';
  }

  generateWallet() {
    const keypair = Keypair.generate();
    return {
      address: keypair.publicKey.toString(),
      privateKey: bs58.encode(keypair.secretKey)
    };
  }

  async getBalance(address) {
    try {
      const { data } = await axios.get(
        `${this.tatumBaseUrl}/solana/account/${address}`,
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
        `${this.tatumBaseUrl}/solana/account/${address}/token/${tokenAddress}`,
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
        `${this.tatumBaseUrl}/solana/transaction/address/${address}`,
        {
          headers: { 'x-api-key': this.tatumApiKey },
          params: { pageSize: limit },
          timeout: 15000
        }
      );
      return (data || []).map(tx => ({
        txHash: tx.signature,
        time: new Date(tx.blockTime * 1000),
        status: tx.err ? 'failed' : 'confirmed'
      }));
    } catch {
      return [];
    }
  }

async sendTransaction(privateKey, toAddress, amount) {
  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    const fromAddress = keypair.publicKey.toString();

    const balance = await this.getBalance(fromAddress);
    console.log(`SOL Address ${fromAddress} has ${balance} SOL`);

    const sendAmount = parseFloat(amount);
    const totalBalance = parseFloat(balance);

    if (totalBalance < sendAmount + 0.00001) {
      throw new Error(`Insufficient balance. Have: ${balance} SOL, Need: ${sendAmount + 0.00001} SOL`);
    }

    const payload = {
      from: fromAddress,
      to: toAddress,
      amount: sendAmount.toString(),
      fromPrivateKey: privateKey  // ✅ FIXED: Changed from 'privateKey' to 'fromPrivateKey'
    };

    console.log('Sending SOL transaction:', JSON.stringify({
      ...payload,
      fromPrivateKey: '[REDACTED]'
    }, null, 2));

    const { data } = await axios.post(
      `${this.tatumBaseUrl}/solana/transaction`,
      payload,
      {
        headers: {
          'x-api-key': this.tatumApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ SOL transaction:', data.txId);
    return data.txId;
  } catch (error) {
    console.error('Full SOL error:', JSON.stringify(error.response?.data, null, 2));
    throw new Error(error.response?.data?.message || error.message);
  }
}

  async sendToken(privateKey, tokenAddress, toAddress, amount) {
    try {
      const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
      const fromAddress = keypair.publicKey.toString();

      console.log(`Sending ${amount} SPL tokens from ${fromAddress}`);

      const payload = {
        from: fromAddress,
        to: toAddress,
        amount: amount.toString(),
        tokenAddress: tokenAddress,
        privateKey: privateKey
      };

      console.log('Sending SPL transaction:', JSON.stringify(payload, null, 2));

      const { data } = await axios.post(
        `${this.tatumBaseUrl}/solana/spl/transaction`,
        payload,
        {
          headers: {
            'x-api-key': this.tatumApiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✅ SPL transaction:', data.txId);
      return data.txId;
    } catch (error) {
      console.error('Full SPL error:', JSON.stringify(error.response?.data, null, 2));
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  validateAddress(address) {
    try {
      const decoded = bs58.decode(address);
      return decoded.length === 32;
    } catch {
      return false;
    }
  }
}

module.exports = SolanaService;