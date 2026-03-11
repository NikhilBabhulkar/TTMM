// ============================================================================
// Group Detail Page Component
// ============================================================================
// Displays group information, members, and all expenses for the group
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import groupService from '../services/groupService';
import expenseService from '../services/expenseService';
import Navigation from '../components/Navigation';
import './Dashboard.css'; // Reuse dashboard styles

const GroupDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get group ID from URL
  
  // State management
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Fetch group details and expenses on component mount
   */
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch group details (includes members)
        const groupResponse = await groupService.getGroupById(id);
        setGroup(groupResponse.group);

        // Fetch group expenses
        const expensesResponse = await expenseService.getExpensesByGroup(id);
        setExpenses(expensesResponse.expenses || []);
      } catch (err) {
        console.error('Failed to fetch group data:', err);
        setError(
          err.response?.data?.message || 
          'Failed to load group details. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [id]);

  /**
   * Format date to readable string
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Format currency amount
   */
  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  /**
   * Handle delete expense
   */
  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await expenseService.deleteExpense(expenseId);
      // Remove from local state
      setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
    } catch (err) {
      console.error('Failed to delete expense:', err);
      alert(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  /**
   * Handle delete group
   */
  const handleDeleteGroup = async () => {
    if (!window.confirm(`Are you sure you want to delete the group "${group.name}"? This will delete all expenses and cannot be undone.`)) {
      return;
    }

    try {
      await groupService.deleteGroup(id);
      alert('Group deleted successfully');
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to delete group:', err);
      alert(err.response?.data?.message || 'Failed to delete group');
    }
  };

  /**
   * Check if current user is the group creator
   */
  const isCreator = group && group.created_by === localStorage.getItem('userId');

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading group details...</p>
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

  // No group found
  if (!group) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Group not found</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Group Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ marginBottom: '10px' }}>{group.name}</h1>
        <p style={{ color: '#666' }}>
          Created by {group.creator?.name || 'Unknown'} on {formatDate(group.created_at)}
        </p>
      </div>

      {/* Members Section */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '15px' }}>Members ({group.members?.length || 0})</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {group.members && group.members.length > 0 ? (
            group.members.map(member => (
              <div
                key={member.id}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '20px',
                  fontSize: '0.9em'
                }}
              >
                {member.name}
              </div>
            ))
          ) : (
            <p style={{ color: '#666' }}>No members yet</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate(`/expenses/new?groupId=${id}`)}
          className="btn btn-primary"
        >
          Add Expense
        </button>
        <button
          onClick={() => navigate(`/activity/group/${id}`)}
          className="btn btn-secondary"
        >
          View Activity History
        </button>
        {isCreator && (
          <button
            onClick={handleDeleteGroup}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1em'
            }}
          >
            Delete Group
          </button>
        )}
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Expenses Section */}
      <div className="card">
        <h2 style={{ marginBottom: '15px' }}>Expenses ({expenses.length})</h2>
        
        {expenses.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            No expenses yet. Click "Add Expense" to create one.
          </p>
        ) : (
          <div>
            {expenses.map(expense => (
              <div
                key={expense.id}
                style={{
                  padding: '15px',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', marginBottom: '5px' }}>
                    {expense.description}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    Paid by {expense.payer?.name || 'Unknown'} on {formatDate(expense.created_at)}
                  </div>
                  <div style={{ fontSize: '0.85em', color: '#888', marginTop: '3px' }}>
                    Split: {expense.split_type === 'equal' ? 'Equal' : 'Custom'} 
                    {expense.splits && ` (${expense.splits.length} people)`}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2em', fontWeight: '600', color: '#1976d2' }}>
                    {formatAmount(expense.amount)}
                  </div>
                  <div style={{ marginTop: '5px', display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => navigate(`/expenses/${expense.id}/edit`)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.8em',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.8em',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default GroupDetailPage;
