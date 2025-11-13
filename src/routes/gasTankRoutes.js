// src/routes/gasTankRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const GasTankService = require('../services/gasTankService');
const GasTank = require('../models/GasTank');

// All gas tank routes require authentication and admin role
router.use(authenticate);
// router.use(adminOnly);

// Create a new gas tank
router.post('/create', async (req, res) => {
  try {
    const { network, privateKey, minBalance } = req.body;

    if (!network || !privateKey || !minBalance) {
      return res.status(400).json({ error: 'Missing required fields: network, privateKey, minBalance' });
    }

    const gasTank = await GasTankService.createGasTank(network, privateKey, minBalance);

    res.status(201).json({
      message: 'Gas tank created successfully',
      network: gasTank.network,
      address: gasTank.address,
      minBalance: GasTankService.convertFromSmallestUnit(network, gasTank.minBalance)
    });
  } catch (error) {
    console.error('Error creating gas tank:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get gas tank details for a specific network
router.get('/:network', async (req, res) => {
  try {
    const { network } = req.params;
    const result = await GasTankService.updateBalance(network);

    res.json(result);
  } catch (error) {
    console.error('Error getting gas tank:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all gas tanks
router.get('/all', async (req, res) => {
  try {
    const gasTanks = await GasTank.find({});
    
    const tanksWithBalances = await Promise.all(
      gasTanks.map(async (tank) => {
        try {
          const balance = await GasTankService.getBalance(tank.network, tank.address);
          return {
            network: tank.network,
            address: tank.address,
            balance: balance,
            minBalance: GasTankService.convertFromSmallestUnit(tank.network, tank.minBalance),
            isActive: tank.isActive,
            needsRefill: parseFloat(balance) < parseFloat(GasTankService.convertFromSmallestUnit(tank.network, tank.minBalance))
          };
        } catch (error) {
          console.error(`Error getting balance for ${tank.network}:`, error);
          return {
            network: tank.network,
            address: tank.address,
            balance: '0',
            minBalance: GasTankService.convertFromSmallestUnit(tank.network, tank.minBalance),
            isActive: tank.isActive,
            error: 'Failed to fetch balance'
          };
        }
      })
    );

    res.json(tanksWithBalances);
  } catch (error) {
    console.error('Error getting all gas tanks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update gas tank balance (manual refresh)
router.put('/:network/update', async (req, res) => {
  try {
    const { network } = req.params;
    const result = await GasTankService.updateBalance(network);

    res.json({
      message: 'Gas tank balance updated',
      ...result
    });
  } catch (error) {
    console.error('Error updating gas tank balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get gas tank statistics
router.get('/stats/:network', async (req, res) => {
  try {
    const { network } = req.params;
    const stats = await GasTankService.getStatistics(network);

    res.json({
      network: network.toUpperCase(),
      statistics: stats
    });
  } catch (error) {
    console.error('Error getting gas tank stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete/deactivate gas tank
router.delete('/:network', async (req, res) => {
  try {
    const { network } = req.params;
    const upperNetwork = network.toUpperCase();

    const gasTank = await GasTank.findOne({ network: upperNetwork });
    
    if (!gasTank) {
      return res.status(404).json({ error: 'Gas tank not found' });
    }

    gasTank.isActive = false;
    await gasTank.save();

    res.json({
      message: 'Gas tank deactivated successfully',
      network: upperNetwork
    });
  } catch (error) {
    console.error('Error deleting gas tank:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;