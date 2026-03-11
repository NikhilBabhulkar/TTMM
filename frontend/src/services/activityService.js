// ============================================================================
// Activity Service
// ============================================================================
// Handles activity log API operations
// ============================================================================

import apiService from './apiService';

const activityService = {
  /**
   * Get activity logs for current user
   * @param {Object} params - { limit?, offset?, group_id? }
   * @returns {Promise} - List of activities
   */
  getUserActivities: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);
      if (params.group_id) queryParams.append('group_id', params.group_id);
      
      const queryString = queryParams.toString();
      const url = queryString ? `/activity?${queryString}` : '/activity';
      
      return await apiService.get(url);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get activity logs for a specific group
   * @param {string} groupId - Group UUID
   * @param {Object} params - { limit?, offset? }
   * @returns {Promise} - List of group activities
   */
  getGroupActivities: async (groupId, params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);
      
      const queryString = queryParams.toString();
      const url = queryString 
        ? `/activity/group/${groupId}?${queryString}` 
        : `/activity/group/${groupId}`;
      
      return await apiService.get(url);
    } catch (error) {
      throw error;
    }
  }
};

export default activityService;
