// // src/services/blockchain/solService.js
// const { SOLANA } = require('../../config/networks');
// const { 
//   Connection, 
//   Keypair, 
//   LAMPORTS_PER_SOL, 
//   PublicKey, 
//   SystemProgram, 
//   Transaction,
//   sendAndConfirmTransaction
// } = require('@solana/web3.js');
// const bs58 = require('bs58');

// class SolanaService {
//   constructor(network = 'mainnet') {
//     this.network = network;
//     this.connection = new Connection(
//       SOLANA.rpc[network === 'mainnet' ? 'mainnet' : 'testnet'],
//       'confirmed'
//     );
//     this.isTestnet = network === 'testnet';
//   }

//   /**
//    * Generate new Solana wallet
//    */
//   generateWallet() {
//     const keypair = Keypair.generate();
//     return {
//       address: keypair.publicKey.toString(),
//       privateKey: bs58.encode(keypair.secretKey),
//       publicKey: keypair.publicKey.toString()
//     };
//   }

//   /**
//    * Get SOL balance
//    */
//   async getBalance(address) {
//     try {
//       const publicKey = new PublicKey(address);
//       const balance = await this.connection.getBalance(publicKey);
//       return (balance / LAMPORTS_PER_SOL).toString();
//     } catch (error) {
//       throw new Error(`Failed to get SOL balance: ${error.message}`);
//     }
//   }

//   /**
//    * Send SOL transaction
//    */
//   async sendTransaction(privateKey, toAddress, amount) {
//     try {
//       const fromKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
//       const toPublicKey = new PublicKey(toAddress);
      
//       console.log('Preparing SOL transaction:', {
//         from: fromKeypair.publicKey.toString(),
//         to: toAddress,
//         amount
//       });

//       const transaction = new Transaction().add(
//         SystemProgram.transfer({
//           fromPubkey: fromKeypair.publicKey,
//           toPubkey: toPublicKey,
//           lamports: Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL)
//         })
//       );

//       const signature = await sendAndConfirmTransaction(
//         this.connection,
//         transaction,
//         [fromKeypair],
//         { commitment: 'confirmed' }
//       );

//       console.log('✅ SOL transaction confirmed:', signature);
//       return signature;
//     } catch (error) {
//       console.error('SOL transaction error:', error.message);
//       throw new Error(`Transaction failed: ${error.message}`);
//     }
//   }

//   /**
//    * Get transaction history
//    */
//   async getTransactionHistory(address, limit = 50) {
//     try {
//       const publicKey = new PublicKey(address);
//       const signatures = await this.connection.getSignaturesForAddress(
//         publicKey,
//         { limit }
//       );

//       const transactions = await Promise.all(
//         signatures.map(async (signatureInfo) => {
//           try {
//             const tx = await this.connection.getTransaction(signatureInfo.signature, {
//               maxSupportedTransactionVersion: 0
//             });

//             if (!tx) return null;

//             const from = tx.transaction.message.accountKeys[0].toString();
//             const to = tx.transaction.message.accountKeys[1]?.toString() || 'Unknown';
//             const value = tx.meta?.postBalances && tx.meta?.preBalances
//               ? ((tx.meta.preBalances[0] - tx.meta.postBalances[0]) / LAMPORTS_PER_SOL).toString()
//               : '0';

//             return {
//               txHash: signatureInfo.signature,
//               blockTime: signatureInfo.blockTime ? new Date(signatureInfo.blockTime * 1000) : null,
//               status: tx.meta.err ? 'failed' : 'confirmed',
//               from,
//               to,
//               value,
//               fee: (tx.meta.fee / LAMPORTS_PER_SOL).toString()
//             };
//           } catch (error) {
//             console.error(`Error getting transaction ${signatureInfo.signature}:`, error.message);
//             return null;
//           }
//         })
//       );

//       return transactions.filter(tx => tx !== null);
//     } catch (error) {
//       console.error('Error getting SOL transaction history:', error.message);
//       return [];
//     }
//   }

//   /**
//    * Get token balance (SPL)
//    */
//   async getTokenBalance(tokenMint, walletAddress) {
//     try {
//       const { getAssociatedTokenAddress, getAccount } = require('@solana/spl-token');
      
//       const walletPublicKey = new PublicKey(walletAddress);
//       const mintPublicKey = new PublicKey(tokenMint);
      
//       const tokenAccountAddress = await getAssociatedTokenAddress(
//         mintPublicKey,
//         walletPublicKey
//       );

//       const tokenAccount = await getAccount(this.connection, tokenAccountAddress);
      
//       // Get mint info to get decimals
//       const { getMint } = require('@solana/spl-token');
//       const mintInfo = await getMint(this.connection, mintPublicKey);
      
//       const balance = Number(tokenAccount.amount) / Math.pow(10, mintInfo.decimals);
//       return balance.toString();
//     } catch (error) {
//       if (error.message.includes('could not find account')) {
//         return '0';
//       }
//       throw new Error(`Failed to get token balance: ${error.message}`);
//     }
//   }

//   /**
//    * Send token transaction (SPL)
//    */
//   async sendToken(privateKey, tokenMint, toAddress, amount) {
//     try {
//       const { 
//         getAssociatedTokenAddress, 
//         createTransferInstruction,
//         getMint 
//       } = require('@solana/spl-token');
      
//       const fromKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
//       const toPublicKey = new PublicKey(toAddress);
//       const mintPublicKey = new PublicKey(tokenMint);

//       // Get token accounts
//       const fromTokenAccount = await getAssociatedTokenAddress(
//         mintPublicKey,
//         fromKeypair.publicKey
//       );

//       const toTokenAccount = await getAssociatedTokenAddress(
//         mintPublicKey,
//         toPublicKey
//       );

//       // Get mint info for decimals
//       const mintInfo = await getMint(this.connection, mintPublicKey);
//       const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, mintInfo.decimals));

//       console.log('Preparing SPL token transaction:', {
//         from: fromKeypair.publicKey.toString(),
//         to: toAddress,
//         amount,
//         token: tokenMint
//       });

//       const transaction = new Transaction().add(
//         createTransferInstruction(
//           fromTokenAccount,
//           toTokenAccount,
//           fromKeypair.publicKey,
//           amountInSmallestUnit
//         )
//       );

//       const signature = await sendAndConfirmTransaction(
//         this.connection,
//         transaction,
//         [fromKeypair],
//         { commitment: 'confirmed' }
//       );

//       console.log('✅ SPL token transaction confirmed:', signature);
//       return signature;
//     } catch (error) {
//       console.error('SPL token transaction error:', error.message);
//       throw new Error(`Token transaction failed: ${error.message}`);
//     }
//   }

//   /**
//    * Validate Solana address
//    */
//   validateAddress(address) {
//     try {
//       new PublicKey(address);
//       return true;
//     } catch (error) {
//       return false;
//     }
//   }

//   /**
//    * Get recent block hash
//    */
//   async getRecentBlockhash() {
//     try {
//       const { blockhash } = await this.connection.getLatestBlockhash();
//       return blockhash;
//     } catch (error) {
//       throw new Error(`Failed to get recent blockhash: ${error.message}`);
//     }
//   }
// }

// module.exports = SolanaService;