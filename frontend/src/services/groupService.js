// ============================================================================
// Group Service
// ============================================================================
// Handles group-related API operations
// ============================================================================

import apiService from './apiService';

const groupService = {
  /**
   * Get all groups for current user
   * @returns {Promise} - List of user's groups
   */
  getUserGroups: async () => {
    try {
      return await apiService.get('/groups');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new group
   * @param {Object} groupData - { name, members? }
   * @returns {Promise} - Created group data
   */
  createGroup: async (groupData) => {
    try {
      return await apiService.post('/groups', groupData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get group by ID
   * @param {string} groupId - Group UUID
   * @returns {Promise} - Group data with members
   */
  getGroupById: async (groupId) => {
    try {
      return await apiService.get(`/groups/${groupId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add member to group
   * @param {string} groupId - Group UUID
   * @param {string} userId - User UUID to add
   * @returns {Promise} - Success response
   */
  addMember: async (groupId, userId) => {
    try {
      return await apiService.post(`/groups/${groupId}/members`, { user_id: userId });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove member from group
   * @param {string} groupId - Group UUID
   * @param {string} userId - User UUID to remove
   * @returns {Promise} - Success response
   */
  removeMember: async (groupId, userId) => {
    try {
      return await apiService.delete(`/groups/${groupId}/members/${userId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete group
   * @param {string} groupId - Group UUID
   * @returns {Promise} - Success response
   */
  deleteGroup: async (groupId) => {
    try {
      return await apiService.delete(`/groups/${groupId}`);
    } catch (error) {
      throw error;
    }
  }
};

export default groupService;
