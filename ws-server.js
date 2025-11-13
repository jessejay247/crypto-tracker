// ws-server.js - Fix the import paths
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

// FIXED: Use correct relative paths
const tickerWebSocketService = require('../backend/src/services/tickerWebSocketService');
const tickerWebSocketController = require('../backend/src/controllers/tickerWebSocketController');

// Initialize WebSocket controller
if (tickerWebSocketController && tickerWebSocketController.initialize) {
  tickerWebSocketController.initialize(wss);
} else {
  console.log('⚠️  Ticker WebSocket controller not found, continuing without it');
}

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
      connected_clients: wss.clients.size,
      service_ready: false
    },
    platform: 'Render WebSocket Server'
  });
});

// Simple ticker endpoint
app.get('/api/tickers', (req, res) => {
  res.json({
    tickers: {},
    message: "WebSocket server starting up",
    timestamp: Date.now()
  });
});

app.get('/api/tickers/status', (req, res) => {
  res.json({
    status: "initializing",
    message: "WebSocket server running on Render",
    timestamp: Date.now()
  });
});

// Your existing routes (with error handling)
try {
  app.use('/api/auth', require('../backend/src/routes/authRoutes'));
  app.use('/api/wallet', require('../backend/src/routes/walletRoutes'));
  app.use('/api/transaction', require('../backend/src/routes/transactionRoutes'));
  app.use('/api/admin', require('../backend/src/routes/adminRoutes'));
  app.use('/api/gastank', require('../backend/src/routes/gasTankRoutes'));
  app.use('/api/config', require('../backend/src/routes/configRoutes'));
  app.use('/api/analytics', require('../backend/src/routes/analyticsRoutes'));
  app.use('/api/tokens', require('../backend/src/routes/customerTokenRoutes'));
  app.use('/api/customer', require('../backend/src/routes/customerDashboardRoutes'));
  console.log('✅ All routes loaded');
} catch (error) {
  console.log('⚠️  Some routes failed to load:', error.message);
}

// Initialize services
async function initializeServices() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 5
    });
    console.log('✅ MongoDB connected on Render');
    
    // Initialize ticker service if available
    if (tickerWebSocketService && tickerWebSocketService.initialize) {
      console.log('🎯 Initializing ticker service...');
      await tickerWebSocketService.initialize();
    }
    
    if (tickerWebSocketController && tickerWebSocketController.start) {
      tickerWebSocketController.start();
    }
    
    console.log('✅ Services initialized!');
  } catch (error) {
    console.error('❌ Service initialization failed:', error.message);
    // Continue running without ticker service
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
  if (tickerWebSocketController && tickerWebSocketController.stop) {
    tickerWebSocketController.stop();
  }
  await mongoose.connection.close();
  server.close(() => {
    console.log('Process terminated');
  });
});