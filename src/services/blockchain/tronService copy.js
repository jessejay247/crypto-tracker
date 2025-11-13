// // src/services/blockchain/tronService.js
// const { TRON } = require('../../config/networks');
// const TronWeb = require('tronweb');

// class TronService {
//   constructor(network = 'mainnet') {
//     this.network = network;
//     const config = network === 'mainnet' ? TRON.fullNode.mainnet : TRON.fullNode.testnet;
    
//     this.tronWeb = new TronWeb({
//       fullHost: config,
//       headers: { "TRON-PRO-API-KEY": process.env.TRON_API_KEY || '' }
//     });
    
//     this.isTestnet = network === 'testnet';
//   }

//   /**
//    * Generate new Tron wallet
//    */
//   async generateWallet() {
//     try {
//       const account = await this.tronWeb.createAccount();
//       return {
//         address: account.address.base58,
//         privateKey: account.privateKey,
//         publicKey: account.publicKey
//       };
//     } catch (error) {
//       throw new Error(`Failed to generate TRX wallet: ${error.message}`);
//     }
//   }

//   /**
//    * Get TRX balance
//    */
//   async getBalance(address) {
//     try {
//       const balance = await this.tronWeb.trx.getBalance(address);
//       return (balance / 1e6).toString(); // Convert from SUN to TRX
//     } catch (error) {
//       throw new Error(`Failed to get TRX balance: ${error.message}`);
//     }
//   }

//   /**
//    * Send TRX transaction
//    */
//   async sendTransaction(privateKey, toAddress, amount) {
//     try {
//       const fromAddress = this.tronWeb.address.fromPrivateKey(privateKey);
//       const amountInSun = Math.floor(parseFloat(amount) * 1e6);

//       console.log('Preparing TRX transaction:', {
//         from: fromAddress,
//         to: toAddress,
//         amount,
//         amountInSun
//       });

//       // Build transaction
//       const transaction = await this.tronWeb.transactionBuilder.sendTrx(
//         toAddress,
//         amountInSun,
//         fromAddress
//       );

//       // Sign transaction
//       const signedTransaction = await this.tronWeb.trx.sign(transaction, privateKey);

//       // Broadcast transaction
//       const result = await this.tronWeb.trx.sendRawTransaction(signedTransaction);

//       if (!result.result) {
//         throw new Error(result.message || 'Transaction broadcast failed');
//       }

//       console.log('✅ TRX transaction broadcast:', result.txid);
//       return result.txid;
//     } catch (error) {
//       console.error('TRX transaction error:', error.message);
//       throw new Error(`Transaction failed: ${error.message}`);
//     }
//   }

//   /**
//    * Get transaction history
//    */
//   async getTransactionHistory(address, limit = 50) {
//     try {
//       const transactions = await this.tronWeb.trx.getTransactionsRelated(address, 'all', limit);

//       if (!transactions || !transactions.data) {
//         return [];
//       }

//       return transactions.data.map(tx => ({
//         txHash: tx.txID,
//         blockNumber: tx.blockNumber,
//         timestamp: new Date(tx.block_timestamp),
//         from: tx.raw_data.contract[0].parameter.value.owner_address 
//           ? this.tronWeb.address.fromHex(tx.raw_data.contract[0].parameter.value.owner_address)
//           : 'Unknown',
//         to: tx.raw_data.contract[0].parameter.value.to_address
//           ? this.tronWeb.address.fromHex(tx.raw_data.contract[0].parameter.value.to_address)
//           : 'Unknown',
//         value: tx.raw_data.contract[0].parameter.value.amount
//           ? (tx.raw_data.contract[0].parameter.value.amount / 1e6).toString()
//           : '0',
//         status: tx.ret && tx.ret[0].contractRet === 'SUCCESS' ? 'confirmed' : 'failed'
//       }));
//     } catch (error) {
//       console.error('Error getting TRX transaction history:', error.message);
//       return [];
//     }
//   }

//   /**
//    * Get token balance (TRC-20)
//    */
//   async getTokenBalance(tokenAddress, walletAddress) {
//     try {
//       const contract = await this.tronWeb.contract().at(tokenAddress);
//       const balance = await contract.balanceOf(walletAddress).call();
//       const decimals = await contract.decimals().call();
      
//       return (balance / Math.pow(10, decimals)).toString();
//     } catch (error) {
//       throw new Error(`Failed to get token balance: ${error.message}`);
//     }
//   }

//   /**
//    * Send token transaction (TRC-20)
//    */
//   async sendToken(privateKey, tokenAddress, toAddress, amount) {
//     try {
//       const fromAddress = this.tronWeb.address.fromPrivateKey(privateKey);
      
//       console.log('Preparing TRC-20 token transaction:', {
//         from: fromAddress,
//         to: toAddress,
//         amount,
//         token: tokenAddress
//       });

//       const contract = await this.tronWeb.contract().at(tokenAddress);
//       const decimals = await contract.decimals().call();
//       const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, decimals));

//       // Create transaction
//       const transaction = await contract.transfer(toAddress, amountInSmallestUnit).send({
//         feeLimit: 100_000_000, // 100 TRX fee limit
//         from: fromAddress
//       });

//       console.log('✅ TRC-20 token transaction confirmed:', transaction);
//       return transaction;
//     } catch (error) {
//       console.error('TRC-20 token transaction error:', error.message);
//       throw new Error(`Token transaction failed: ${error.message}`);
//     }
//   }

//   /**
//    * Validate Tron address
//    */
//   validateAddress(address) {
//     return this.tronWeb.isAddress(address);
//   }

//   /**
//    * Get account resources (bandwidth, energy)
//    */
//   async getAccountResources(address) {
//     try {
//       const resources = await this.tronWeb.trx.getAccountResources(address);
//       return {
//         freeNetLimit: resources.freeNetLimit || 0,
//         freeNetUsed: resources.freeNetUsed || 0,
//         netLimit: resources.NetLimit || 0,
//         netUsed: resources.NetUsed || 0,
//         energyLimit: resources.EnergyLimit || 0,
//         energyUsed: resources.EnergyUsed || 0
//       };
//     } catch (error) {
//       throw new Error(`Failed to get account resources: ${error.message}`);
//     }
//   }

//   /**
//    * Estimate bandwidth for transaction
//    */
//   estimateBandwidth() {
//     // Simple TRX transfer typically uses ~267 bandwidth
//     return {
//       estimatedBandwidth: 267,
//       note: 'Actual bandwidth may vary based on transaction complexity'
//     };
//   }
// }

// module.exports = TronService;