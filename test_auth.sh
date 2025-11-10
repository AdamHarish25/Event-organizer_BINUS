#!/bin/bash

# Script untuk menguji autentikasi dengan curl
# Jalankan dengan: chmod +x test_auth.sh && ./test_auth.sh

echo "=== TESTING AUTHENTICATION WITH CURL ==="
echo ""

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000"

echo -e "${YELLOW}1. Testing Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@binus.ac.id",
    "password": "password123"
  }' \
  -c cookies.txt)

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract access token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken' 2>/dev/null)

if [ "$ACCESS_TOKEN" != "null" ] && [ "$ACCESS_TOKEN" != "" ]; then
    echo -e "${GREEN}✅ Login successful, token obtained${NC}"
    echo "Token (first 50 chars): ${ACCESS_TOKEN:0:50}..."
    echo ""
    
    echo -e "${YELLOW}2. Testing Event Access with Token...${NC}"
    EVENT_RESPONSE=$(curl -s -X GET "$BASE_URL/event/" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json")
    
    echo "Event Response:"
    echo "$EVENT_RESPONSE" | jq '.' 2>/dev/null || echo "$EVENT_RESPONSE"
    echo ""
    
    # Check if response is successful
    STATUS=$(echo "$EVENT_RESPONSE" | jq -r '.status' 2>/dev/null)
    if [ "$STATUS" = "success" ]; then
        echo -e "${GREEN}✅ Event access successful with curl${NC}"
    else
        echo -e "${RED}❌ Event access failed with curl${NC}"
        echo "Error details:"
        echo "$EVENT_RESPONSE" | jq '.message // .error // .' 2>/dev/null || echo "$EVENT_RESPONSE"
    fi
    
else
    echo -e "${RED}❌ Login failed, no token received${NC}"
    echo "Response: $LOGIN_RESPONSE"
fi

echo ""
echo -e "${YELLOW}3. Testing without token (should fail)...${NC}"
NO_TOKEN_RESPONSE=$(curl -s -X GET "$BASE_URL/event/" \
  -H "Content-Type: application/json")

echo "No Token Response:"
echo "$NO_TOKEN_RESPONSE" | jq '.' 2>/dev/null || echo "$NO_TOKEN_RESPONSE"

echo ""
echo "=== CURL TEST COMPLETED ==="
echo ""
echo -e "${YELLOW}Bandingkan hasil ini dengan behavior di browser dashboard${NC}"
echo -e "${YELLOW}Jika curl berhasil tapi browser gagal, masalahnya di frontend${NC}"
echo -e "${YELLOW}Jika keduanya gagal, masalahnya di backend${NC}"

# Cleanup
rm -f cookies.txt