#!/bin/bash

# ============================================
# BULK OPERATIONS - CURL COMMANDS
# ============================================

API_KEY="YOUR_API_KEY_HERE"
BASE_URL="http://localhost:3000"

# ============================================
# 1. BULK CREATE - Create all network wallets at once
# ============================================

echo "Creating testnet wallets for all networks..."
curl -X POST "${BASE_URL}/api/wallet/bulk-create" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "testnet",
    "labelPrefix": "My"
  }'

# Expected Response:
# {
#   "message": "Created 8 of 8 wallets",
#   "environment": "testnet",
#   "wallets": [
#     {
#       "network": "BTC",
#       "walletId": "673c...",
#       "address": "tb1q...",
#       "label": "My BTC"
#     },
#     {
#       "network": "ETH",
#       "walletId": "673c...",
#       "address": "0x...",
#       "label": "My ETH"
#     },
#     ... (6 more networks)
#   ]
# }

echo -e "\n\n"

# ============================================
# 2. BULK CREATE - Mainnet wallets
# ============================================

echo "Creating mainnet wallets for all networks..."
curl -X POST "${BASE_URL}/api/wallet/bulk-create" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "mainnet",
    "labelPrefix": "Production"
  }'

echo -e "\n\n"

# ============================================
# 3. BULK BALANCE - Get all balances at once
# ============================================

echo "Getting all wallet and token balances..."
curl -X GET "${BASE_URL}/api/wallet/bulk-balance" \
  -H "X-API-Key: ${API_KEY}"

# Expected Response:
# {
#   "summary": {
#     "totalWallets": 8,
#     "totalTokenBalances": 12
#   },
#   "wallets": [
#     {
#       "walletId": "673c...",
#       "network": "BTC",
#       "environment": "testnet",
#       "address": "tb1q...",
#       "label": "My BTC",
#       "balance": "0.00050000",
#       "currency": "BTC"
#     },
#     {
#       "walletId": "673c...",
#       "network": "ETH",
#       "environment": "testnet",
#       "address": "0x...",
#       "label": "My ETH",
#       "balance": "0.5",
#       "currency": "ETH"
#     },
#     ... (more wallets)
#   ],
#   "tokens": [
#     {
#       "walletId": "673c...",
#       "network": "ETH",
#       "environment": "testnet",
#       "address": "0x...",
#       "tokenName": "USD Coin",
#       "tokenSymbol": "USDC",
#       "tokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
#       "balance": "100.000000",
#       "decimals": 6
#     },
#     ... (more tokens)
#   ]
# }

echo -e "\n\n"

# ============================================
# 4. EXAMPLE: Create testnet wallets without prefix
# ============================================

curl -X POST "${BASE_URL}/api/wallet/bulk-create" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "testnet"
  }'

# Labels will be: "BTC Wallet", "ETH Wallet", etc.