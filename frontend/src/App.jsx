// src/App.jsx
// Tidak ada perubahan di sini, tapi disertakan untuk kelengkapan.

import './index.css';
import { Route, Routes, Link } from 'react-router-dom';

// Import halaman login
import LoginUserPage from './Pages/Login'; // Sesuaikan path jika perlu
import LoginAdminPage from './Pages/Admin/Login';
import LoginSuperAdminPage from './Pages/SuperAdmin/Login';

// Import halaman dashboard
import DashboardUser from './Pages/Dashboard';
import AdminDashboard from './Pages/Admin/Dashboard';
import ProtectedRoute from './Pages/Auth/ProtectedRoute'; // Sesuaikan path

const UnauthorizedPage = () => (
    <div className='flex flex-col items-center justify-center h-screen bg-gray-100'>
        <h1 className='text-4xl font-bold text-red-500'>403 - Akses Ditolak</h1>
        <p className='text-gray-600 mt-2'>Anda tidak memiliki izin untuk melihat halaman ini.</p>
        {/* Link ini sekarang akan selalu relevan */}
        <Link to="/" className='mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'>Kembali ke Halaman Login</Link>
    </div>
);

function App() {
  return (
    <div className="w-screen min-h-screen overflow-x-hidden bg-gray-100">
      <Routes>
        <Route path="/" element={<LoginUserPage />} />
        <Route path="/login/admin" element={<LoginAdminPage />} />
        <Route path="/login/superadmin" element={<LoginSuperAdminPage />} />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'superadmin']}>
              <DashboardUser />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<div>404 - Halaman Tidak Ditemukan</div>} />
      </Routes>
    </div>
  );
}

export default App;