// ============================================================================
// Private Route Component
// ============================================================================
// Protects routes that require authentication
// Redirects to login if user is not authenticated
// ============================================================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

/**
 * PrivateRoute component
 * Wraps routes that require authentication
 * 
 * Usage:
 * <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
 */
const PrivateRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, render the child component
  return children;
};

export default PrivateRoute;
