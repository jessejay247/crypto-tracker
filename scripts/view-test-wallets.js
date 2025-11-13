// scripts/view-test-wallets.js
const fs = require('fs');
const path = require('path');

const walletsFile = path.join(__dirname, 'test-wallets.json');

if (!fs.existsSync(walletsFile)) {
  console.log('❌ No wallets file found. Run phase 1 tests first.');
  console.log('   npm run test:btc-ltc-doge:phase1');
  process.exit(1);
}

const wallets = JSON.parse(fs.readFileSync(walletsFile, 'utf8'));

console.log('\n' + '='.repeat(70));
console.log('🔑 Test Wallets');
console.log('='.repeat(70));

for (const [network, wallet] of Object.entries(wallets)) {
  if (wallet.address) {
    console.log(`\n${network}:`);
    console.log(`  Address:     ${wallet.address}`);
    console.log(`  Private Key: ${wallet.privateKey}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('⚠️  Keep these keys safe! Do not share them.');
console.log('='.repeat(70) + '\n');