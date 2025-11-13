// ============================================
// backend/src/routes/customerTokenRoutes.js
// ============================================
const express = require('express');
const router = express.Router();
const { authenticate, authenticateApiKey } = require('../middleware/auth');
const CustomerTokenController = require('../controllers/customerTokenController');

// Support both JWT and API key authentication
const auth = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  if (apiKey) {
    return authenticateApiKey(req, res, next);
  }
  return authenticate(req, res, next);
};

router.post('/add', auth, CustomerTokenController.addToken);
router.get('/', auth, CustomerTokenController.getTokens);
router.patch('/:tokenId/toggle', auth, CustomerTokenController.toggleToken);
router.delete('/:tokenId', auth, CustomerTokenController.removeToken);

module.exports = router;