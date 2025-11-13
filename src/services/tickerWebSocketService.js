// services/tickerWebSocketService.js
const WebSocket = require('ws');
const EventEmitter = require('events');

/**
 * Simplified WebSocket service for ticker/price data only
 */
class TickerWebSocketService extends EventEmitter {
constructor() {
  super();
  this.connections = new Map();
  this.tickerData = new Map();
  this.isReady = false;
  this.supportedExchanges = ['binance', 'bybit', 'okx'];
  console.log('⭐ Supported exchanges: Binance, Bybit, OKX');
}

  /**
   * Initialize WebSocket service for tickers only
   */
// In services/tickerWebSocketService.js - Update initialize method
async initialize() {
  try {
    console.log('🚀 Starting Ticker WebSocket service (Binance, Bybit, OKX)...');
    
    // Initialize all remaining exchanges in parallel
    const initPromises = this.supportedExchanges.map(exchange => 
      this.initializeExchange(exchange).catch(error => {
        console.warn(`Failed to initialize ${exchange}:`, error.message);
        return false;
      })
    );
    
    await Promise.all(initPromises);
    
    this.isReady = true;
    console.log('✅ Ticker WebSocket service initialized without KuCoin');
    this.emit('ready');
    return true;
  } catch (error) {
    console.error('Error initializing Ticker WebSocket service:', error.message);
    throw error;
  }
}

  /**
   * Initialize a specific exchange WebSocket for tickers
   */
  async initializeExchange(exchange) {
    try {
      switch (exchange) {
        case 'binance':
          return await this.initBinanceTickers();
        case 'kucoin':
          return await this.initKucoinTickers();
        case 'bybit':
          return await this.initBybitTickers();
        case 'okx':
          return await this.initOkxTickers();
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error initializing ${exchange} ticker WebSocket:`, error.message);
      this.setupReconnection(exchange);
      return false;
    }
  }

  /**
   * Binance all-market tickers
   */

// Alternative Binance implementation using different URL
async initBinanceTickers() {
  return new Promise((resolve, reject) => {
    try {
      // Try alternative URL
      const wsUrl = 'wss://stream.binance.com:9443/ws/!ticker@arr';
      console.log(`🔌 Connecting to Binance: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl, {
        handshakeTimeout: 10000,
        perMessageDeflate: false
      });

      let receivedFirstMessage = false;

      ws.on('open', () => {
        console.log('✅ Binance WebSocket CONNECTED');
        this.connections.set('binance', ws);
        
        // Set timeout to check if we receive data
        setTimeout(() => {
          if (!receivedFirstMessage) {
            console.log('⚠️ No data received from Binance after 10 seconds');
          }
        }, 10000);
        
        resolve(true);
      });

      ws.on('message', (data) => {
        if (!receivedFirstMessage) {
          receivedFirstMessage = true;
          console.log('🎯 Received first Binance message!');
        }
        
        try {
          const tickers = JSON.parse(data);
          
          if (Array.isArray(tickers)) {
            // Process all tickers
            tickers.forEach(ticker => {
              if (ticker.s && ticker.c) {
                const symbol = this.formatSymbol(ticker.s, 'binance');
                const priceData = {
                  symbol: symbol,
                  price: parseFloat(ticker.c),
                  change: parseFloat(ticker.p),
                  changePercent: parseFloat(ticker.P),
                  high: parseFloat(ticker.h),
                  low: parseFloat(ticker.l),
                  volume: parseFloat(ticker.v),
                  quoteVolume: parseFloat(ticker.q),
                  open: parseFloat(ticker.o),
                  timestamp: ticker.E || Date.now(),
                  exchange: 'binance'
                };
                
                this.tickerData.set(symbol, priceData);
                this.emit('ticker', priceData);
              }
            });
          }
        } catch (error) {
          console.error('❌ Error processing Binance ticker:', error.message);
        }
      });

      ws.on('error', (error) => {
        console.error('❌ Binance WebSocket ERROR:', error.message);
        reject(error);
      });

      ws.on('close', (code, reason) => {
        console.log(`📤 Binance WebSocket CLOSED: ${code} - ${reason}`);
        this.connections.delete('binance');
        this.setupReconnection('binance');
      });

    } catch (error) {
      console.error('❌ Binance connection failed:', error.message);
      reject(error);
    }
  });
}


/**
 * KuCoin all-market tickers - Robust version
 */
async initKucoinTickers() {
  return new Promise(async (resolve, reject) => {
    try {
      // Get KuCoin token first
      const response = await fetch('https://api.kucoin.com/api/v1/bullet-public', { method: 'POST' });
      const result = await response.json();
      
      if (!result.data?.token) {
        throw new Error('Failed to get KuCoin WebSocket token');
      }
      
      const server = result.data.instanceServers[0];
      const wsUrl = `${server.endpoint}?token=${result.data.token}&connectId=${Date.now()}`;
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        console.log('✅ KuCoin ticker WebSocket connected');
        this.connections.set('kucoin', ws);
        
        // Subscribe to all tickers
        const subscribeMsg = {
          id: Date.now(),
          type: 'subscribe',
          topic: '/market/ticker:all',
          privateChannel: false,
          response: true
        };
        ws.send(JSON.stringify(subscribeMsg));
        console.log('📨 Sent KuCoin subscription:', subscribeMsg);
        
        // Keep alive
        setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ id: Date.now(), type: 'ping' }));
          }
        }, server.pingInterval);
        
        resolve(true);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // Skip ping responses and other non-ticker messages
          if (message.type === 'pong' || message.type === 'ack') {
            return;
          }
          
          // Log all messages initially to understand the structure
          if (message.topic === '/market/ticker:all') {
            console.log('📨 Received KuCoin ticker message:', JSON.stringify(message));
          }
          
          // Process ticker messages
          if (message.type === 'message' && message.topic === '/market/ticker:all' && message.data) {
            this.processKucoinTicker(message.data, message.subject);
          }
        } catch (error) {
          console.error('Error processing KuCoin message:', error.message);
          console.debug('Raw data:', data.toString());
        }
      });

      ws.on('error', (error) => {
        console.error('KuCoin ticker WebSocket error:', error.message);
        reject(error);
      });

      ws.on('close', () => {
        console.log('📤 KuCoin ticker WebSocket disconnected');
        this.connections.delete('kucoin');
        this.setupReconnection('kucoin');
      });

    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Process KuCoin ticker data with different possible structures
 */
processKucoinTicker(tickerData, subject) {
  try {
    let symbol, price, change, changePercent, high, low, volume, quoteVolume, timestamp;
    
    // Handle different message structures
    if (tickerData.symbol) {
      // Standard ticker structure (if available)
      symbol = tickerData.symbol;
      price = tickerData.price;
      change = tickerData.changePrice;
      changePercent = tickerData.changeRate;
      high = tickerData.high;
      low = tickerData.low;
      volume = tickerData.vol;
      quoteVolume = tickerData.volValue;
      timestamp = tickerData.time;
    } else if (subject && tickerData.price) {
      // KuCoin's actual structure - symbol is in subject, price data in data object
      symbol = subject;
      price = tickerData.price;
      // For this structure, we don't have change/volume data, so we'll use defaults
      change = 0;
      changePercent = 0;
      high = tickerData.bestAsk; // Using bestAsk as approximate high
      low = tickerData.bestBid;  // Using bestBid as approximate low
      volume = tickerData.size;
      quoteVolume = 0;
      timestamp = tickerData.time;
    } else {
      console.log('Unknown KuCoin ticker structure:', { subject, data: tickerData });
      return;
    }
    
    // Validate required fields
    if (!symbol || !price) {
      console.warn('KuCoin ticker missing required fields:', { symbol, price, data: tickerData });
      return;
    }
    
    const formattedSymbol = this.formatSymbol(symbol, 'kucoin');
    if (!formattedSymbol) {
      console.warn('KuCoin ticker symbol formatting failed for:', symbol);
      return;
    }
    
    const priceData = {
      symbol: formattedSymbol,
      price: parseFloat(price || 0),
      change: parseFloat(change || 0),
      changePercent: parseFloat(changePercent || 0) * 100,
      high: parseFloat(high || 0),
      low: parseFloat(low || 0),
      volume: parseFloat(volume || 0),
      quoteVolume: parseFloat(quoteVolume || 0),
      timestamp: timestamp || Date.now(),
      exchange: 'kucoin'
    };
    
    this.tickerData.set(formattedSymbol, priceData);
    this.emit('ticker', priceData);
    
    // Log successful processing for debugging
    console.log(`✅ Processed KuCoin ticker: ${formattedSymbol} = $${priceData.price}`);
    
  } catch (error) {
    console.error('Error in processKucoinTicker:', error.message);
  }
}

  /**
   * Bybit all-market tickers (Spot only)
   */
// In services/tickerWebSocketService.js - Update Bybit initialization
async initBybitTickers() {
  return new Promise((resolve, reject) => {
    try {
      const wsUrl = 'wss://stream.bybit.com/v5/public/spot';
      console.log(`🔌 Connecting to Bybit: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        console.log('✅ Bybit WebSocket CONNECTED');
        this.connections.set('bybit', ws);
        
        // Subscribe to ALL spot tickers
        const subscribeMsg = {
          op: 'subscribe',
          args: ['tickers.*']
        };
        
        ws.send(JSON.stringify(subscribeMsg));
        console.log('📡 Bybit subscribed to ALL spot pairs (tickers.*)');
        
        resolve(true);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          console.log(`📨 Bybit message type: ${message.op || 'data'}`);
          
          if (message.topic?.startsWith('tickers.') && message.data) {
            const ticker = message.data;
            const symbol = this.formatSymbol(ticker.symbol, 'bybit');
            
            console.log(`🎯 Bybit ticker: ${symbol} - $${ticker.lastPrice}`);
            
            const priceData = {
              symbol: symbol,
              price: parseFloat(ticker.lastPrice),
              change: parseFloat(ticker.price24hPcnt) * parseFloat(ticker.lastPrice),
              changePercent: parseFloat(ticker.price24hPcnt) * 100,
              high: parseFloat(ticker.highPrice24h),
              low: parseFloat(ticker.lowPrice24h),
              volume: parseFloat(ticker.volume24h),
              quoteVolume: parseFloat(ticker.turnover24h),
              timestamp: parseInt(ticker.time),
              exchange: 'bybit'
            };
            
            this.tickerData.set(symbol, priceData);
            this.emit('ticker', priceData);
          }
        } catch (error) {
          console.error('❌ Error processing Bybit ticker:', error.message);
        }
      });

      ws.on('error', (error) => {
        console.error('❌ Bybit WebSocket ERROR:', error.message);
        reject(error);
      });

      ws.on('close', (code, reason) => {
        console.log(`📤 Bybit WebSocket CLOSED: ${code} - ${reason}`);
        this.connections.delete('bybit');
        this.setupReconnection('bybit');
      });

    } catch (error) {
      console.error('❌ Bybit connection failed:', error.message);
      reject(error);
    }
  });
}
  /**
   * OKX all-market tickers
   */
// In services/tickerWebSocketService.js - Update OKX to include more pairs
async initOkxTickers() {
  return new Promise((resolve, reject) => {
    try {
      const wsUrl = 'wss://ws.okx.com:8443/ws/v5/public';
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        console.log('✅ OKX ticker WebSocket connected');
        this.connections.set('okx', ws);
        
        // Subscribe to a much larger set of pairs
        const majorPairs = [
          // Major USDT pairs
          'BTC-USDT', 'ETH-USDT', 'BNB-USDT', 'ADA-USDT', 'DOT-USDT',
          'LTC-USDT', 'XRP-USDT', 'LINK-USDT', 'BCH-USDT', 'XLM-USDT',
          'DOGE-USDT', 'SOL-USDT', 'MATIC-USDT', 'AVAX-USDT', 'ATOM-USDT',
          'NEAR-USDT', 'ALGO-USDT', 'FIL-USDT', 'ETC-USDT', 'EOS-USDT',
          'XTZ-USDT', 'AAVE-USDT', 'COMP-USDT', 'MKR-USDT', 'SUSHI-USDT',
          'CRV-USDT', 'UNI-USDT', 'YFI-USDT', 'BAT-USDT', 'ZRX-USDT',
          // Add more as needed
        ];
        
        // Subscribe in batches to avoid message size limits
        const batchSize = 20;
        for (let i = 0; i < majorPairs.length; i += batchSize) {
          const batch = majorPairs.slice(i, i + batchSize);
          ws.send(JSON.stringify({
            op: 'subscribe',
            args: batch.map(pair => ({ channel: 'tickers', instId: pair }))
          }));
        }
        
        console.log(`📡 OKX subscribed to ${majorPairs.length} pairs in batches`);
        
        // Keep alive
        setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 15000);
        
        resolve(true);
      });

      ws.on('message', (data) => {
        try {
          if (data.toString() === 'pong') return;
          
          const message = JSON.parse(data);
          
          if (message.arg?.channel === 'tickers' && message.data?.[0]) {
            const ticker = message.data[0];
            const symbol = this.formatSymbol(ticker.instId, 'okx');
            const priceData = {
              symbol: symbol,
              price: parseFloat(ticker.last),
              change: parseFloat(ticker.last) - parseFloat(ticker.open24h),
              changePercent: ((parseFloat(ticker.last) / parseFloat(ticker.open24h) - 1) * 100),
              high: parseFloat(ticker.high24h),
              low: parseFloat(ticker.low24h),
              volume: parseFloat(ticker.vol24h),
              quoteVolume: parseFloat(ticker.volCcy24h),
              timestamp: Date.now(),
              exchange: 'okx'
            };
            
            this.tickerData.set(symbol, priceData);
            this.emit('ticker', priceData);
          }
        } catch (error) {
          console.error('Error processing OKX ticker:', error.message);
        }
      });

      ws.on('error', (error) => {
        console.error('OKX ticker WebSocket error:', error.message);
        reject(error);
      });

      ws.on('close', () => {
        console.log('📤 OKX ticker WebSocket disconnected');
        this.connections.delete('okx');
        this.setupReconnection('okx');
      });

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Format symbol to consistent format: BASE/QUOTE
 */
formatSymbol(symbol, exchange) {
  if (!symbol || typeof symbol !== 'string') {
    console.warn(`Invalid symbol for ${exchange}:`, symbol);
    return null;
  }

  try {
    switch (exchange) {
      case 'binance':
        // BTCUSDT -> BTC/USDT
        return symbol.replace(/USDT$/, '/USDT')
                    .replace(/BUSD$/, '/BUSD')
                    .replace(/BTC$/, '/BTC');
      case 'kucoin':
        // BTC-USDT -> BTC/USDT
        return symbol.replace('-', '/');
      case 'bybit':
        // BTCUSDT -> BTC/USDT
        return symbol.replace(/USDT$/, '/USDT')
                    .replace(/BTC$/, '/BTC');
      case 'okx':
        // BTC-USDT -> BTC/USDT
        return symbol.replace('-', '/');
      default:
        return symbol;
    }
  } catch (error) {
    console.error(`Error formatting symbol ${symbol} for ${exchange}:`, error.message);
    return null;
  }
}

  /**
   * Setup reconnection for failed WebSockets
   */
  setupReconnection(exchange) {
    setTimeout(() => {
      console.log(`🔄 Attempting to reconnect ${exchange}...`);
      this.initializeExchange(exchange).catch(error => {
        console.error(`Failed to reconnect ${exchange}:`, error.message);
      });
    }, 10000); // Retry after 10 seconds
  }

  /**
   * Get all current ticker data
   */
  getAllTickers() {
    return Array.from(this.tickerData.values());
  }

  /**
   * Get ticker for specific symbol
   */
  getTicker(symbol) {
    return this.tickerData.get(symbol);
  }

  /**
   * Close all connections
   */
  close() {
    for (const [exchange, ws] of this.connections.entries()) {
      try {
        ws.close();
        console.log(`Closed ${exchange} WebSocket`);
      } catch (error) {
        console.error(`Error closing ${exchange} WebSocket:`, error.message);
      }
    }
    
    this.connections.clear();
    this.isReady = false;
    console.log('All WebSocket connections closed');
  }
}

// Create and export singleton instance
const tickerWebSocketService = new TickerWebSocketService();

module.exports = tickerWebSocketService;