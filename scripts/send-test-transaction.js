
// ============================================
// scripts/send-test-transaction.js
// Send small test transactions
// ============================================

async function sendTestTransactions() {
  console.log('📤 Sending Test Transactions\n');
  console.log('=' .repeat(60));
  
  // Load wallets
  const walletsFile = path.join(__dirname, 'test-wallets.json');
  
  if (!fs.existsSync(walletsFile)) {
    console.error('❌ No wallets file found. Run npm run test:generate first');
    process.exit(1);
  }
  
  const wallets = JSON.parse(fs.readFileSync(walletsFile, 'utf8'));
  
  // Test recipient addresses (replace with your own)
  const recipients = {
    BTC: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
    LTC: 'mjSk1Ny9spzU2fouzYgLqGUD8U41iR35QN',
    DOGE: 'nfS8UKS3xPvwGJpNfqBkVMp7Z7WT1VyPqm'
  };
  
  // Send BTC
  if (wallets.BTC && wallets.BTC.privateKey) {
    try {
      console.log('\n💸 Sending BTC...');
      const balance = await btcService.getBalance(wallets.BTC.address, 'testnet');
      
      if (parseFloat(balance) < 0.0001) {
        console.log('   ⏭️  Skipping - insufficient balance');
      } else {
        const txHash = await btcService.sendTransaction(
          wallets.BTC.privateKey,
          recipients.BTC,
          0.00001,
          'testnet'
        );
        console.log(`   ✅ Transaction sent!`);
        console.log(`   TX: ${txHash}`);
        console.log(`   Explorer: https://blockstream.info/testnet/tx/${txHash}`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Send LTC
  if (wallets.LTC && wallets.LTC.privateKey) {
    try {
      console.log('\n💸 Sending LTC...');
      const balance = await ltcService.getBalance(wallets.LTC.address, 'testnet');
      
      if (parseFloat(balance) < 0.001) {
        console.log('   ⏭️  Skipping - insufficient balance');
      } else {
        const txHash = await ltcService.sendTransaction(
          wallets.LTC.privateKey,
          recipients.LTC,
          0.0001,
          'testnet'
        );
        console.log(`   ✅ Transaction sent!`);
        console.log(`   TX: ${txHash}`);
        console.log(`   Explorer: https://blockexplorer.one/litecoin/testnet/tx/${txHash}`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Send DOGE
  if (wallets.DOGE && wallets.DOGE.privateKey) {
    try {
      console.log('\n💸 Sending DOGE...');
      const balance = await dogeService.getBalance(wallets.DOGE.address, 'testnet');
      
      if (parseFloat(balance) < 2) {
        console.log('   ⏭️  Skipping - insufficient balance (need 2 DOGE minimum)');
      } else {
        const txHash = await dogeService.sendTransaction(
          wallets.DOGE.privateKey,
          recipients.DOGE,
          0.1,
          'testnet'
        );
        console.log(`   ✅ Transaction sent!`);
        console.log(`   TX: ${txHash}`);
        console.log(`   Explorer: https://sochain.com/tx/DOGETEST/${txHash}`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Test transactions completed!');
  console.log('💡 Check the explorer links above to verify');
  console.log('='.repeat(60) + '\n');
}

if (require.main === module) {
  sendTestTransactions().catch(console.error);
}

module.exports = { quickWalletTest, checkBalances, sendTestTransactions };