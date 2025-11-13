// backend/src/controllers/walletController.js - FIXED
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const CommissionService = require('../services/commissionService');
const GasTankService = require('../services/gasTankService');
const CustomerTokenService = require('../services/customerTokenService');

// Import blockchain services
const BtcService = require('../services/blockchain/btcService');
const EthService = require('../services/blockchain/ethService');
const PolygonService = require('../services/blockchain/polygonService');
const BscService = require('../services/blockchain/bscService');
const SolService = require('../services/blockchain/solService');
const TronService = require('../services/blockchain/tronService');
const LtcService = require('../services/blockchain/ltcService');
const DogeService = require('../services/blockchain/dogeService');
const XrpService = require('../services/blockchain/xrpService');

class WalletController {
  /**
   * Create new wallet
   */
  static async createWallet(req, res) {
    try {
      const { network, label, environment = 'testnet' } = req.body;
      
      const networkUpper = network.toUpperCase();
      const supportedNetworks = ['BTC', 'ETH', 'POLYGON', 'BSC', 'SOL', 'TRX', 'LTC', 'DOGE', 'DASH', 'XRP'];
      
      if (!supportedNetworks.includes(networkUpper)) {
        return res.status(400).json({ error: `Network ${network} is not supported` });
      }

      if (!['mainnet', 'testnet'].includes(environment)) {
        return res.status(400).json({ error: 'Environment must be either "mainnet" or "testnet"' });
      }
      
      // Check wallet limit
      const walletCount = await Wallet.countDocuments({ userId: req.userId });
      if (walletCount >= 100) {
        return res.status(400).json({ error: 'Maximum wallet limit reached' });
      }
      
      // Generate wallet using appropriate service
      const service = WalletController.getBlockchainService(networkUpper, environment);
      const walletData = await service.generateWallet();
      
      // Create wallet record
      const wallet = new Wallet({
        userId: req.userId,
        network: networkUpper,
        environment,
        address: walletData.address,
        privateKey: walletData.privateKey,
        publicKey: walletData.publicKey || walletData.mnemonic,
        label,
        balance: '0'
      });
      
      await wallet.save();
      
      res.status(201).json({
        message: 'Wallet created successfully',
        wallet: {
          id: wallet._id,
          network: wallet.network,
          environment: wallet.environment,
          address: wallet.address,
          label: wallet.label
        }
      });
    } catch (error) {
      console.error('Create wallet error:', error);
      res.status(500).json({ error: 'Failed to create wallet', details: error.message });
    }
  }
  
  /**
   * Get user's wallets
   */
  static async getWallets(req, res) {
    try {
      const { network, environment } = req.query;
      
      const query = { userId: req.userId, isActive: true };
      if (network) {
        query.network = network.toUpperCase();
      }
      if (environment) {
        query.environment = environment;
      }
      
      const wallets = await Wallet.find(query).select('-privateKey');
      
      res.json({ wallets });
    } catch (error) {
      console.error('Get wallets error:', error);
      res.status(500).json({ error: 'Failed to get wallets' });
    }
  }
  
  /**
   * Get wallet balance
   */
  static async getBalance(req, res) {
    try {
      const { walletId } = req.params;
      
      const wallet = await Wallet.findOne({ _id: walletId, userId: req.userId });
      
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      const service = WalletController.getBlockchainService(wallet.network, wallet.environment);
      const balance = await service.getBalance(wallet.address);
      
      // Update wallet balance
      wallet.balance = balance;
      wallet.lastBalanceUpdate = new Date();
      await wallet.save();
      
      res.json({
        wallet: {
          id: wallet._id,
          network: wallet.network,
          environment: wallet.environment,
          address: wallet.address,
          balance
        }
      });
    } catch (error) {
      console.error('Get balance error:', error);
      res.status(500).json({ error: 'Failed to get balance' });
    }
  }
  
  /**
   * Send transaction with commission and gas tank support
   */
  static async sendTransaction(req, res) {
    try {
      console.log('=== SEND TRANSACTION DEBUG ===');
      console.log('Body:', JSON.stringify(req.body, null, 2));
      console.log('walletId type:', typeof req.body.walletId);
      console.log('amount type:', typeof req.body.amount);
      console.log('==============================');
      
      const { walletId, toAddress, amount, tokenAddress } = req.body;
      
      // Get wallet
      const wallet = await Wallet.findOne({ _id: walletId, userId: req.userId });
      
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      const isTokenTransaction = !!tokenAddress;
      let tokenDetails = null;
      
      // Validate token if provided
      if (isTokenTransaction) {
        // Check if network supports tokens
        const tokenNetworks = ['ETH', 'BSC', 'POLYGON', 'SOL', 'TRX'];
        if (!tokenNetworks.includes(wallet.network)) {
          return res.status(400).json({ error: `Token transactions not supported on ${wallet.network}` });
        }
        
        // Verify customer has this token enabled
        tokenDetails = await CustomerTokenService.getTokenDetails(req.userId, wallet.network, tokenAddress);
      }
      
      // Check if gas tank will be used
      const user = await User.findById(req.userId);
      const gasTankConfig = user.getGasTankConfig(wallet.network);
      const gasTankWillBeUsed = isTokenTransaction && gasTankConfig && gasTankConfig.enabled;
      
      // If gas tank enabled but not funded, check user has native tokens
      if (gasTankWillBeUsed) {
        const hasSufficient = await GasTankService.hasSufficientBalance(req.userId, wallet.network);
        
        if (!hasSufficient) {
          // Check if user has native token for gas
          const service = WalletController.getBlockchainService(wallet.network, wallet.environment);
          const nativeBalance = await service.getBalance(wallet.address);
          
          if (parseFloat(nativeBalance) < 0.001) {
            return res.status(400).json({ 
              error: 'Insufficient gas. Please fund your gas tank or ensure wallet has native tokens for gas fees.',
              details: {
                gasTankBalance: '0',
                walletNativeBalance: nativeBalance,
                gasTankAddress: gasTankConfig.address
              }
            });
          }
        }
      }
      
      // Calculate all fees
      const feeBreakdown = await CommissionService.calculateTransactionFees(
        req.userId,
        wallet.network,
        amount,
        isTokenTransaction,
        gasTankWillBeUsed
      );
      
      // Validate sufficient balance after fees
      const service = WalletController.getBlockchainService(wallet.network, wallet.environment);
      
      if (isTokenTransaction) {
        const tokenBalance = await service.getTokenBalance(wallet.address, tokenAddress);
        
        if (parseFloat(tokenBalance) < parseFloat(amount)) {
          return res.status(400).json({ 
            error: 'Insufficient token balance',
            balance: tokenBalance,
            required: amount
          });
        }
      } else {
        const balance = await service.getBalance(wallet.address);
        
        if (parseFloat(balance) < feeBreakdown.originalAmount) {
          return res.status(400).json({ 
            error: 'Insufficient balance',
            balance,
            required: feeBreakdown.originalAmount
          });
        }
      }
      
      // Execute transaction
      let txResult;
      
      if (isTokenTransaction) {
        txResult = await WalletController.executeTokenTransaction(
          wallet,
          toAddress,
          tokenAddress,
          tokenDetails,
          feeBreakdown,
          gasTankWillBeUsed
        );
      } else {
        txResult = await WalletController.executeNativeTransaction(
          wallet,
          toAddress,
          feeBreakdown
        );
      }
      
      // Record transaction
      const transaction = new Transaction({
        userId: req.userId,
        walletId: wallet._id,
        network: wallet.network,
        type: 'send',
        from: wallet.address,
        to: toAddress,
        amount: amount.toString(),
        isTokenTransaction,
        tokenAddress,
        tokenSymbol: tokenDetails?.symbol,
        tokenDecimals: tokenDetails?.decimals,
        txHash: txResult.txHash,
        originalAmount: feeBreakdown.originalAmount.toString(),
        netAmount: feeBreakdown.netAmount.toString(),
        adminCommission: {
          applied: feeBreakdown.adminCommission.enabled,
          amount: feeBreakdown.adminCommission.amount.toString(),
          rate: feeBreakdown.adminCommission.rate,
          address: feeBreakdown.adminCommission.address
        },
        customerFee: {
          applied: feeBreakdown.customerFee.enabled,
          amount: feeBreakdown.customerFee.amount.toString(),
          rate: feeBreakdown.customerFee.rate
        },
        gasTank: {
          used: gasTankWillBeUsed,
          amount: txResult.gasUsed || '0',
          network: wallet.network
        },
        status: 'confirmed'
      });
      
      await transaction.save();
      
      // Update customer stats
      await user.updateStats({
        totalTransactions: (user.stats.totalTransactions || 0) + 1,
        totalVolume: (parseFloat(user.stats.totalVolume || '0') + parseFloat(amount)).toString(),
        totalFeesEarned: (parseFloat(user.stats.totalFeesEarned || '0') + feeBreakdown.customerFee.amount).toString()
      });
      
      // Record admin commission
      if (feeBreakdown.adminCommission.enabled) {
        await CommissionService.recordCommission({
          userId: req.userId,
          network: wallet.network,
          txHash: txResult.txHash,
          commissionTxHash: txResult.commissionTxHash,
          commissionAmount: feeBreakdown.adminCommission.amount,
          commissionAddress: feeBreakdown.adminCommission.address,
          commissionRate: feeBreakdown.adminCommission.rate
        });
      }
      
      res.json({
        success: true,
        transaction: {
          id: transaction._id,
          txHash: txResult.txHash,
          network: wallet.network,
          environment: wallet.environment,
          amount: feeBreakdown.netAmount,
          fees: {
            adminCommission: feeBreakdown.adminCommission.amount,
            customerFee: feeBreakdown.customerFee.amount,
            total: feeBreakdown.totalFees
          },
          gasTankUsed: gasTankWillBeUsed
        }
      });
    } catch (error) {
      console.error('Send transaction error:', error);
      res.status(500).json({ error: 'Transaction failed', details: error.message });
    }
  }
  
  /**
   * Execute native token transaction
   */
  static async executeNativeTransaction(wallet, toAddress, feeBreakdown) {
    const service = WalletController.getBlockchainService(wallet.network, wallet.environment);
    
    // Send main transaction with net amount
    const txHash = await service.sendTransaction(
      wallet.privateKey,
      toAddress,
      feeBreakdown.netAmount
    );
    
    return {
      txHash,
      gasUsed: '0'
    };
  }
  
  /**
   * Execute token transaction
   */
  static async executeTokenTransaction(wallet, toAddress, tokenAddress, tokenDetails, feeBreakdown, gasTankUsed) {
    const service = WalletController.getBlockchainService(wallet.network, wallet.environment);
    
    // If gas tank used, sponsor the gas
    if (gasTankUsed) {
      await GasTankService.sponsorGas(
        wallet.userId,
        wallet.network,
        tokenAddress,
        100000 // Estimated gas units
      );
    }
    
    // Send token with net amount (after all fees)
    const txHash = await service.sendToken(
      wallet.privateKey,
      tokenAddress,
      toAddress,
      feeBreakdown.netAmount,
      tokenDetails.decimals
    );
    
    return {
      txHash,
      gasUsed: gasTankUsed ? '0.001' : '0'
    };
  }
  
  /**
   * Get transaction history
   */
  static async getTransactions(req, res) {
    try {
      const { walletId, limit = 20, offset = 0 } = req.query;
      
      const query = { userId: req.userId };
      if (walletId) {
        query.walletId = walletId;
      }
      
      const transactions = await Transaction.find(query)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .populate('walletId', 'network environment address label');
      
      const total = await Transaction.countDocuments(query);
      
      res.json({
        transactions,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > (parseInt(offset) + parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to get transactions' });
    }
  }
  
  /**
   * Get blockchain service for network
   */
  static getBlockchainService(network, environment = 'testnet') {
    const env = environment === 'mainnet' ? 'mainnet' : 'testnet';
    
    const services = {
      'BTC': () => new BtcService(env),
      'ETH': () => new EthService(env),
      'POLYGON': () => new PolygonService(env),
      'BSC': () => new BscService(env),
      'SOL': () => new SolService(env),
      'TRX': () => new TronService(env),
      'LTC': () => new LtcService(env),
      'DOGE': () => new DogeService(env),
      'XRP': () => XrpService(env)
    };
    
    const serviceFactory = services[network];
    if (!serviceFactory) {
      throw new Error(`Service not found for network: ${network}`);
    }
    
    return serviceFactory();
  }




/**
   * Bulk create wallets for all supported networks
   */
  static async bulkCreateWallets(req, res) {
    try {
      const { environment = 'testnet', labelPrefix = '' } = req.body;

      // All supported networks
      const networks = ['BTC', 'ETH', 'POLYGON', 'BSC', 'SOL', 'TRX', 'LTC', 'DOGE', 'XRP'];
      
      const results = {
        success: [],
        failed: []
      };

      // Create wallets in parallel
      await Promise.all(
        networks.map(async (network) => {
          try {
            // Use the same service approach as createWallet
            const service = WalletController.getBlockchainService(network, environment);
            const walletData = await service.generateWallet();

            const wallet = new Wallet({
              userId: req.userId,
              network: network.toUpperCase(),
              environment,
              address: walletData.address,
              privateKey: walletData.privateKey,
              publicKey: walletData.publicKey || walletData.mnemonic,
              label: labelPrefix ? `${labelPrefix} ${network}` : `${network} Wallet`
            });

            await wallet.save();

            results.success.push({
              network,
              walletId: wallet._id,
              address: wallet.address,
              label: wallet.label
            });
          } catch (error) {
            results.failed.push({
              network,
              error: error.message
            });
          }
        })
      );

      res.status(201).json({
        message: `Created ${results.success.length} of ${networks.length} wallets`,
        environment,
        wallets: results.success,
        failed: results.failed.length > 0 ? results.failed : undefined
      });
    } catch (error) {
      console.error('Bulk create error:', error);
      res.status(500).json({ error: 'Bulk wallet creation failed', details: error.message });
    }
  }

  /**
   * Bulk get balances for all wallets and tokens
   */
  static async bulkGetBalances(req, res) {
    try {
      // Get all user wallets
      const wallets = await Wallet.find({ userId: req.userId, isActive: true });
      
      if (wallets.length === 0) {
        return res.json({ wallets: [], tokens: [] });
      }

      // Get customer's supported tokens
      const user = await User.findById(req.userId);
      const CustomerToken = require('../models/CustomerToken');
      const customerTokens = await CustomerToken.find({ 
        userId: req.userId, 
        enabled: true 
      });

      const results = {
        wallets: [],
        tokens: []
      };

      // Get native balances for all wallets in parallel
      await Promise.all(
        wallets.map(async (wallet) => {
          try {
            const service = WalletController.getBlockchainService(wallet.network, wallet.environment);
            const balance = await service.getBalance(wallet.address);

            results.wallets.push({
              walletId: wallet._id,
              network: wallet.network,
              environment: wallet.environment,
              address: wallet.address,
              label: wallet.label,
              balance,
              currency: wallet.network
            });
          } catch (error) {
            results.wallets.push({
              walletId: wallet._id,
              network: wallet.network,
              environment: wallet.environment,
              address: wallet.address,
              label: wallet.label,
              balance: '0',
              error: error.message
            });
          }
        })
      );

      // Get token balances for EVM wallets
      const evmWallets = wallets.filter(w => 
        ['ETH', 'POLYGON', 'BSC'].includes(w.network)
      );

      if (customerTokens.length > 0 && evmWallets.length > 0) {
        await Promise.all(
          evmWallets.map(async (wallet) => {
            const relevantTokens = customerTokens.filter(t => 
              t.network === wallet.network
            );

            await Promise.all(
              relevantTokens.map(async (token) => {
                try {
                  const service = WalletController.getBlockchainService(wallet.network, wallet.environment);
                  const balance = await service.getTokenBalance(
                    wallet.address,
                    token.contractAddress
                  );

                  results.tokens.push({
                    walletId: wallet._id,
                    network: wallet.network,
                    environment: wallet.environment,
                    address: wallet.address,
                    tokenName: token.name,
                    tokenSymbol: token.symbol,
                    tokenAddress: token.contractAddress,
                    balance,
                    decimals: token.decimals
                  });
                } catch (error) {
                  results.tokens.push({
                    walletId: wallet._id,
                    network: wallet.network,
                    tokenSymbol: token.symbol,
                    balance: '0',
                    error: error.message
                  });
                }
              })
            );
          })
        );
      }

      res.json({
        summary: {
          totalWallets: results.wallets.length,
          totalTokenBalances: results.tokens.length
        },
        wallets: results.wallets,
        tokens: results.tokens
      });
    } catch (error) {
      console.error('Bulk balance error:', error);
      res.status(500).json({ error: 'Failed to get bulk balances', details: error.message });
    }
  }

  /**
   * Get blockchain service for network with environment support
   */
  static getBlockchainService(network, environment = 'mainnet') {
    const env = environment === 'mainnet' ? 'mainnet' : 'testnet';
    
    const services = {
      'BTC': () => new BtcService(env),
      'ETH': () => new EthService(env),
      'POLYGON': () => new PolygonService(env),
      'BSC': () => new BscService(env),
      'SOL': () => new SolService(env),
      'TRX': () => new TronService(env),
      'LTC': () => new LtcService(env),
      'DOGE': () => new DogeService(env),
      'XRP': () => new XrpService(env)
    };
    
    const serviceFactory = services[network];
    if (!serviceFactory) {
      throw new Error(`Service not found for network: ${network}`);
    }
    
    return serviceFactory();
  }
  
}

module.exports = WalletController;