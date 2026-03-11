// ============================================================================
// Activity History Page Component
// ============================================================================
// Displays activity logs for a specific group or all user activities
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import activityService from '../services/activityService';
import Navigation from '../components/Navigation';
import './Dashboard.css';

const ActivityHistoryPage = () => {
  const navigate = useNavigate();
  const { groupId } = useParams(); // Optional - if viewing group-specific activities
  
  // State management
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit] = useState(50);
  const [offset] = useState(0);

  /**
   * Fetch activities on component mount
   */
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError('');

        let response;
        if (groupId) {
          // Fetch group-specific activities
          response = await activityService.getGroupActivities(groupId, { limit, offset });
        } else {
          // Fetch all user activities
          response = await activityService.getUserActivities({ limit, offset });
        }

        setActivities(response.activities || []);
      } catch (err) {
        console.error('Failed to fetch activities:', err);
        setError(
          err.response?.data?.message || 
          'Failed to load activity history. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [groupId, limit, offset]);

  /**
   * Format date to readable string
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get icon for action type
   */
  const getActionIcon = (actionType) => {
    const icons = {
      group_created: '🏠',
      group_deleted: '🗑️',
      member_added: '➕',
      member_removed: '➖',
      expense_created: '💰',
      expense_updated: '✏️',
      expense_deleted: '❌',
      user_registered: '👤',
      user_login: '🔐'
    };
    return icons[actionType] || '📝';
  };

  /**
   * Get color for action type
   */
  const getActionColor = (actionType) => {
    const colors = {
      group_created: '#4caf50',
      group_deleted: '#f44336',
      member_added: '#2196f3',
      member_removed: '#ff9800',
      expense_created: '#4caf50',
      expense_updated: '#2196f3',
      expense_deleted: '#f44336',
      user_registered: '#9c27b0',
      user_login: '#607d8b'
    };
    return colors[actionType] || '#666';
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading activity history...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="error-message">{error}</div>
        <button 
          onClick={() => navigate(groupId ? `/groups/${groupId}` : '/dashboard')} 
          className="btn btn-secondary"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Page Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ marginBottom: '10px' }}>
          {groupId ? 'Group Activity History' : 'My Activity History'}
        </h1>
        <p style={{ color: '#666' }}>
          Track all actions and changes for transparency
        </p>
      </div>

      {/* Back Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate(groupId ? `/groups/${groupId}` : '/dashboard')}
          className="btn btn-secondary"
        >
          {groupId ? 'Back to Group' : 'Back to Dashboard'}
        </button>
      </div>

      {/* Activities List */}
      <div className="card">
        <h2 style={{ marginBottom: '15px' }}>
          Activities ({activities.length})
        </h2>
        
        {activities.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            No activities yet.
          </p>
        ) : (
          <div>
            {activities.map((activity, index) => (
              <div
                key={activity.id || index}
                style={{
                  padding: '15px',
                  borderBottom: index < activities.length - 1 ? '1px solid #eee' : 'none',
                  display: 'flex',
                  gap: '15px',
                  alignItems: 'flex-start'
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    fontSize: '1.5em',
                    minWidth: '40px',
                    textAlign: 'center'
                  }}
                >
                  {getActionIcon(activity.action_type)}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: '500', 
                    marginBottom: '5px',
                    color: getActionColor(activity.action_type)
                  }}>
                    {activity.description}
                  </div>
                  
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    By {activity.user?.name || 'Unknown'} • {formatDate(activity.created_at)}
                  </div>

                  {activity.group && (
                    <div style={{ fontSize: '0.85em', color: '#888', marginTop: '3px' }}>
                      Group: {activity.group.name}
                    </div>
                  )}

                  {/* Metadata (if available) */}
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div style={{ 
                      fontSize: '0.8em', 
                      color: '#999', 
                      marginTop: '5px',
                      fontFamily: 'monospace',
                      backgroundColor: '#f5f5f5',
                      padding: '5px 8px',
                      borderRadius: '4px'
                    }}>
                      {JSON.stringify(activity.metadata, null, 2)}
                    </div>
                  )}
                </div>

                {/* Action Type Badge */}
                <div
                  style={{
                    padding: '4px 8px',
                    backgroundColor: getActionColor(activity.action_type) + '20',
                    color: getActionColor(activity.action_type),
                    borderRadius: '4px',
                    fontSize: '0.75em',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {activity.action_type.replace(/_/g, ' ')}
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

export default ActivityHistoryPage;
