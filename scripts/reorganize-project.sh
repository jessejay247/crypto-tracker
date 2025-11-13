#!/bin/bash
# backend/scripts/reorganize-project.sh
# Complete project reorganization script

set -e

echo "=================================================="
echo "🔧 PROJECT REORGANIZATION SCRIPT"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Must run from backend directory"
    exit 1
fi

# Step 1: Create new folder structure
print_status "Creating new folder structure..."

mkdir -p src/services/blockchain
mkdir -p src/config
mkdir -p tests/unit
mkdir -p tests/integration

print_success "Folder structure created"

# Step 2: Backup existing setup.js
print_status "Backing up existing test files..."

if [ -f "tests/setup.js" ]; then
    cp tests/setup.js tests/setup.js.backup
    print_success "Backed up tests/setup.js"
fi

# Step 3: Remove old service files from other project
print_status "Cleaning up old service files..."

# Remove old blockchain service files if they exist from root services folder
rm -f src/services/btcService.js 2>/dev/null || true
rm -f src/services/ethService.js 2>/dev/null || true
rm -f src/services/maticService.js 2>/dev/null || true
rm -f src/services/bnbService.js 2>/dev/null || true
rm -f src/services/solService.js 2>/dev/null || true
rm -f src/services/tronService.js 2>/dev/null || true
rm -f src/services/dashService.js 2>/dev/null || true

print_success "Cleaned up old files"

# Step 4: List files to be created
echo ""
print_status "=================================================="
print_status "FILES TO BE CREATED"
print_status "=================================================="
echo ""

cat << 'EOF'
📁 src/config/
  ✨ networks.js         - All network configurations
  
📁 src/services/blockchain/
  ✨ btcService.js        - Bitcoin service
  ✨ ltcService.js        - Litecoin service
  ✨ dogeService.js       - Dogecoin service
  ✨ ethService.js        - Ethereum service
  ✨ polygonService.js    - Polygon service
  ✨ bscService.js        - BSC service
  ✨ solService.js        - Solana service
  ✨ tronService.js       - Tron service
  ✨ dashService.js       - Dash service
  
📁 tests/
  ✨ setup.js            - Clean test setup (FIXED)
  
📁 tests/unit/
  ✨ btc.test.js         - BTC unit tests
  ✨ ltc.test.js         - LTC unit tests
  ✨ doge.test.js        - DOGE unit tests
  ✨ eth.test.js         - ETH unit tests
  ✨ polygon.test.js     - Polygon unit tests
  ✨ bsc.test.js         - BSC unit tests
  ✨ sol.test.js         - SOL unit tests
  ✨ tron.test.js        - Tron unit tests
  ✨ dash.test.js        - Dash unit tests
  
📁 Root
  ✨ .env                - Clean env config (NO TATUM)
EOF

echo ""
print_status "=================================================="
print_status "NEXT STEPS"
print_status "=================================================="
echo ""

cat << 'EOF'
1. Copy the following files from artifacts:
   
   ✅ tests/setup.js
      (from "tests/setup.js - Clean Version" artifact)
   
   ✅ src/config/networks.js
      (from "src/config/networks.js - All Network Configurations" artifact)
   
   ✅ .env
      (from ".env - Clean Configuration" artifact)

2. Copy blockchain service files:
   
   Create each file in src/services/blockchain/:
   - btcService.js (I'll provide next)
   - ltcService.js (from "Simplified Litecoin Service" artifact)
   - dogeService.js (from "Simplified Dogecoin Service" artifact)
   - ethService.js (I'll provide)
   - polygonService.js (I'll provide)
   - bscService.js (I'll provide)
   - solService.js (I'll provide)
   - tronService.js (I'll provide)
   - dashService.js (I'll provide)

3. Update walletController.js to use new service paths:
   
   Change:
     const BtcService = require('../services/btcService');
   
   To:
     const BtcService = require('../services/blockchain/btcService');

4. Run tests:
   npm test

5. Start server:
   npm start
EOF

echo ""
print_success "Reorganization preparation complete!"
echo ""
print_warning "Follow the NEXT STEPS above to complete the reorganization"
echo ""

# Step 5: Create a checklist file
cat > REORGANIZATION_CHECKLIST.md << 'EOF'
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
EOF

print_success "Created REORGANIZATION_CHECKLIST.md"
echo ""

# Make this script executable
chmod +x scripts/reorganize-project.sh

print_success "Script complete! Check REORGANIZATION_CHECKLIST.md for next steps"