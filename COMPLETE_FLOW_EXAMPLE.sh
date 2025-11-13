#!/bin/bash
# Complete flow: Register → Create Wallets → Add Tokens → Check Balances

BASE_URL="http://localhost:3000"

# ============================================
# 1. REGISTER & GET API KEY (Customer does this once)
# ============================================

echo "1️⃣  Registering customer..."
curl -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

echo -e "\n\n"
read -p "Login and get JWT token, then press Enter..."

# After login, get API key
JWT_TOKEN="YOUR_JWT_TOKEN_HERE"

echo "2️⃣  Generating API Key..."
API_KEY_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/api-keys" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API",
    "permissions": ["wallet:create", "wallet:read", "transaction:send", "transaction:read"]
  }')

API_KEY=$(echo $API_KEY_RESPONSE | jq -r '.apiKey.key')
echo "API Key: ${API_KEY}"

echo -e "\n\n"

# ============================================
# 2. BULK CREATE WALLETS (Customer does this once)
# ============================================

echo "3️⃣  Creating wallets for all networks..."
curl -X POST "${BASE_URL}/api/wallet/bulk-create" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "testnet",
    "labelPrefix": "App"
  }' | jq '.'

echo -e "\n\n"
sleep 2

# ============================================
# 3. ADD SUPPORTED TOKENS (Customer does this via dashboard)
# ============================================

echo "4️⃣  Adding supported tokens..."

# Add USDC on Ethereum
curl -X POST "${BASE_URL}/api/tokens/add" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "USD Coin",
    "symbol": "USDC",
    "network": "ETH",
    "contractAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "decimals": 6
  }' | jq '.'

# Add USDT on Ethereum
curl -X POST "${BASE_URL}/api/tokens/add" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tether USD",
    "symbol": "USDT",
    "network": "ETH",
    "contractAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "decimals": 6
  }' | jq '.'

# Add USDC on Polygon
curl -X POST "${BASE_URL}/api/tokens/add" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "USD Coin",
    "symbol": "USDC",
    "network": "POLYGON",
    "contractAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    "decimals": 6
  }' | jq '.'

# Add BUSD on BSC
curl -X POST "${BASE_URL}/api/tokens/add" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Binance USD",
    "symbol": "BUSD",
    "network": "BSC",
    "contractAddress": "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    "decimals": 18
  }' | jq '.'

echo -e "\n\n"
sleep 2

# ============================================
# 4. THEIR END USER CREATES A WALLET (via customer's API)
# ============================================

echo "5️⃣  End user creates a BTC wallet..."
curl -X POST "${BASE_URL}/api/wallet/create" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "network": "BTC",
    "environment": "testnet",
    "label": "User BTC Wallet"
  }' | jq '.'

echo -e "\n\n"

# ============================================
# 5. BULK BALANCE CHECK (Customer monitors all activity)
# ============================================

echo "6️⃣  Getting all balances (native + tokens)..."
curl -X GET "${BASE_URL}/api/wallet/bulk-balance" \
  -H "X-API-Key: ${API_KEY}" | jq '.'

echo -e "\n\n"

# ============================================
# RESULT: Customer gets all data in one call
# ============================================

# Response includes:
# {
#   "summary": {
#     "totalWallets": 9,
#     "totalTokenBalances": 4
#   },
#   "wallets": [
#     { "network": "BTC", "balance": "0.00050000", ... },
#     { "network": "ETH", "balance": "0.5", ... },
#     { "network": "POLYGON", "balance": "10.0", ... },
#     ... all other networks
#   ],
#   "tokens": [
#     { "tokenSymbol": "USDC", "network": "ETH", "balance": "100.000000", ... },
#     { "tokenSymbol": "USDT", "network": "ETH", "balance": "50.000000", ... },
#     { "tokenSymbol": "USDC", "network": "POLYGON", "balance": "200.000000", ... },
#     { "tokenSymbol": "BUSD", "network": "BSC", "balance": "75.000000", ... }
#   ]
# }

echo "=========================================="
echo "✅ COMPLETE FLOW FINISHED"
echo "=========================================="
echo ""
echo "Customer can now:"
echo "  ✅ Create wallets for any user via API"
echo "  ✅ Check all balances in one call"
echo "  ✅ Support multiple tokens per network"
echo "  ✅ Get comprehensive balance reports"
echo ""