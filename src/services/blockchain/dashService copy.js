// // src/services/blockchain/dashService.js
// const { DASH } = require('../../config/networks');
// const bitcoin = require('bitcoinjs-lib');
// const { ECPairFactory } = require('ecpair');
// const ecc = require('../../utils/ecc.js');
// const axios = require('axios');

// const ECPair = ECPairFactory(ecc);
// bitcoin.initEccLib(ecc);

// class DashService {
//   constructor(network = 'mainnet') {
//     this.network = network === 'mainnet' ? DASH.mainnet : DASH.testnet;
//     this.apiBase = DASH.api[network];
//     this.isTestnet = network === 'testnet';
//   }

//   /**
//    * Generate new Dash wallet
//    */
//   async generateWallet() {
//     const keyPair = ECPair.makeRandom({ network: this.network });
//     const { address } = bitcoin.payments.p2pkh({
//       pubkey: keyPair.publicKey,
//       network: this.network
//     });

//     return {
//       address,
//       privateKey: keyPair.toWIF(),
//       publicKey: keyPair.publicKey.toString('hex')
//     };
//   }

//   /**
//    * Get Dash balance
//    */
//   async getBalance(address) {
//     try {
//       const response = await axios.get(`${this.apiBase}/addr/${address}/balance`, { timeout: 10000 });
//       return (response.data / 1e8).toString();
//     } catch (error) {
//       if (error.response?.status === 404) return '0';
//       throw new Error(`Failed to get DASH balance: ${error.message}`);
//     }
//   }

//   /**
//    * Send Dash transaction
//    */
//   async sendTransaction(privateKey, toAddress, amount) {
//     try {
//       const keyPair = ECPair.fromWIF(privateKey, this.network);
//       const { address: fromAddress } = bitcoin.payments.p2pkh({
//         pubkey: keyPair.publicKey,
//         network: this.network
//       });

//       console.log('Preparing DASH transaction:', { fromAddress, toAddress, amount });

//       // Get UTXOs
//       const utxosResponse = await axios.get(`${this.apiBase}/addr/${fromAddress}/utxo`, { timeout: 10000 });
//       if (!utxosResponse.data || utxosResponse.data.length === 0) {
//         throw new Error('No spendable outputs found');
//       }

//       const utxos = utxosResponse.data;
//       const amountSatoshis = Math.floor(parseFloat(amount) * 1e8);
//       const feeRate = 10; // sat/byte
      
//       let totalInput = 0;
//       const selectedUtxos = [];

//       for (const utxo of utxos) {
//         selectedUtxos.push(utxo);
//         totalInput += utxo.satoshis;

//         const estimatedSize = 10 + (selectedUtxos.length * 148) + (2 * 34);
//         const estimatedFee = estimatedSize * feeRate;

//         if (totalInput >= amountSatoshis + estimatedFee) {
//           break;
//         }
//       }

//       const estimatedSize = 10 + (selectedUtxos.length * 148) + (2 * 34);
//       const fee = estimatedSize * feeRate;

//       if (totalInput < amountSatoshis + fee) {
//         throw new Error(`Insufficient balance. Have: ${totalInput / 1e8} DASH, Need: ${(amountSatoshis + fee) / 1e8} DASH`);
//       }

//       const psbt = new bitcoin.Psbt({ network: this.network });

//       for (const utxo of utxos) {
//         const txHexResponse = await axios.get(`${this.apiBase}/tx/${utxo.txid}/hex`, { timeout: 10000 });
//         psbt.addInput({
//           hash: utxo.txid,
//           index: utxo.vout,
//           nonWitnessUtxo: Buffer.from(txHexResponse.data, 'hex')
//         });
//       }

//       psbt.addOutput({
//         address: toAddress,
//         value: amountSatoshis
//       });

//       const change = totalInput - amountSatoshis - fee;
//       if (change > 1000) { // Dust limit
//         psbt.addOutput({
//           address: fromAddress,
//           value: change
//         });
//       }

//       for (let i = 0; i < selectedUtxos.length; i++) {
//         psbt.signInput(i, keyPair);
//       }

//       const validator = (pubkey, msghash, signature) => ecc.verify(msghash, pubkey, signature);
//       for (let i = 0; i < selectedUtxos.length; i++) {
//         if (!psbt.validateSignaturesOfInput(i, validator)) {
//           throw new Error(`Signature validation failed for input ${i}`);
//         }
//       }

//       psbt.finalizeAllInputs();
//       const tx = psbt.extractTransaction();
//       const txHex = tx.toHex();
//       const txId = tx.getId();

//       await axios.post(
//         `${this.apiBase}/tx/send`,
//         { rawtx: txHex },
//         {
//           headers: { 'Content-Type': 'application/json' },
//           timeout: 15000
//         }
//       );

//       console.log('✅ DASH transaction broadcast:', txId);
//       return txId;
//     } catch (error) {
//       console.error('DASH transaction error:', error.message);
//       throw new Error(`Transaction failed: ${error.message}`);
//     }
//   }

//   /**
//    * Get transaction history
//    */
//   async getTransactionHistory(address, limit = 50) {
//     try {
//       const response = await axios.get(`${this.apiBase}/txs`, {
//         params: { address, limit },
//         timeout: 15000
//       });

//       const transactions = response.data.txs || [];

//       return transactions.map(tx => ({
//         txHash: tx.txid,
//         time: new Date(tx.time * 1000),
//         confirmations: tx.confirmations,
//         value: (parseFloat(tx.valueOut || '0') / 1e8).toString(),
//         fees: (parseFloat(tx.fees || '0') / 1e8).toString(),
//         from: tx.vin?.[0]?.addr || 'Unknown',
//         to: tx.vout?.[0]?.scriptPubKey?.addresses?.[0] || 'Unknown',
//         status: tx.confirmations >= 6 ? 'confirmed' : 'pending'
//       }));
//     } catch (error) {
//       console.error('Error getting DASH transaction history:', error.message);
//       return [];
//     }
//   }

//   /**
//    * Validate Dash address
//    */
//   validateAddress(address) {
//     try {
//       bitcoin.address.toOutputScript(address, this.network);
//       return true;
//     } catch (error) {
//       return false;
//     }
//   }

//   /**
//    * Get network info
//    */
//   async getNetworkInfo() {
//     try {
//       const response = await axios.get(`${this.apiBase}/status`, { timeout: 10000 });
//       return {
//         network: this.isTestnet ? 'testnet' : 'mainnet',
//         blockHeight: response.data.info?.blocks || 0,
//         difficulty: response.data.info?.difficulty || 0
//       };
//     } catch (error) {
//       console.error('Error getting DASH network info:', error.message);
//       return null;
//     }
//   }
// }

// module.exports = DashService;