// src/Pages/Auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import authService from '../../services/authService';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { loading } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600">Loading session...</p>
      </div>
    );
  }

  if (!authService.isAuthenticated()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(authService.getUserRole())) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;