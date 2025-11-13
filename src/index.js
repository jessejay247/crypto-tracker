// index.js - Vercel REST API Only
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// MongoDB connection middleware
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 1
      });
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      return res.status(500).json({ error: 'Database connection failed' });
    }
  }
  next();
});

// Your existing routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/transaction', require('./routes/transactionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/gastank', require('./routes/gasTankRoutes'));
app.use('/api/config', require('./routes/configRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/tokens', require('./routes/customerTokenRoutes'));
app.use('/api/customer', require('./routes/customerDashboardRoutes'));

// Ticker endpoints pointing to Railway WebSocket server
app.get('/api/tickers/websocket-info', (req, res) => {
  const wsServerUrl = process.env.RAILWAY_WS_URL || 'wss://your-app.up.railway.app';
  res.json({
    endpoint: `${wsServerUrl}/ws/tickers`,
    ready: true,
    supported_exchanges: ['binance', 'bybit', 'okx'],
    example_messages: [
      { type: 'subscribe_tickers', description: 'Subscribe to live ticker updates' },
      { type: 'unsubscribe_tickers', description: 'Unsubscribe from updates' },
      { type: 'get_tickers', description: 'Get all current tickers' },
      { type: 'ping', description: 'Check connection' }
    ]
  });
});

// Get current tickers - will return empty or cached data
app.get('/api/tickers', (req, res) => {
  res.json({
    tickers: {},
    message: "WebSocket server runs on Railway - use /api/tickers/websocket-info for connection details",
    timestamp: Date.now()
  });
});

app.get('/api/tickers/symbols', (req, res) => {
  res.json({
    symbols: [],
    message: "Connect to Railway WebSocket server for live symbols",
    timestamp: Date.now()
  });
});

app.get('/api/tickers/status', (req, res) => {
  res.json({
    message: "WebSocket server runs on separate Railway instance",
    railway_url: process.env.RAILWAY_WS_URL || "Not configured",
    timestamp: Date.now()
  });
});

// Health check (MongoDB only)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    platform: 'Vercel REST API'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server (for local development)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Vercel REST API on port ${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
  });
}

// Export for Vercel
module.exports = app;