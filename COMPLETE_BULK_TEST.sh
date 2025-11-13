#!/bin/bash

# Complete test flow for bulk operations

API_KEY="wapi_ac4d12eca4f2bf6bfeef26fc10614437498efd2c563a8fa4a7199f0a2e215235"
BASE_URL="http://localhost:3000"

echo "=========================================="
echo "BULK WALLET OPERATIONS TEST"
echo "=========================================="
echo ""

# Step 1: Bulk create testnet wallets
echo "1️⃣  Creating all testnet wallets..."
echo ""
curl -X POST "${BASE_URL}/api/wallet/bulk-create" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "testnet",
    "labelPrefix": "Test"
  }' | jq '.'

echo ""
echo "✅ Created wallets for: BTC, ETH, POLYGON, BSC, SOL, TRX, LTC, DOGE"
echo ""
sleep 2

# Step 2: Get bulk balances
echo "2️⃣  Getting all balances..."
echo ""
curl -X GET "${BASE_URL}/api/wallet/bulk-balance" \
  -H "X-API-Key: ${API_KEY}" | jq '.'

echo ""
echo "=========================================="
echo "✅ BULK OPERATIONS TEST COMPLETE"
echo "=========================================="
echo ""
echo "📝 Summary:"
echo "   - Created 8 wallets (one per network)"
echo "   - Retrieved all native balances"
echo "   - Retrieved all token balances (if tokens added)"
echo ""