// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// require('dotenv').config();

// const app = express();

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

// // MongoDB connection middleware for each request
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

// // Routes
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/wallet', require('./routes/walletRoutes'));
// app.use('/api/transaction', require('./routes/transactionRoutes'));
// app.use('/api/admin', require('./routes/adminRoutes'));
// app.use('/api/gastank', require('./routes/gasTankRoutes'));
// app.use('/api/config', require('./routes/configRoutes'));
// app.use('/api/analytics', require('./routes/analyticsRoutes'));
// app.use('/api/tokens', require('./routes/customerTokenRoutes'));
// app.use('/api/customer', require('./routes/customerDashboardRoutes'));

// app.get('/health', (req, res) => {
//   res.json({
//     status: 'healthy',
//     timestamp: new Date(),
//     supported_networks: ['BTC', 'ETH', 'POLYGON', 'BSC', 'SOL', 'TRX', 'LTC', 'DOGE', 'DASH']
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

// // Only listen locally
// if (require.main === module) {
//   mongoose.connect(process.env.MONGODB_URI)
//     .then(() => {
//       const PORT = process.env.PORT || 3000;
//       app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
//     });
// }

// module.exports = app;