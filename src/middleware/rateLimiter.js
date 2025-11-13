
// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// General API rate limiter
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for auth endpoints
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit to 5 requests per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later'
});

// Transaction rate limiter
exports.transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit to 10 transactions per minute
  message: 'Transaction rate limit exceeded'
});
