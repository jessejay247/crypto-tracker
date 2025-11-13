// backend/scripts/fix-index.js
require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Drop the problematic index
    try {
      await usersCollection.dropIndex('apiKeys.key_1');
      console.log('✅ Dropped apiKeys.key_1 index');
    } catch (error) {
      console.log('ℹ️  Index already dropped or does not exist');
    }
    
    console.log('✅ Fixed! Now run: npm run seed -- --fresh');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixIndex();