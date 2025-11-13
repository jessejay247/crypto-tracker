# Reorganization Checklist

## Phase 1: Setup Files ✅
- [ ] Copy tests/setup.js (clean version)
- [ ] Copy src/config/networks.js
- [ ] Copy .env (without Tatum)

## Phase 2: Blockchain Services ✅
- [ ] Create src/services/blockchain/btcService.js
- [ ] Create src/services/blockchain/ltcService.js
- [ ] Create src/services/blockchain/dogeService.js
- [ ] Create src/services/blockchain/ethService.js
- [ ] Create src/services/blockchain/polygonService.js
- [ ] Create src/services/blockchain/bscService.js
- [ ] Create src/services/blockchain/solService.js
- [ ] Create src/services/blockchain/tronService.js
- [ ] Create src/services/blockchain/dashService.js

## Phase 3: Update Controllers ✅
- [ ] Update walletController.js imports
- [ ] Update transactionController.js imports (if exists)

## Phase 4: Testing ✅
- [ ] Run: npm test
- [ ] Fix any import errors
- [ ] Test wallet generation: npm run test-wallet

## Phase 5: Verify ✅
- [ ] All services in src/services/blockchain/
- [ ] walletGenerator.js still in src/services/
- [ ] All tests passing
- [ ] Server starts without errors

## Notes
- Old service files backed up with .backup extension
- Original setup.js saved as setup.js.backup
- All services now use FREE public APIs (no Tatum)
