// // src/services/blockchain/btcService.js
// const { BITCOIN } = require('../../config/networks');
// const bitcoin = require('bitcoinjs-lib');
// const { ECPairFactory } = require('ecpair');
// const ecc = require('../../utils/ecc.js');
// const axios = require('axios');

// const ECPair = ECPairFactory(ecc);
// bitcoin.initEccLib(ecc);

// class BitcoinService {
//   constructor(network = 'mainnet') {
//     this.network = network === 'mainnet' ? BITCOIN.mainnet : BITCOIN.testnet;
//     this.apiBase = BITCOIN.api[network];
//     this.isTestnet = network === 'testnet';
//   }

//   /**
//    * Generate new Bitcoin wallet
//    */
//   async generateWallet() {
//     const keyPair = ECPair.makeRandom({ network: this.network });
//     const { address } = bitcoin.payments.p2wpkh({
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
//    * Get Bitcoin balance
//    */
//   async getBalance(address) {
//     try {
//       const response = await axios.get(`${this.apiBase}/address/${address}`, { timeout: 10000 });
//       const data = response.data;
      
//       const confirmed = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
//       const unconfirmed = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;
//       const total = confirmed + unconfirmed;
      
//       return (total / 1e8).toString();
//     } catch (error) {
//       if (error.response?.status === 404) return '0';
//       throw new Error(`Failed to get BTC balance: ${error.message}`);
//     }
//   }

//   /**
//    * Send Bitcoin transaction
//    */
//   async sendTransaction(privateKey, toAddress, amount) {
//     try {
//       const keyPair = ECPair.fromWIF(privateKey, this.network);
//       const { address: fromAddress } = bitcoin.payments.p2wpkh({
//         pubkey: keyPair.publicKey,
//         network: this.network
//       });

//       console.log('Preparing BTC transaction:', { fromAddress, toAddress, amount });

//       // Get UTXOs
//       const utxosResponse = await axios.get(`${this.apiBase}/address/${fromAddress}/utxo`, { timeout: 10000 });
//       if (!utxosResponse.data || utxosResponse.data.length === 0) {
//         throw new Error('No spendable outputs found');
//       }

//       const utxos = utxosResponse.data;
//       const amountSatoshis = Math.floor(parseFloat(amount) * 1e8);
//       const feeRate = 10; // sat/byte
      
//       let totalInput = 0;
//       const selectedUtxos = [];

//       // Select UTXOs
//       for (const utxo of utxos) {
//         selectedUtxos.push(utxo);
//         totalInput += utxo.value;

//         const estimatedSize = 10 + (selectedUtxos.length * 148) + (2 * 34);
//         const estimatedFee = estimatedSize * feeRate;

//         if (totalInput >= amountSatoshis + estimatedFee) {
//           break;
//         }
//       }

//       const estimatedSize = 10 + (selectedUtxos.length * 148) + (2 * 34);
//       const fee = estimatedSize * feeRate;

//       if (totalInput < amountSatoshis + fee) {
//         throw new Error(`Insufficient balance. Have: ${totalInput / 1e8} BTC, Need: ${(amountSatoshis + fee) / 1e8} BTC`);
//       }

//       // Create PSBT
//       const psbt = new bitcoin.Psbt({ network: this.network });

//       // Add inputs
//       for (const utxo of selectedUtxos) {
//         const txHexResponse = await axios.get(`${this.apiBase}/tx/${utxo.txid}/hex`, { timeout: 10000 });
//         psbt.addInput({
//           hash: utxo.txid,
//           index: utxo.vout,
//           nonWitnessUtxo: Buffer.from(txHexResponse.data, 'hex')
//         });
//       }

//       // Add outputs
//       psbt.addOutput({
//         address: toAddress,
//         value: amountSatoshis
//       });

//       const change = totalInput - amountSatoshis - fee;
//       if (change > 546) { // Dust limit
//         psbt.addOutput({
//           address: fromAddress,
//           value: change
//         });
//       }

//       // Sign
//       for (let i = 0; i < selectedUtxos.length; i++) {
//         psbt.signInput(i, keyPair);
//       }

//       // Validate
//       const validator = (pubkey, msghash, signature) => ecc.verify(msghash, pubkey, signature);
//       for (let i = 0; i < selectedUtxos.length; i++) {
//         if (!psbt.validateSignaturesOfInput(i, validator)) {
//           throw new Error(`Signature validation failed for input ${i}`);
//         }
//       }

//       // Finalize and broadcast
//       psbt.finalizeAllInputs();
//       const tx = psbt.extractTransaction();
//       const txHex = tx.toHex();
//       const txId = tx.getId();

//       await axios.post(`${this.apiBase}/tx`, txHex, {
//         headers: { 'Content-Type': 'text/plain' },
//         timeout: 15000
//       });

//       console.log('✅ BTC transaction broadcast:', txId);
//       return txId;
//     } catch (error) {
//       console.error('BTC transaction error:', error.message);
//       throw new Error(`Transaction failed: ${error.message}`);
//     }
//   }

//   /**
//    * Get transaction history
//    */
//   async getTransactionHistory(address, limit = 50) {
//     try {
//       const response = await axios.get(`${this.apiBase}/address/${address}/txs`, { timeout: 15000 });
//       const txs = response.data || [];

//       return txs.slice(0, limit).map(tx => ({
//         txHash: tx.txid,
//         confirmations: tx.status.confirmed ? tx.status.block_height : 0,
//         time: tx.status.block_time ? new Date(tx.status.block_time * 1000) : null,
//         value: this.calculateTxValue(tx, address),
//         status: tx.status.confirmed ? 'confirmed' : 'pending'
//       }));
//     } catch (error) {
//       console.error('Error getting BTC transaction history:', error.message);
//       return [];
//     }
//   }

//   /**
//    * Calculate transaction value for address
//    */
//   calculateTxValue(tx, address) {
//     let received = 0;
//     let sent = 0;

//     for (const vout of tx.vout) {
//       if (vout.scriptpubkey_address === address) {
//         received += vout.value;
//       }
//     }

//     const isSender = tx.vin.some(vin => vin.prevout?.scriptpubkey_address === address);
//     if (isSender) {
//       for (const vout of tx.vout) {
//         sent += vout.value;
//       }
//     }

//     return ((received - sent) / 1e8).toString();
//   }

//   /**
//    * Validate Bitcoin address
//    */
//   validateAddress(address) {
//     try {
//       bitcoin.address.toOutputScript(address, this.network);
//       return true;
//     } catch (error) {
//       return false;
//     }
//   }
// }

// module.exports = BitcoinService;