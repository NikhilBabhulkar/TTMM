// ============================================================================
// Balance Service
// ============================================================================
// Handles balance-related API operations
// ============================================================================

import apiService from './apiService';

const balanceService = {
  /**
   * Get current user's balance
   * @returns {Promise} - Balance data
   */
  getCurrentUserBalance: async () => {
    try {
      return await apiService.get('/balances/me');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get balance for a specific user
   * @param {string} userId - User UUID
   * @returns {Promise} - Balance data
   */
  getBalanceByUserId: async (userId) => {
    try {
      return await apiService.get(`/balances/${userId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get detailed balance breakdown
   * @param {string} userId - User UUID
   * @returns {Promise} - Detailed balance data
   */
  getBalanceDetails: async (userId) => {
    try {
      return await apiService.get(`/balances/${userId}/details`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Recalculate balance for a user
   * @param {string} userId - User UUID
   * @returns {Promise} - Updated balance data
   */
  recalculateBalance: async (userId) => {
    try {
      return await apiService.post(`/balances/${userId}/recalculate`);
    } catch (error) {
      throw error;
    }
  }
};

export default balanceService;
