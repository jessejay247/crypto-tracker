// ws-server.js - Complete WebSocket Server for Railway
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Create WebSocket server for tickers
const wss = new WebSocket.Server({ 
  server,
  path: '/ws/tickers'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Import your existing services
const tickerWebSocketService = require('./services/tickerWebSocketService');
const tickerWebSocketController = require('./controllers/tickerWebSocketController');

// Initialize WebSocket controller
tickerWebSocketController.initialize(wss);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    websocket: {
      connected_clients: tickerWebSocketController.clients.size,
      subscribed_clients: tickerWebSocketController.subscribedClients.size,
      service_ready: tickerWebSocketService.isReady
    },
    timestamp: new Date().toISOString()
  });
});

// REST endpoints for ticker data
app.get('/api/tickers', (req, res) => {
  res.json({
    tickers: tickerWebSocketService.getAllTickers(),
    timestamp: Date.now()
  });
});

app.get('/api/tickers/status', (req, res) => {
  const status = {
    binance: tickerWebSocketService.connections.has('binance'),
    bybit: tickerWebSocketService.connections.has('bybit'),
    okx: tickerWebSocketService.connections.has('okx'),
    totalSymbols: tickerWebSocketService.tickerData.size,
    binanceSymbols: Array.from(tickerWebSocketService.tickerData.values())
      .filter(t => t.exchange === 'binance').length,
    bybitSymbols: Array.from(tickerWebSocketService.tickerData.values())
      .filter(t => t.exchange === 'bybit').length,
    okxSymbols: Array.from(tickerWebSocketService.tickerData.values())
      .filter(t => t.exchange === 'okx').length,
    timestamp: Date.now()
  };
  res.json(status);
});

app.get('/api/tickers/websocket-info', (req, res) => {
  res.json({
    endpoint: `wss://${req.get('host')}/ws/tickers`,
    ready: tickerWebSocketService.isReady,
    supported_exchanges: tickerWebSocketService.supportedExchanges,
    example_messages: [
      { type: 'subscribe_tickers', description: 'Subscribe to live ticker updates' },
      { type: 'unsubscribe_tickers', description: 'Unsubscribe from updates' },
      { type: 'get_tickers', description: 'Get all current tickers' },
      { type: 'ping', description: 'Check connection' }
    ]
  });
});

// Initialize services
async function initializeServices() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10
    });
    console.log('✅ MongoDB connected on Railway');
    
    console.log('🚀 Initializing ticker service...');
    await tickerWebSocketService.initialize();
    tickerWebSocketController.start();
    console.log('🎯 Ticker service ready on Railway!');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WebSocket Server running on port ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}/ws/tickers`);
  console.log(`🌐 HTTP: http://localhost:${PORT}`);
  
  // Initialize services after server starts
  setTimeout(initializeServices, 1000);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  server.close(() => {
    console.log('Process terminated');
  });
});