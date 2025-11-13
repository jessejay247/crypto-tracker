// ============================================
// scripts/fix-wallet-index.js
// Run this ONCE to fix the database
// ============================================

require('dotenv').config();
const mongoose = require('mongoose');

async function fixWalletIndex() {
  try {
    console.log('🔧 Fixing Wallet Database Indexes...\n');
    console.log('=' .repeat(60));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const walletsCollection = db.collection('wallets');
    
    // Step 1: Check existing indexes
    console.log('\n📊 Current Indexes:');
    const indexes = await walletsCollection.indexes();
    indexes.forEach(index => {
      console.log(`   - ${JSON.stringify(index.key)} (${index.name})`);
    });
    
    // Step 2: Drop the problematic walletId index if it exists
    try {
      console.log('\n🗑️  Attempting to drop walletId_1 index...');
      await walletsCollection.dropIndex('walletId_1');
      console.log('✅ Successfully dropped walletId_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  walletId_1 index does not exist (already clean)');
      } else {
        console.log('⚠️  Could not drop index:', error.message);
      }
    }
    
    // Step 3: Add environment field to existing wallets (default to mainnet)
    console.log('\n📝 Updating existing wallets...');
    const updateResult = await walletsCollection.updateMany(
      { environment: { $exists: false } },
      { $set: { environment: 'mainnet' } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} wallets with default environment`);
    
    // Step 4: Verify new indexes
    console.log('\n🔍 Creating proper indexes...');
    
    // Drop ALL old compound indexes
    const oldIndexNames = ['userId_1_network_1', 'userId_1_network_1_environment_1'];
    for (const indexName of oldIndexNames) {
      try {
        await walletsCollection.dropIndex(indexName);
        console.log(`✅ Dropped old index: ${indexName}`);
      } catch (error) {
        // Index doesn't exist, that's fine
      }
    }
    
    // Create new compound index with environment
    try {
      await walletsCollection.createIndex(
        { userId: 1, network: 1, environment: 1 },
        { name: 'userId_network_environment_index' }
      );
      console.log('✅ Created new compound index (userId + network + environment)');
    } catch (error) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('ℹ️  Compound index already exists with correct structure');
      } else {
        throw error;
      }
    }
    
    // Verify address index exists
    try {
      await walletsCollection.createIndex(
        { address: 1 },
        { name: 'address_index' }
      );
      console.log('✅ Verified address index');
    } catch (error) {
      if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
        console.log('ℹ️  Address index already exists');
      } else {
        throw error;
      }
    }
    
    // Step 5: Show final state
    console.log('\n📊 Final Indexes:');
    const finalIndexes = await walletsCollection.indexes();
    finalIndexes.forEach(index => {
      console.log(`   - ${JSON.stringify(index.key)} (${index.name})`);
    });
    
    // Step 6: Show wallet count
    const count = await walletsCollection.countDocuments();
    console.log(`\n💾 Total wallets in database: ${count}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Database migration completed successfully!');
    console.log('🎉 You can now create multiple wallets per user!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed\n');
  }
}

// Run the migration
fixWalletIndex();