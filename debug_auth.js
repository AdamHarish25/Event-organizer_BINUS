// Debug script untuk menguji masalah autentikasi
// Jalankan dengan: node debug_auth.js

console.log('=== DEBUG AUTHENTICATION ISSUE ===\n');

// Simulasi data yang disimpan di localStorage
const mockUserData = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "John Doe",
    email: "john.doe@binus.ac.id", 
    role: "student",
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
};

console.log('1. Mock user data yang seharusnya disimpan:');
console.log(JSON.stringify(mockUserData, null, 2));

// Test parsing
console.log('\n2. Test parsing localStorage data:');
const userString = JSON.stringify(mockUserData);
console.log('Stored string:', userString);

try {
    const parsed = JSON.parse(userString);
    console.log('Parsed successfully:', parsed);
    console.log('Role:', parsed.role);
    console.log('Has token:', !!parsed.accessToken);
} catch (error) {
    console.error('Parse error:', error.message);
}

// Test role validation
console.log('\n3. Test role validation:');
const allowedRoles = ['student'];
const userRole = mockUserData.role;

console.log('User role:', userRole);
console.log('Allowed roles:', allowedRoles);
console.log('Role check result:', allowedRoles.includes(userRole));

// Test JWT token structure
console.log('\n4. JWT Token structure check:');
const sampleJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzM0NTI2ODAwLCJleHAiOjE3MzQ1Mjc3MDB9.sample_signature";

const parts = sampleJWT.split('.');
console.log('JWT parts count:', parts.length);

if (parts.length === 3) {
    try {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        
        console.log('JWT Header:', header);
        console.log('JWT Payload:', payload);
        console.log('Token role:', payload.role);
        console.log('Token user ID:', payload.id);
    } catch (error) {
        console.error('JWT decode error:', error.message);
    }
}

console.log('\n=== KEMUNGKINAN MASALAH ===');
console.log('1. Struktur response login tidak konsisten antara backend dan frontend');
console.log('2. localStorage menyimpan data dengan format yang salah');
console.log('3. API interceptor tidak bisa mengambil token dengan benar');
console.log('4. Role validation di frontend tidak sinkron dengan backend');
console.log('5. CORS atau cookie settings mungkin berbeda antara curl dan browser');

console.log('\n=== SOLUSI YANG SUDAH DITERAPKAN ===');
console.log('1. ✅ Perbaiki struktur penyimpanan data user di authService.js');
console.log('2. ✅ Perbaiki API interceptor untuk mengambil token dengan benar');
console.log('3. ✅ Tambahkan debugging di ProtectedRoute dan authService');
console.log('4. ✅ Konsistensi struktur response login');

console.log('\n=== LANGKAH SELANJUTNYA ===');
console.log('1. Hapus localStorage dan login ulang');
console.log('2. Periksa console browser untuk debug messages');
console.log('3. Bandingkan token yang dikirim curl vs browser');
console.log('4. Periksa Network tab di DevTools');