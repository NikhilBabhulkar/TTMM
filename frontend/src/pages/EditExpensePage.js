// ============================================================================
// Edit Expense Page Component
// ============================================================================
// Allows users to edit existing expenses
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import expenseService from '../services/expenseService';
import Navigation from '../components/Navigation';
import './Dashboard.css';

const EditExpensePage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Expense ID
  
  // State management
  const [expense, setExpense] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  /**
   * Fetch expense details on component mount
   */
  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await expenseService.getExpenseById(id);
        const exp = response.expense;
        
        setExpense(exp);
        setAmount(exp.amount.toString());
        setDescription(exp.description);
      } catch (err) {
        console.error('Failed to fetch expense:', err);
        setError(
          err.response?.data?.message || 
          'Failed to load expense details. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!description || description.trim().length === 0) {
      setError('Please enter a description');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Update expense
      await expenseService.updateExpense(id, {
        amount: parseFloat(amount),
        description: description.trim()
      });

      // Navigate back to group detail page
      navigate(`/groups/${expense.group_id}`);
    } catch (err) {
      console.error('Failed to update expense:', err);
      setError(
        err.response?.data?.message || 
        'Failed to update expense. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading expense details...</p>
      </div>
    );
  }

  // Error state (no expense found)
  if (!expense) {
    return (
      <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
        <div className="error-message">Expense not found</div>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '30px' }}>Edit Expense</h1>

      {/* Error message */}
      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="card">
        {/* Amount */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Amount (₹)
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '1em',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            required
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was this expense for?"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '1em',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
            required
          />
        </div>

        {/* Info Note */}
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '0.9em',
          color: '#1976d2'
        }}>
          Note: Editing will recalculate splits and update all balances automatically.
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ flex: 1 }}
          >
            {submitting ? 'Updating...' : 'Update Expense'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/groups/${expense.group_id}`)}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
    </>
  );
};

export default EditExpensePage;
