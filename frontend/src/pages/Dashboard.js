// ============================================================================
// Dashboard Page Component
// ============================================================================
// Main landing page after login
// Shows user's groups, balance summary, and quick actions
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import groupService from '../services/groupService';
import balanceService from '../services/balanceService';
import Navigation from '../components/Navigation';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);

      // Load groups and balance in parallel
      const [groupsData, balanceData] = await Promise.all([
        groupService.getUserGroups(),
        balanceService.getCurrentUserBalance()
      ]);

      setGroups(groupsData.groups || []);
      setBalance(balanceData.balance);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="dashboard-container">
        {/* Remove old header since we have navigation now */}
        <div style={{ padding: '20px 0' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Dashboard</h1>
          <p style={{ textAlign: 'center', color: '#666' }}>Welcome, {user?.name}!</p>
        </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        {/* Balance Summary Card */}
        <div className="card balance-card">
          <h2>Your Balance</h2>
          {balance ? (
            <div className="balance-summary">
              <div className="balance-item">
                <span className="balance-label">You owe:</span>
                <span className="balance-value owed">₹{balance.amount_owed?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="balance-item">
                <span className="balance-label">You are owed:</span>
                <span className="balance-value due">₹{balance.amount_due?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="balance-item net">
                <span className="balance-label">Net Balance:</span>
                <span className={`balance-value ${balance.net_balance >= 0 ? 'positive' : 'negative'}`}>
                  ₹{balance.net_balance?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          ) : (
            <p>No balance data available</p>
          )}
          <button 
            onClick={() => navigate('/balances')} 
            className="btn btn-link"
          >
            View Details →
          </button>
        </div>

        {/* Quick Actions */}
        <div className="card actions-card">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button 
              onClick={() => navigate('/groups/new')} 
              className="btn btn-primary"
            >
              Create Group
            </button>
            <button 
              onClick={() => navigate('/expenses/new')} 
              className="btn btn-primary"
            >
              Add Expense
            </button>
          </div>
        </div>

        {/* Groups List */}
        <div className="card groups-card">
          <h2>Your Groups ({groups.length})</h2>
          {groups.length > 0 ? (
            <div className="groups-list">
              {groups.map(group => (
                <div 
                  key={group.id} 
                  className="group-item"
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  <div className="group-info">
                    <h3>{group.name}</h3>
                    <p>{group.member_count} members</p>
                  </div>
                  <span className="group-arrow">→</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>You haven't joined any groups yet.</p>
              <button 
                onClick={() => navigate('/groups/new')} 
                className="btn btn-primary"
              >
                Create Your First Group
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
