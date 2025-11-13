// scripts/check-health.js - System health check
require('dotenv').config();
const mongoose = require('mongoose');
const { checkProviderHealth } = require('../src/config/providers');

async function checkHealth() {
  console.log('🏥 System Health Check\n');

  // Check MongoDB
  console.log('Checking MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB: Connected\n');
  } catch (error) {
    console.log(`✗ MongoDB: Failed - ${error.message}\n`);
  }

  // Check RPC providers
  const networks = ['eth', 'polygon', 'bsc', 'solana'];
  
  console.log('Checking RPC Providers...');
  for (const network of networks) {
    try {
      const health = await checkProviderHealth(network, 'testnet');
      if (health.healthy) {
        console.log(`✓ ${network.toUpperCase()}: Healthy`);
        if (health.blockNumber) console.log(`  Block: ${health.blockNumber}`);
        if (health.slot) console.log(`  Slot: ${health.slot}`);
      } else {
        console.log(`✗ ${network.toUpperCase()}: ${health.error}`);
      }
    } catch (error) {
      console.log(`✗ ${network.toUpperCase()}: ${error.message}`);
    }
  }

  console.log('\n✓ Health check completed');
  process.exit(0);
}

checkHealth();

