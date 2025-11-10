#!/bin/bash

# Script untuk menjalankan debugging lengkap
# Jalankan dengan: chmod +x run_debug.sh && ./run_debug.sh

echo "🔍 DEBUGGING AUTHENTICATION ISSUE"
echo "=================================="
echo ""

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. Menjalankan debug script...${NC}"
node debug_auth.js
echo ""

echo -e "${BLUE}2. Memeriksa struktur project...${NC}"
echo "Backend routes:"
ls -la backend/routes/
echo ""
echo "Frontend services:"
ls -la frontend/src/services/
echo ""

echo -e "${BLUE}3. Memeriksa konfigurasi...${NC}"
echo "Backend package.json scripts:"
grep -A 5 '"scripts"' backend/package.json
echo ""
echo "Frontend package.json scripts:"
grep -A 5 '"scripts"' frontend/package.json
echo ""

echo -e "${YELLOW}4. Langkah-langkah untuk debugging:${NC}"
echo ""
echo "   a. Jalankan backend:"
echo "      cd backend && npm run dev"
echo ""
echo "   b. Jalankan frontend:"
echo "      cd frontend && npm run dev"
echo ""
echo "   c. Test dengan curl:"
echo "      ./test_auth.sh"
echo ""
echo "   d. Buka browser dan login ke dashboard"
echo "      - Buka DevTools (F12)"
echo "      - Lihat Console untuk debug messages"
echo "      - Lihat Network tab untuk request details"
echo "      - Periksa AuthDebug component di pojok kanan bawah"
echo ""

echo -e "${YELLOW}5. Hal yang perlu diperiksa:${NC}"
echo ""
echo "   ✅ Struktur response login sudah diperbaiki"
echo "   ✅ API interceptor sudah diperbaiki"
echo "   ✅ ProtectedRoute sudah ditambahkan debugging"
echo "   ✅ CORS configuration sudah diperbaiki"
echo "   ✅ Request logging middleware sudah ditambahkan"
echo "   ✅ AuthDebug component sudah ditambahkan"
echo ""

echo -e "${GREEN}6. Kemungkinan penyebab masalah:${NC}"
echo ""
echo "   • Data di localStorage corrupt/format lama"
echo "   • Token expired atau invalid"
echo "   • Role tidak sesuai dengan yang diharapkan"
echo "   • CORS issues antara frontend dan backend"
echo "   • Middleware order yang salah"
echo "   • Cookie settings untuk refresh token"
echo ""

echo -e "${RED}7. Jika masalah masih ada:${NC}"
echo ""
echo "   1. Hapus localStorage di browser (AuthDebug > Clear Storage)"
echo "   2. Login ulang dan periksa console messages"
echo "   3. Bandingkan request headers antara curl dan browser"
echo "   4. Periksa backend logs untuk request yang masuk"
echo "   5. Pastikan role user sesuai dengan allowedRoles di route"
echo ""

echo "=================================="
echo "🚀 Selamat debugging!"