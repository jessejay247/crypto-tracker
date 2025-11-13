// ws-server.js - Railway WebSocket Server
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Create WebSocket server for tickers
const wss = new WebSocket.Server({ 
  server,
  path: '/ws/tickers',
  perMessageDeflate: false
});

// Import your existing services
const tickerWebSocketService = require('./../backend/src/services/tickerWebSocketService');
const tickerWebSocketController = require('./../backend/src/controllers/tickerWebSocketController');

// Initialize WebSocket controller
tickerWebSocketController.initialize(wss);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for Railway
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Health check with WebSocket info
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    websocket: {
      connected_clients: tickerWebSocketController.clients ? tickerWebSocketController.clients.size : 0,
      subscribed_clients: tickerWebSocketController.subscribedClients ? tickerWebSocketController.subscribedClients.size : 0,
      service_ready: tickerWebSocketService.isReady
    },
    platform: 'Railway WebSocket Server'
  });
});

// REST endpoints for ticker data
app.get('/api/tickers', (req, res) => {
  try {
    const tickers = tickerWebSocketService.getAllTickers ? tickerWebSocketService.getAllTickers() : {};
    res.json({
      tickers: tickers,
      count: Object.keys(tickers).length,
      timestamp: Date.now()
    });
  } catch (error) {
    res.json({
      tickers: {},
      message: "Ticker service initializing",
      timestamp: Date.now()
    });
  }
});

app.get('/api/tickers/status', (req, res) => {
  const status = {
    binance: tickerWebSocketService.connections ? tickerWebSocketService.connections.has('binance') : false,
    bybit: tickerWebSocketService.connections ? tickerWebSocketService.connections.has('bybit') : false,
    okx: tickerWebSocketService.connections ? tickerWebSocketService.connections.has('okx') : false,
    totalSymbols: tickerWebSocketService.tickerData ? tickerWebSocketService.tickerData.size : 0,
    timestamp: Date.now()
  };
  res.json(status);
});

app.get('/api/tickers/symbols', (req, res) => {
  const symbols = tickerWebSocketService.tickerData ? 
    Array.from(tickerWebSocketService.tickerData.keys()) : [];
  res.json({
    symbols: symbols,
    count: symbols.length,
    timestamp: Date.now()
  });
});

// WebSocket info endpoint
app.get('/api/tickers/websocket-info', (req, res) => {
  res.json({
    endpoint: `wss://${req.get('host')}/ws/tickers`,
    ready: tickerWebSocketService.isReady,
    supported_exchanges: tickerWebSocketService.supportedExchanges || ['binance', 'bybit', 'okx'],
    connected_clients: tickerWebSocketController.clients ? tickerWebSocketController.clients.size : 0
  });
});

// Initialize services
async function initializeServices() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 5
    });
    console.log('✅ MongoDB connected on Railway');
    
    console.log('🎯 Initializing ticker service...');
    if (tickerWebSocketService.initialize) {
      await tickerWebSocketService.initialize();
    }
    if (tickerWebSocketController.start) {
      tickerWebSocketController.start();
    }
    console.log('✅ Ticker service ready on Railway!');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    // Don't exit - keep the server running for WebSocket connections
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Railway WebSocket Server running on port ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}/ws/tickers`);
  console.log(`🌐 HTTP: http://localhost:${PORT}`);
  
  // Initialize services after server starts
  setTimeout(initializeServices, 2000);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (tickerWebSocketController.stop) {
    tickerWebSocketController.stop();
  }
  await mongoose.connection.close();
  server.close(() => {
    console.log('Process terminated');
  });
});