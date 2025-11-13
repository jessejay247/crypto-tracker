// controllers/tickerWebSocketController.js
const tickerWebSocketService = require('../services/tickerWebSocketService');

/**
 * Simple WebSocket controller for ticker data only
 */
class TickerWebSocketController {
  constructor() {
    this.clients = new Set();
    this.subscribedClients = new Set(); // Clients subscribed to ticker updates
  }

  /**
   * Initialize the WebSocket controller
   */
  initialize(wss) {
    this.wss = wss;
    
    // Set up connection handler
    this.wss.on('connection', this.handleConnection.bind(this));
    
    // Listen for ticker updates from the service
    tickerWebSocketService.on('ticker', this.handleTickerUpdate.bind(this));
    
    console.log('✅ Ticker WebSocket controller initialized');
    return true;
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws) {
    console.log('📡 New WebSocket connection for ticker data');
    
    this.clients.add(ws);
    
    // Send welcome message with current tickers
    this.sendToClient(ws, {
      type: 'welcome',
      message: 'Connected to Ticker WebSocket',
      tickers: tickerWebSocketService.getAllTickers(),
      timestamp: Date.now()
    });

    ws.on('message', (message) => this.handleMessage(ws, message));
    
    ws.on('close', () => {
      console.log('📤 WebSocket client disconnected');
      this.clients.delete(ws);
      this.subscribedClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
      this.clients.delete(ws);
      this.subscribedClients.delete(ws);
    });
  }

  /**
   * Handle WebSocket messages
   */
  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'ping':
          this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
          break;
          
        case 'subscribe_tickers':
          this.subscribedClients.add(ws);
          this.sendToClient(ws, {
            type: 'subscribed',
            message: 'Subscribed to ticker updates',
            timestamp: Date.now()
          });
          break;
          
        case 'unsubscribe_tickers':
          this.subscribedClients.delete(ws);
          this.sendToClient(ws, {
            type: 'unsubscribed',
            message: 'Unsubscribed from ticker updates',
            timestamp: Date.now()
          });
          break;
          
        case 'get_tickers':
          this.sendToClient(ws, {
            type: 'tickers',
            tickers: tickerWebSocketService.getAllTickers(),
            timestamp: Date.now()
          });
          break;
          
        default:
          this.sendToClient(ws, {
            type: 'error',
            message: `Unknown message type: ${data.type}`,
            timestamp: Date.now()
          });
      }
    } catch (error) {
      this.sendToClient(ws, {
        type: 'error',
        message: 'Invalid message format',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle ticker updates from the service
   */
  handleTickerUpdate(tickerData) {
    // Broadcast to all subscribed clients
    this.broadcastToSubscribed({
      type: 'ticker_update',
      data: tickerData,
      timestamp: Date.now()
    });
  }

  /**
   * Send data to a specific client
   */
  sendToClient(ws, data) {
    if (ws.readyState === 1) { // OPEN
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast to all subscribed clients
   */
  broadcastToSubscribed(data) {
    this.subscribedClients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify(data));
      }
    });
  }

  /**
   * Start the controller
   */
  start() {
    console.log('✅ Ticker WebSocket controller started');
  }

  /**
   * Stop the controller
   */
  stop() {
    for (const client of this.clients) {
      client.terminate();
    }
    this.clients.clear();
    this.subscribedClients.clear();
    console.log('✅ Ticker WebSocket controller stopped');
  }
}

// Create and export singleton instance
const tickerWebSocketController = new TickerWebSocketController();

module.exports = tickerWebSocketController;