// src/routes/ProtectedRoute.jsx
// Versi ini sekarang mengecek 'user.role' yang stabil, bukan 'activeRole'.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Sesuaikan path

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Hanya butuh user, isAuthenticated, dan loading.
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Pengecekan loading saat refresh (tetap krusial)
  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600">Loading session...</p>
      </div>
    );
  }

  // Pengecekan status login (tidak berubah)
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ==========================================================
  // PERBAIKAN: Pengecekan izin sekarang langsung ke `user.role`.
  // Ini lebih aman dan tidak akan menyebabkan race condition.
  // ==========================================================
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;