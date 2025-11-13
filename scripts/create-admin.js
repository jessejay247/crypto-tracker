// scripts/create-admin.js - Quick admin creation
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const email = await question('Admin Email: ');
    const password = await question('Admin Password (min 8 chars): ');
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');

    if (password.length < 8) {
      console.log('❌ Password must be at least 8 characters');
      process.exit(1);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User with this email already exists');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    });

    console.log('\n✓ Admin user created successfully!');
    console.log(`  Email: ${email}`);
    console.log(`  Role: admin`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    process.exit(1);
  }
}

createAdmin();
