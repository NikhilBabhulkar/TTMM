// ============================================================================
// Main App Component
// ============================================================================
// Root component with React Router configuration
// Defines all application routes
// ============================================================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components (we'll create these next)
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import CreateGroupPage from './pages/CreateGroupPage';
import GroupDetailPage from './pages/GroupDetailPage';
import AddExpensePage from './pages/AddExpensePage';
import BalanceSummaryPage from './pages/BalanceSummaryPage';
import ActivityHistoryPage from './pages/ActivityHistoryPage';
import EditExpensePage from './pages/EditExpensePage';

// Import auth service
import authService from './services/authService';

function App() {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
          />
          <Route 
            path="/signup" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />} 
          />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/groups/new" 
            element={
              <PrivateRoute>
                <CreateGroupPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/groups/:id" 
            element={
              <PrivateRoute>
                <GroupDetailPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/expenses/new" 
            element={
              <PrivateRoute>
                <AddExpensePage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/expenses/:id/edit" 
            element={
              <PrivateRoute>
                <EditExpensePage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/balances" 
            element={
              <PrivateRoute>
                <BalanceSummaryPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/activity" 
            element={
              <PrivateRoute>
                <ActivityHistoryPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/activity/group/:groupId" 
            element={
              <PrivateRoute>
                <ActivityHistoryPage />
              </PrivateRoute>
            } 
          />

          {/* Default route */}
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
          />

          {/* 404 route */}
          <Route 
            path="*" 
            element={
              <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h1>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <a href="/">Go Home</a>
              </div>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
