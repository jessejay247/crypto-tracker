// // src/services/blockchain/bscService.js
// const { BSC } = require('../../config/networks');
// const { ethers } = require('ethers');
// const axios = require('axios');

// class BSCService {
//   constructor(network = 'mainnet') {
//     this.network = network;
//     this.provider = new ethers.JsonRpcProvider(BSC.rpc[network]);
//     this.explorerApi = BSC.explorerApi[network];
//     this.apiKey = process.env.BSCSCAN_API_KEY;
//   }

//   /**
//    * Generate new BSC wallet (same as Ethereum)
//    */
//   generateWallet() {
//     const wallet = ethers.Wallet.createRandom();
//     return {
//       address: wallet.address,
//       privateKey: wallet.privateKey,
//       mnemonic: wallet.mnemonic.phrase,
//       publicKey: wallet.publicKey
//     };
//   }

//   /**
//    * Get BNB balance
//    */
//   async getBalance(address) {
//     try {
//       const balance = await this.provider.getBalance(address);
//       return ethers.formatEther(balance);
//     } catch (error) {
//       throw new Error(`Failed to get BNB balance: ${error.message}`);
//     }
//   }

//   /**
//    * Send BNB transaction
//    */
//   async sendTransaction(privateKey, toAddress, amount, options = {}) {
//     try {
//       const wallet = new ethers.Wallet(privateKey, this.provider);
      
//       console.log('Preparing BNB transaction:', {
//         from: wallet.address,
//         to: toAddress,
//         amount
//       });

//       const tx = await wallet.sendTransaction({
//         to: toAddress,
//         value: ethers.parseEther(amount.toString()),
//         ...options
//       });

//       console.log('Transaction sent:', tx.hash);
//       const receipt = await tx.wait();
      
//       console.log('✅ BNB transaction confirmed:', tx.hash);
//       return tx.hash;
//     } catch (error) {
//       console.error('BNB transaction error:', error.message);
//       throw new Error(`Transaction failed: ${error.message}`);
//     }
//   }

//   /**
//    * Get transaction history
//    */
//   async getTransactionHistory(address, limit = 50) {
//     try {
//       if (!this.apiKey) {
//         console.warn('BSCScan API key not configured');
//         return [];
//       }

//       const response = await axios.get(this.explorerApi, {
//         params: {
//           module: 'account',
//           action: 'txlist',
//           address,
//           startblock: 0,
//           endblock: 99999999,
//           page: 1,
//           offset: limit,
//           sort: 'desc',
//           apikey: this.apiKey
//         },
//         timeout: 10000
//       });

//       if (response.data.status !== '1') {
//         if (response.data.message === 'No transactions found') {
//           return [];
//         }
//         throw new Error(`BSCScan API error: ${response.data.message}`);
//       }

//       return response.data.result.map(tx => ({
//         txHash: tx.hash,
//         from: tx.from,
//         to: tx.to,
//         value: ethers.formatEther(tx.value),
//         timeStamp: new Date(parseInt(tx.timeStamp) * 1000),
//         status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
//         blockNumber: parseInt(tx.blockNumber),
//         gasUsed: tx.gasUsed,
//         gasPrice: ethers.formatUnits(tx.gasPrice, 'gwei')
//       }));
//     } catch (error) {
//       console.error('Error getting BNB transaction history:', error.message);
//       return [];
//     }
//   }

//   /**
//    * Get token balance (BEP-20)
//    */
//   async getTokenBalance(tokenAddress, walletAddress) {
//     try {
//       const tokenABI = [
//         'function balanceOf(address owner) view returns (uint256)',
//         'function decimals() view returns (uint8)'
//       ];
      
//       const contract = new ethers.Contract(tokenAddress, tokenABI, this.provider);
//       const balance = await contract.balanceOf(walletAddress);
//       const decimals = await contract.decimals();
      
//       return ethers.formatUnits(balance, decimals);
//     } catch (error) {
//       throw new Error(`Failed to get token balance: ${error.message}`);
//     }
//   }

//   /**
//    * Send token transaction (BEP-20)
//    */
//   async sendToken(privateKey, tokenAddress, toAddress, amount) {
//     try {
//       const wallet = new ethers.Wallet(privateKey, this.provider);
      
//       const tokenABI = [
//         'function decimals() view returns (uint8)',
//         'function transfer(address to, uint256 amount) returns (bool)'
//       ];
      
//       const contract = new ethers.Contract(tokenAddress, tokenABI, wallet);
//       const decimals = await contract.decimals();
//       const amountInWei = ethers.parseUnits(amount.toString(), decimals);
      
//       console.log('Preparing token transaction:', {
//         from: wallet.address,
//         to: toAddress,
//         amount,
//         token: tokenAddress
//       });

//       const tx = await contract.transfer(toAddress, amountInWei);
//       console.log('Token transaction sent:', tx.hash);
      
//       const receipt = await tx.wait();
//       console.log('✅ Token transaction confirmed:', tx.hash);
      
//       return tx.hash;
//     } catch (error) {
//       console.error('Token transaction error:', error.message);
//       throw new Error(`Token transaction failed: ${error.message}`);
//     }
//   }

//   /**
//    * Estimate gas
//    */
//   async estimateGas(fromAddress, toAddress, amount) {
//     try {
//       const gasEstimate = await this.provider.estimateGas({
//         from: fromAddress,
//         to: toAddress,
//         value: ethers.parseEther(amount.toString())
//       });

//       const feeData = await this.provider.getFeeData();
//       const gasCost = gasEstimate * feeData.gasPrice;

//       return {
//         gasLimit: gasEstimate.toString(),
//         gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei') + ' gwei',
//         estimatedFee: ethers.formatEther(gasCost) + ' BNB'
//       };
//     } catch (error) {
//       throw new Error(`Failed to estimate gas: ${error.message}`);
//     }
//   }

//   /**
//    * Validate address
//    */
//   validateAddress(address) {
//     return ethers.isAddress(address);
//   }

//   /**
//    * Get gas price
//    */
//   async getGasPrice() {
//     try {
//       const feeData = await this.provider.getFeeData();
//       return {
//         gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei'),
//         maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : null,
//         maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : null
//       };
//     } catch (error) {
//       throw new Error(`Failed to get gas price: ${error.message}`);
//     }
//   }
// }

// module.exports = BSCService;