// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const http = require('http');
// const WebSocket = require('ws');
// require('dotenv').config();

// const app = express();
// const server = http.createServer(app);

// // Create WebSocket server for tickers
// const wss = new WebSocket.Server({ 
//   server,
//   path: '/ws/tickers' // Specific path for ticker WebSocket
// });

// // Import ticker services
// const tickerWebSocketService = require('./services/tickerWebSocketService');
// const tickerWebSocketController = require('./controllers/tickerWebSocketController');

// // Initialize WebSocket controller
// tickerWebSocketController.initialize(wss);

// app.use(helmet());
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//   credentials: true
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100
// });
// app.use('/api/', limiter);

// // MongoDB connection middleware
// app.use(async (req, res, next) => {
//   if (mongoose.connection.readyState === 0) {
//     try {
//       await mongoose.connect(process.env.MONGODB_URI, {
//         bufferCommands: false,
//         maxPoolSize: 1
//       });
//     } catch (error) {
//       console.error('MongoDB connection failed:', error);
//       return res.status(500).json({ error: 'Database connection failed' });
//     }
//   }
//   next();
// });

// // Your existing routes
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/wallet', require('./routes/walletRoutes'));
// app.use('/api/transaction', require('./routes/transactionRoutes'));
// app.use('/api/admin', require('./routes/adminRoutes'));
// app.use('/api/gastank', require('./routes/gasTankRoutes'));
// app.use('/api/config', require('./routes/configRoutes'));
// app.use('/api/analytics', require('./routes/analyticsRoutes'));
// app.use('/api/tokens', require('./routes/customerTokenRoutes'));
// app.use('/api/customer', require('./routes/customerDashboardRoutes'));

// // Ticker WebSocket info endpoint
// app.get('/api/tickers/websocket-info', (req, res) => {
//   res.json({
//     endpoint: `ws://${req.get('host')}/ws/tickers`,
//     ready: tickerWebSocketService.isReady,
//     supported_exchanges: tickerWebSocketService.supportedExchanges,
//     example_messages: [
//       { type: 'subscribe_tickers', description: 'Subscribe to live ticker updates' },
//       { type: 'unsubscribe_tickers', description: 'Unsubscribe from updates' },
//       { type: 'get_tickers', description: 'Get all current tickers' },
//       { type: 'ping', description: 'Check connection' }
//     ]
//   });
// });

// // Get current tickers via REST (fallback)
// app.get('/api/tickers', (req, res) => {
//   res.json({
//     tickers: tickerWebSocketService.getAllTickers(),
//     timestamp: Date.now()
//   });
// });


// app.get('/api/tickers/symbols', (req, res) => {
//   const symbols = Array.from(tickerWebSocketService.tickerData.keys());
//   res.json({
//     symbols: symbols,
//     count: symbols.length,
//     timestamp: Date.now()
//   });
// });


// // In your index.js - Add connection status endpoint
// app.get('/api/tickers/status', (req, res) => {
//   const status = {
//     binance: tickerWebSocketService.connections.has('binance'),
//     bybit: tickerWebSocketService.connections.has('bybit'),
//     okx: tickerWebSocketService.connections.has('okx'),
//     totalSymbols: tickerWebSocketService.tickerData.size,
//     binanceSymbols: Array.from(tickerWebSocketService.tickerData.values())
//       .filter(t => t.exchange === 'binance').length,
//     bybitSymbols: Array.from(tickerWebSocketService.tickerData.values())
//       .filter(t => t.exchange === 'bybit').length,
//     okxSymbols: Array.from(tickerWebSocketService.tickerData.values())
//       .filter(t => t.exchange === 'okx').length,
//   };
//   res.json(status);
// });


// app.get('/health', (req, res) => {
//   res.json({
//     status: 'healthy',
//     timestamp: new Date(),
//     websocket: {
//       connected_clients: tickerWebSocketController.clients.size,
//       subscribed_clients: tickerWebSocketController.subscribedClients.size,
//       service_ready: tickerWebSocketService.isReady
//     }
//   });
// });

// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     error: 'Internal server error',
//     message: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });

// app.use((req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

// // Initialize ticker WebSocket service in background
// async function initializeTickerService() {
//   try {
//     await tickerWebSocketService.initialize();
//     tickerWebSocketController.start();
//     console.log('🎯 Ticker service ready - Live market data flowing!');
//   } catch (error) {
//     console.error('❌ Ticker service initialization failed:', error.message);
//   }
// }

// // Start server
// if (require.main === module) {
//   mongoose.connect(process.env.MONGODB_URI)
//     .then(() => {
//       const PORT = process.env.PORT || 3000;
//       server.listen(PORT, () => {
//         console.log(`🚀 Server on port ${PORT}`);
//         console.log(`📡 Ticker WebSocket: ws://localhost:${PORT}/ws/tickers`);
//         console.log(`ℹ️  WebSocket info: http://localhost:${PORT}/api/tickers/websocket-info`);
        
//         // Initialize ticker service after server starts
//         setTimeout(() => {
//           initializeTickerService();
//         }, 1000);
//       });
//     });
// }

// module.exports = { app, server };