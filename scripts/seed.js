// ============================================
// backend/scripts/seed.js - ENHANCED
// Initialize database with default configuration
// ============================================
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const SystemConfig = require('../src/models/SystemConfig');

async function seed() {
  try {
    console.log('\n🌱 Starting database seeding...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check if fresh mode
    const freshMode = process.argv.includes('--fresh');
    
    if (freshMode) {
      console.log('🔥 Fresh mode: Clearing existing data...');
      await User.deleteMany({ role: 'admin' });
      await SystemConfig.deleteMany({});
      console.log('✅ Existing data cleared\n');
    }
    
    // ========================================
    // CREATE SYSTEM CONFIGURATION
    // ========================================
    console.log('⚙️  Creating system configuration...');
    
    let config = await SystemConfig.findOne();
    
    if (!config || freshMode) {
      config = await SystemConfig.create({
        // Commission rates
        nativeCommissionRate: 0.5,
        tokenCommissionRate: 0.3,
        chargeTokenFeeWithoutGasTank: false,
        
        // Commission addresses (empty by default)
        commissionAddresses: [
          { network: 'BTC', address: '', enabled: false },
          { network: 'ETH', address: '', enabled: false },
          { network: 'POLYGON', address: '', enabled: false },
          { network: 'BSC', address: '', enabled: false },
          { network: 'SOL', address: '', enabled: false },
          { network: 'TRX', address: '', enabled: false },
          { network: 'LTC', address: '', enabled: false },
          { network: 'DOGE', address: '', enabled: false },
          { network: 'DASH', address: '', enabled: false }
        ],
        
        // Pre-approved tokens (popular tokens)
        preApprovedTokens: [
          // Ethereum Sepolia Testnet
          {
            network: 'ETH',
            contractAddress: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 6,
            logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
            enabled: true,
            verified: true
          },
          {
            network: 'ETH',
            contractAddress: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
            enabled: true,
            verified: true
          },
          
          // BSC Testnet
          {
            network: 'BSC',
            contractAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 18,
            logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
            enabled: true,
            verified: true
          },
          {
            network: 'BSC',
            contractAddress: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
            name: 'Binance USD',
            symbol: 'BUSD',
            decimals: 18,
            logo: 'https://cryptologos.cc/logos/binance-usd-busd-logo.png',
            enabled: true,
            verified: true
          },
          
          // Polygon Amoy Testnet
          {
            network: 'POLYGON',
            contractAddress: '0x3813e82e6f7098b9583FC0F33a962D02018B6803',
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 6,
            logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
            enabled: true,
            verified: true
          },
          {
            network: 'POLYGON',
            contractAddress: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
            enabled: true,
            verified: true
          }
        ],
        
        // System settings
        maintenanceMode: false,
        allowNewRegistrations: true,
        maxWalletsPerUser: 100,
        maxApiKeysPerUser: 10,
        
        rateLimit: {
          transactionsPerHour: 100,
          walletsPerDay: 50
        }
      });
      
      console.log('✅ System configuration created');
      console.log('   📊 Native commission rate: 0.5%');
      console.log('   📊 Token commission rate: 0.3%');
      console.log('   🪙 Pre-approved tokens: 6 tokens added');
      console.log('   ⚠️  Commission addresses are empty - configure in admin panel\n');
    } else {
      console.log('✅ System configuration already exists\n');
    }
    
    // ========================================
    // CREATE ADMIN USER
    // ========================================
    console.log('👤 Creating admin user...');
    
    const existingAdmin = await User.findOne({ email: 'admin@cryptosaas.com' });
    
    if (!existingAdmin || freshMode) {
      await User.create({
        email: 'admin@cryptosaas.com',
        password: 'Admin@123456',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isEmailVerified: true,
        isActive: true
      });
      
      console.log('✅ Admin user created');
      console.log('   📧 Email: admin@cryptosaas.com');
      console.log('   🔑 Password: Admin@123456');
      console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!\n');
    } else {
      console.log('✅ Admin user already exists\n');
    }
    
    // ========================================
    // CREATE DEMO CUSTOMER (OPTIONAL)
    // ========================================
    if (process.argv.includes('--with-demo')) {
      console.log('👥 Creating demo customer...');
      
      const existingCustomer = await User.findOne({ email: 'demo@customer.com' });
      
      if (!existingCustomer) {
        const demoCustomer = await User.create({
          email: 'demo@customer.com',
          password: 'Demo@123456',
          firstName: 'Demo',
          lastName: 'Customer',
          companyName: 'Demo Company Inc.',
          role: 'customer',
          isEmailVerified: true,
          isActive: true
        });
        
        // Generate API key for demo customer
        demoCustomer.generateApiKey('Demo API Key');
        await demoCustomer.save();
        
        console.log('✅ Demo customer created');
        console.log('   📧 Email: demo@customer.com');
        console.log('   🔑 Password: Demo@123456');
        console.log('   🔐 API Key: Generated (check customer dashboard)\n');
      }
    }
    
    // ========================================
    // SUMMARY
    // ========================================
    console.log('═'.repeat(60));
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log('\n📋 Next Steps:');
    console.log('   1. Start the backend:');
    console.log('      npm start\n');
    console.log('   2. Login to admin panel:');
    console.log('      http://localhost:5173/admin');
    console.log('      Email: admin@cryptosaas.com');
    console.log('      Password: Admin@123456\n');
    console.log('   3. Configure commission addresses for each network\n');
    console.log('   4. Customers can:');
    console.log('      - Register at: http://localhost:5173/register');
    console.log('      - Generate API keys in dashboard');
    console.log('      - Setup gas tanks for token transactions');
    console.log('      - Add custom tokens or use pre-approved ones\n');
    console.log('💡 Tips:');
    console.log('   - Run with --fresh to reset all data');
    console.log('   - Run with --with-demo to create demo customer');
    console.log('   - Example: node scripts/seed.js --fresh --with-demo\n');
    console.log('═'.repeat(60));
    
    if (!freshMode) {
      console.log('\n💡 To start fresh, run: node scripts/seed.js --fresh\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();