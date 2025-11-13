
// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const apiKeyRoutes = require('./apiKeyRoutes');

router.use('/', apiKeyRoutes);
router.post('/register', AuthController.register);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/login', AuthController.login);
router.post('/resend-verification', AuthController.resendVerification);
router.post('/request-password-reset', AuthController.requestPasswordReset);
router.post('/reset-password', AuthController.resetPassword);
router.get('/profile', authenticate, AuthController.getProfile);

module.exports = router;