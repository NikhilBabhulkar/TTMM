// ============================================================================
// Add Expense Page Component
// ============================================================================
// Allows users to create expenses with equal or custom splits
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import expenseService from '../services/expenseService';
import groupService from '../services/groupService';
import authService from '../services/authService';
import Navigation from '../components/Navigation';
import './AuthPages.css'; // Reuse auth page styles

const AddExpensePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId'); // Get group ID from URL query

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('equal'); // 'equal' or 'custom'
  const [customSplits, setCustomSplits] = useState([]); // Array of { user_id, amount }

  // Data state
  const [group, setGroup] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [error, setError] = useState('');

  /**
   * Fetch group details and current user on component mount
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingGroup(true);

        // Get current user from localStorage
        const user = authService.getCurrentUser();
        setCurrentUser(user);
        setPaidBy(user?.id); // Default payer is current user

        // Get group details if groupId is provided
        if (groupId) {
          const groupResponse = await groupService.getGroupById(groupId);
          setGroup(groupResponse.group);

          // Initialize custom splits with all members
          if (groupResponse.group.members) {
            setCustomSplits(
              groupResponse.group.members.map(member => ({
                user_id: member.id,
                amount: '0'
              }))
            );
          }
        } else {
          setError('No group selected. Please select a group first.');
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load group details. Please try again.');
      } finally {
        setLoadingGroup(false);
      }
    };

    fetchData();
  }, [groupId]);

  /**
   * Update custom split amount for a specific user
   */
  const updateCustomSplit = (userId, value) => {
    setCustomSplits(prev =>
      prev.map(split =>
        split.user_id === userId
          ? { ...split, amount: value }
          : split
      )
    );
  };

  /**
   * Calculate total of custom splits
   */
  const calculateCustomSplitsTotal = () => {
    return customSplits.reduce((sum, split) => {
      return sum + (parseFloat(split.amount) || 0);
    }, 0);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    const expenseAmount = parseFloat(amount);
    if (!expenseAmount || expenseAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    if (!paidBy) {
      setError('Please select who paid');
      return;
    }

    // Validate custom splits if selected
    if (splitType === 'custom') {
      const splitsTotal = calculateCustomSplitsTotal();
      if (Math.abs(splitsTotal - expenseAmount) > 0.01) {
        setError(`Custom splits (₹${splitsTotal.toFixed(2)}) must equal total amount (₹${expenseAmount.toFixed(2)})`);
        return;
      }

      // Filter out zero amounts
      const nonZeroSplits = customSplits.filter(split => parseFloat(split.amount) > 0);
      if (nonZeroSplits.length === 0) {
        setError('At least one person must have a non-zero split');
        return;
      }
    }

    try {
      setLoading(true);

      // Prepare expense data
      const expenseData = {
        group_id: groupId,
        paid_by: paidBy,
        amount: expenseAmount,
        description: description.trim(),
        split_type: splitType
      };

      // Add custom splits if applicable
      if (splitType === 'custom') {
        expenseData.splits = customSplits
          .filter(split => parseFloat(split.amount) > 0)
          .map(split => ({
            user_id: split.user_id,
            amount: parseFloat(split.amount)
          }));
      }

      // Create expense
      await expenseService.createExpense(expenseData);

      // Navigate back to group detail page
      navigate(`/groups/${groupId}`);
    } catch (err) {
      console.error('Expense creation failed:', err);
      setError(
        err.response?.data?.message || 
        'Failed to create expense. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loadingGroup) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Error state (no group)
  if (!group) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="error-message">{error || 'Group not found'}</div>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Add Expense</h1>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
            Group: {group.name}
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Amount Input */}
          <div className="form-group">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
              disabled={loading}
            />
          </div>

          {/* Description Input */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Dinner, Movie tickets, Groceries"
              required
              disabled={loading}
            />
          </div>

          {/* Paid By Selection */}
          <div className="form-group">
            <label htmlFor="paidBy">Paid By</label>
            <select
              id="paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Select who paid</option>
              {group.members && group.members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} {member.id === currentUser?.id ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Split Type Selection */}
          <div className="form-group">
            <label>Split Type</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="equal"
                  checked={splitType === 'equal'}
                  onChange={(e) => setSplitType(e.target.value)}
                  disabled={loading}
                  style={{ marginRight: '8px' }}
                />
                Equal Split
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="custom"
                  checked={splitType === 'custom'}
                  onChange={(e) => setSplitType(e.target.value)}
                  disabled={loading}
                  style={{ marginRight: '8px' }}
                />
                Custom Split
              </label>
            </div>
          </div>

          {/* Custom Splits Section */}
          {splitType === 'custom' && (
            <div className="form-group">
              <label>Custom Split Amounts</label>
              <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                Total must equal ₹{amount || '0.00'}
              </p>
              
              {group.members && group.members.map(member => {
                const split = customSplits.find(s => s.user_id === member.id);
                return (
                  <div key={member.id} style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.9em', marginBottom: '5px', display: 'block' }}>
                      {member.name}
                    </label>
                    <input
                      type="number"
                      value={split?.amount || '0'}
                      onChange={(e) => updateCustomSplit(member.id, e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      disabled={loading}
                      style={{ width: '100%' }}
                    />
                  </div>
                );
              })}
              
              <p style={{ 
                fontSize: '0.9em', 
                marginTop: '10px',
                color: Math.abs(calculateCustomSplitsTotal() - parseFloat(amount || 0)) < 0.01 ? '#4caf50' : '#f44336'
              }}>
                Current total: ₹{calculateCustomSplitsTotal().toFixed(2)}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Expense'}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/groups/${groupId}`)}
            className="btn btn-secondary"
            disabled={loading}
            style={{ marginTop: '10px' }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
    </>
  );
};

export default AddExpensePage;
