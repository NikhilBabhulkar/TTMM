// ============================================================================
// Balance Summary Page Component
// ============================================================================
// Displays detailed balance information for the current user
// Shows what user owes, what they're owed, and detailed breakdown
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import balanceService from '../services/balanceService';
import authService from '../services/authService';
import Navigation from '../components/Navigation';
import './Dashboard.css'; // Reuse dashboard styles

const BalanceSummaryPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [balance, setBalance] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Fetch balance data on component mount
   */
  useEffect(() => {
    const fetchBalanceData = async () => {
      try {
        setLoading(true);
        setError('');

        // Get current user from localStorage
        const user = authService.getCurrentUser();
        setCurrentUser(user);

        // Fetch balance details
        const balanceResponse = await balanceService.getBalanceDetails(user.id);
        setBalance(balanceResponse.balance);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
        setError(
          err.response?.data?.message || 
          'Failed to load balance details. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceData();
  }, []);

  /**
   * Format currency amount
   */
  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  /**
   * Calculate net balance (what you're owed minus what you owe)
   */
  const calculateNetBalance = () => {
    if (!balance) return 0;
    return parseFloat(balance.amount_due || 0) - parseFloat(balance.amount_owed || 0);
  };

  /**
   * Get balance status text and color
   */
  const getBalanceStatus = () => {
    const net = calculateNetBalance();
    if (net > 0) {
      return { text: 'You are owed', color: '#4caf50' };
    } else if (net < 0) {
      return { text: 'You owe', color: '#f44336' };
    } else {
      return { text: 'Settled up', color: '#666' };
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading balance details...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const status = getBalanceStatus();
  const netBalance = calculateNetBalance();

  return (
    <>
      <Navigation />
      <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Page Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ marginBottom: '10px' }}>Balance Summary</h1>
        <p style={{ color: '#666' }}>
          {currentUser?.name}'s balance across all groups
        </p>
      </div>

      {/* Overall Balance Card */}
      <div className="card" style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '20px', color: status.color }}>
          {status.text}
        </h2>
        <div style={{ fontSize: '3em', fontWeight: '700', color: status.color }}>
          {formatAmount(Math.abs(netBalance))}
        </div>
        <p style={{ marginTop: '10px', color: '#666' }}>Net Balance</p>
      </div>

      {/* Breakdown Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Amount You Owe */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '15px', color: '#f44336' }}>You Owe</h3>
          <div style={{ fontSize: '2em', fontWeight: '600', color: '#f44336' }}>
            {formatAmount(balance?.amount_owed || 0)}
          </div>
          <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
            Total amount you need to pay
          </p>
        </div>

        {/* Amount You're Owed */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '15px', color: '#4caf50' }}>You're Owed</h3>
          <div style={{ fontSize: '2em', fontWeight: '600', color: '#4caf50' }}>
            {formatAmount(balance?.amount_due || 0)}
          </div>
          <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
            Total amount others owe you
          </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {balance?.details && balance.details.length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Detailed Breakdown</h2>
          
          {balance.details.map((detail, index) => {
            const amount = parseFloat(detail.amount);
            const isOwed = amount > 0;
            
            return (
              <div
                key={index}
                style={{
                  padding: '15px',
                  borderBottom: index < balance.details.length - 1 ? '1px solid #eee' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '5px' }}>
                    {detail.other_user_name}
                  </div>
                  <div style={{ fontSize: '0.85em', color: '#666' }}>
                    {detail.other_user_email}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.2em',
                    fontWeight: '600',
                    color: isOwed ? '#4caf50' : '#f44336'
                  }}>
                    {isOwed ? '+' : '-'}{formatAmount(Math.abs(amount))}
                  </div>
                  <div style={{ fontSize: '0.85em', color: '#666', marginTop: '3px' }}>
                    {isOwed ? 'owes you' : 'you owe'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No balances message */}
      {(!balance?.details || balance.details.length === 0) && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#666' }}>
            No outstanding balances. You're all settled up!
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary"
        >
          Back to Dashboard
        </button>
      </div>
      </div>
    </>
  );
};

export default BalanceSummaryPage;
