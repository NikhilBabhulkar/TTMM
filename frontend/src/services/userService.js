// ============================================================================
// User Service
// ============================================================================
// Handles user-related API operations
// ============================================================================

import apiService from './apiService';

const userService = {
  /**
   * Get all users
   * @returns {Promise} - List of all users
   */
  getAllUsers: async () => {
    try {
      return await apiService.get('/users');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user by ID
   * @param {string} userId - User UUID
   * @returns {Promise} - User data
   */
  getUserById: async (userId) => {
    try {
      return await apiService.get(`/users/${userId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search users by name or email
   * @param {string} query - Search query
   * @returns {Promise} - List of matching users
   */
  searchUsers: async (query) => {
    try {
      return await apiService.get(`/users/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update current user profile
   * @param {Object} userData - { name }
   * @returns {Promise} - Updated user data
   */
  updateProfile: async (userData) => {
    try {
      return await apiService.put('/users/me', userData);
    } catch (error) {
      throw error;
    }
  }
};

export default userService;
