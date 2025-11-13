// backend/ws-server.js - FIXED PATHS FOR YOUR STRUCTURE
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

// FIXED: Correct paths for your backend/src structure
const tickerWebSocketService = require('./src/services/tickerWebSocketService');
const tickerWebSocketController = require('./src/controllers/tickerWebSocketController');

// Initialize WebSocket controller
tickerWebSocketController.initialize(wss);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    websocket: {
      connected_clients: tickerWebSocketController.clients.size,
      subscribed_clients: tickerWebSocketController.subscribedClients.size,
      service_ready: tickerWebSocketService.isReady
    },
    platform: 'Render WebSocket Server'
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
    timestamp: Date.now()
  };
  res.json(status);
});

app.get('/api/tickers/symbols', (req, res) => {
  const symbols = Array.from(tickerWebSocketService.tickerData.keys());
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
    supported_exchanges: tickerWebSocketService.supportedExchanges,
    connected_clients: tickerWebSocketController.clients.size
  });
});

// Your existing routes (with correct paths)
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/wallet', require('./src/routes/walletRoutes'));
app.use('/api/transaction', require('./src/routes/transactionRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/gastank', require('./src/routes/gasTankRoutes'));
app.use('/api/config', require('./src/routes/configRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/tokens', require('./src/routes/customerTokenRoutes'));
app.use('/api/customer', require('./src/routes/customerDashboardRoutes'));

// Initialize services
async function initializeServices() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 5
    });
    console.log('✅ MongoDB connected on Render');
    
    console.log('🎯 Initializing ticker service...');
    await tickerWebSocketService.initialize();
    tickerWebSocketController.start();
    console.log('✅ Ticker service ready on Render!');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Render WebSocket Server running on port ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}/ws/tickers`);
  console.log(`🌐 HTTP: http://localhost:${PORT}`);
  
  // Initialize services after server starts
  setTimeout(initializeServices, 2000);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  tickerWebSocketController.stop();
  await mongoose.connection.close();
  server.close(() => {
    console.log('Process terminated');
  });
});