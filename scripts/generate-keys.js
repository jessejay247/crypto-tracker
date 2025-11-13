// scripts/generate-keys.js - Generate encryption keys
const crypto = require('crypto');

console.log('🔐 Generating Secure Keys\n');

const jwtSecret = crypto.randomBytes(64).toString('hex');
const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log('Add these to your .env file:\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log('\n⚠️  Keep these keys secret and secure!');

