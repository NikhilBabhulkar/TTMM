// ============================================================================
// Create Group Page Component
// ============================================================================
// Allows users to create new expense groups and add members
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import groupService from '../services/groupService';
import userService from '../services/userService';
import Navigation from '../components/Navigation';
import './AuthPages.css'; // Reuse auth page styles

const CreateGroupPage = () => {
  const navigate = useNavigate();
  
  // Form state
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);

  /**
   * Fetch all users on component mount
   * Users can be selected as group members
   */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await userService.getAllUsers();
        setAllUsers(response.users || []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users. Please refresh the page.');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  /**
   * Filter users based on search query
   * Searches by name and email
   */
  const filteredUsers = allUsers.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  /**
   * Toggle user selection for group membership
   */
  const toggleMemberSelection = (userId) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  /**
   * Handle form submission
   * Creates group with selected members
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setLoading(true);
      
      // Create group with name and members
      const response = await groupService.createGroup({
        name: groupName.trim(),
        members: selectedMembers // Optional: backend will add creator automatically
      });

      // Navigate to the newly created group's detail page
      navigate(`/groups/${response.group.id}`);
    } catch (err) {
      console.error('Group creation failed:', err);
      setError(
        err.response?.data?.message || 
        'Failed to create group. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Create New Group</h1>
          
          {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Group Name Input */}
          <div className="form-group">
            <label htmlFor="groupName">Group Name</label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Weekend Trip, Roommates, Office Lunch"
              required
              disabled={loading}
            />
          </div>

          {/* Member Selection */}
          <div className="form-group">
            <label>Add Members (Optional)</label>
            <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
              You will be added automatically as the group creator
            </p>
            
            {/* Search Box */}
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading || loadingUsers}
              style={{ marginBottom: '10px' }}
            />

            {/* User List */}
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '10px'
            }}>
              {loadingUsers ? (
                <p style={{ textAlign: 'center', color: '#666' }}>Loading users...</p>
              ) : filteredUsers.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>No users found</p>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    style={{
                      padding: '8px',
                      marginBottom: '5px',
                      backgroundColor: selectedMembers.includes(user.id) ? '#e3f2fd' : '#f9f9f9',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onClick={() => toggleMemberSelection(user.id)}
                  >
                    <div>
                      <div style={{ fontWeight: '500' }}>{user.name}</div>
                      <div style={{ fontSize: '0.85em', color: '#666' }}>{user.email}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(user.id)}
                      onChange={() => {}} // Handled by div onClick
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                ))
              )}
            </div>
            
            {selectedMembers.length > 0 && (
              <p style={{ fontSize: '0.9em', color: '#1976d2', marginTop: '10px' }}>
                {selectedMembers.length} member(s) selected
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !groupName.trim()}
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
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

export default CreateGroupPage;
