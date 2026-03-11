// ============================================================================
// Expense Service
// ============================================================================
// Handles expense-related API operations
// ============================================================================

import apiService from './apiService';

const expenseService = {
  /**
   * Create a new expense
   * @param {Object} expenseData - { group_id, paid_by, amount, description, split_type?, splits? }
   * @returns {Promise} - Created expense data
   */
  createExpense: async (expenseData) => {
    try {
      return await apiService.post('/expenses', expenseData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get expenses for a group
   * @param {string} groupId - Group UUID
   * @returns {Promise} - List of expenses
   */
  getExpensesByGroup: async (groupId) => {
    try {
      return await apiService.get(`/expenses/group/${groupId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get expense by ID
   * @param {string} expenseId - Expense UUID
   * @returns {Promise} - Expense data
   */
  getExpenseById: async (expenseId) => {
    try {
      return await apiService.get(`/expenses/${expenseId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete an expense
   * @param {string} expenseId - Expense UUID
   * @returns {Promise} - Success response
   */
  deleteExpense: async (expenseId) => {
    try {
      return await apiService.delete(`/expenses/${expenseId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update an expense
   * @param {string} expenseId - Expense UUID
   * @param {Object} updateData - { amount?, description?, split_type?, splits? }
   * @returns {Promise} - Updated expense data
   */
  updateExpense: async (expenseId, updateData) => {
    try {
      return await apiService.put(`/expenses/${expenseId}`, updateData);
    } catch (error) {
      throw error;
    }
  }
};

export default expenseService;
