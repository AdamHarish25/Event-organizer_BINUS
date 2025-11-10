# 🔍 Authentication & Role Validation Debug Guide

## Masalah yang Ditemukan

Terdapat ketidaksinkronan validasi roles antara **curl** dan **dashboard browser** untuk akses Dashboard User. Curl berhasil masuk, tapi dashboard tidak bisa.

## Root Cause Analysis

### 1. **Struktur Response Login Tidak Konsisten**
- Backend mengembalikan: `{ message, user: {...}, accessToken }`
- Frontend mengharapkan: `{ message, userId, role, accessToken }`

### 2. **Masalah Penyimpanan localStorage**
- Data user tidak disimpan dengan struktur yang benar
- Token tidak bisa diambil oleh API interceptor

### 3. **API Interceptor Bermasalah**
- Tidak bisa mengambil token dari localStorage dengan benar
- Error handling tidak memadai

### 4. **CORS Configuration**
- Tidak ada konfigurasi khusus untuk browser vs curl
- Missing credentials dan allowed headers

## Solusi yang Diterapkan

### ✅ 1. Perbaikan AuthService (`frontend/src/services/authService.js`)

**Sebelum:**
```javascript
// Struktur tidak konsisten
localStorage.setItem('user', JSON.stringify(response.data));
```

**Sesudah:**
```javascript
// Struktur konsisten dengan debugging
const userData = {
    ...response.data.user,
    accessToken: response.data.accessToken
};
localStorage.setItem('user', JSON.stringify(userData));
console.log('User data saved to localStorage:', userData);
```

### ✅ 2. Perbaikan API Interceptor (`frontend/src/services/api.js`)

**Sebelum:**
```javascript
const token = JSON.parse(userString)?.accessToken;
```

**Sesudah:**
```javascript
try {
    const userData = JSON.parse(userString);
    const token = userData?.accessToken;
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('Token attached to request:', token.substring(0, 20) + '...');
    }
} catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    localStorage.removeItem('user'); // Hapus data yang corrupt
}
```

### ✅ 3. Enhanced ProtectedRoute (`frontend/src/Pages/Auth/ProtectedRoute.jsx`)

Ditambahkan debugging lengkap:
```javascript
console.log('ProtectedRoute Debug:', {
    isAuthenticated,
    userRole,
    allowedRoles,
    currentPath: location.pathname
});
```

### ✅ 4. CORS Configuration (`backend/app.js`)

```javascript
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id']
}));
```

### ✅ 5. Request Logging Middleware

Ditambahkan logging untuk membandingkan curl vs browser:
```javascript
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', {
        authorization: req.headers.authorization ? `Bearer ${req.headers.authorization.split(' ')[1]?.substring(0, 20)}...` : 'None',
        'user-agent': req.headers['user-agent']?.substring(0, 50) + '...',
        origin: req.headers.origin || 'None'
    });
    next();
});
```

## Tools untuk Debugging

### 1. **AuthDebug Component** (`frontend/src/components/AuthDebug.jsx`)
- Menampilkan real-time auth status
- Test API calls
- Clear localStorage
- Tampil di pojok kanan bawah dashboard

### 2. **Curl Test Script** (`test_auth.sh`)
```bash
chmod +x test_auth.sh && ./test_auth.sh
```

### 3. **Debug Script** (`debug_auth.js`)
```bash
node debug_auth.js
```

### 4. **Complete Debug Runner** (`run_debug.sh`)
```bash
chmod +x run_debug.sh && ./run_debug.sh
```

## Langkah Troubleshooting

### 1. **Jalankan Backend & Frontend**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

### 2. **Test dengan Curl**
```bash
./test_auth.sh
```

### 3. **Test di Browser**
1. Buka http://localhost:5173 (atau port frontend)
2. Login dengan credentials yang sama
3. Buka DevTools (F12)
4. Periksa Console untuk debug messages
5. Periksa Network tab untuk request details
6. Lihat AuthDebug component di pojok kanan bawah

### 4. **Bandingkan Hasil**
- Jika curl berhasil tapi browser gagal → masalah di frontend
- Jika keduanya gagal → masalah di backend
- Jika keduanya berhasil → masalah sudah teratasi

## Common Issues & Solutions

### ❌ **"User not authenticated"**
**Penyebab:** Data di localStorage corrupt atau format lama
**Solusi:** Klik "Clear Storage" di AuthDebug atau hapus localStorage manual

### ❌ **"Access denied. User role 'X' not in allowed roles"**
**Penyebab:** Role user tidak sesuai dengan allowedRoles di route
**Solusi:** Periksa role di database dan allowedRoles di App.jsx

### ❌ **"Token tidak valid"**
**Penyebab:** Token expired atau format salah
**Solusi:** Login ulang atau periksa JWT secret di backend

### ❌ **CORS Error**
**Penyebab:** Frontend dan backend di port berbeda
**Solusi:** Pastikan CORS origin sudah benar di backend/app.js

## Monitoring & Maintenance

### 1. **Remove Debug Components di Production**
```javascript
// Hapus atau comment out di production
// import AuthDebug from '../components/AuthDebug';
// <AuthDebug />
```

### 2. **Remove Console Logs di Production**
```javascript
// Ganti console.log dengan logger yang proper
// atau hapus di production build
```

### 3. **Security Considerations**
- Jangan expose sensitive data di debug logs
- Pastikan JWT secret aman
- Implement proper token refresh mechanism

## Testing Checklist

- [ ] Backend berjalan di port 5000
- [ ] Frontend berjalan di port 5173/3000
- [ ] Curl test berhasil login dan akses event
- [ ] Browser bisa login dan akses dashboard
- [ ] Role validation bekerja dengan benar
- [ ] Token refresh berfungsi
- [ ] Logout menghapus session dengan benar
- [ ] AuthDebug menampilkan data yang benar

---

**Catatan:** File ini dibuat untuk debugging masalah autentikasi. Hapus file debug dan component setelah masalah teratasi.