require('dotenv').config();
const mongoose = require('mongoose');

async function forceFixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');
    
    const db = mongoose.connection.db;
    const collection = db.collection('wallets');
    
    // Drop ALL indexes except _id
    const indexes = await collection.indexes();
    for (const index of indexes) {
      if (index.name !== '_id_') {
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Dropped: ${index.name}`);
        } catch (e) {
          console.log(`⚠️  Skip: ${index.name}`);
        }
      }
    }
    
    // Add environment field to existing wallets
    await collection.updateMany(
      { environment: { $exists: false } },
      { $set: { environment: 'mainnet' } }
    );
    
    // Create clean indexes
    await collection.createIndex({ userId: 1, network: 1, environment: 1 });
    await collection.createIndex({ address: 1 });
    
    console.log('✅ Indexes recreated');
    console.log('🎉 Done!');
    
  } catch (error) {
    console.error('❌', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

forceFixIndexes();