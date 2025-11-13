const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const CustomerDashboardController = require('../controllers/customerDashboardController');

router.get('/dashboard', authenticate, CustomerDashboardController.getDashboard);

module.exports = router;