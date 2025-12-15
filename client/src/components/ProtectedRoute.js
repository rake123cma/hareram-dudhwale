import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    const redirectTo = requiredRole === 'admin' ? '/login?admin=true' : '/login';
    return <Navigate to={redirectTo} replace />;
  }

  // If admin role is required, check if user is admin
  if (requiredRole === 'admin') {
    // Check for test token first
    if (token === 'test-token-admin') {
      return children;
    }

    // For JWT tokens, decode to check role
    try {
      // Simple JWT decode (without verification for client-side check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'admin') {
        return <Navigate to="/customer" replace />;
      }
    } catch (err) {
      // If token can't be decoded, redirect to login
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
