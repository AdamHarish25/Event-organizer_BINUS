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

  const isAuthenticated = authService.isAuthenticated();
  const userRole = authService.getUserRole();
  
  console.log('ProtectedRoute Debug:', {
    isAuthenticated,
    userRole,
    allowedRoles,
    currentPath: location.pathname
  });

  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.log(`Access denied. User role '${userRole}' not in allowed roles:`, allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('Access granted for user role:', userRole);
  return children;
};

export default ProtectedRoute;