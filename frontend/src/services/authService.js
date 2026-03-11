// ============================================================================
// Authentication Service
// ============================================================================
// Handles user authentication operations
// Login, register, logout, and token management
// ============================================================================

import apiService from './apiService';

const authService = {
  /**
   * Register a new user
   * @param {Object} userData - { name, email, password }
   * @returns {Promise} - Registration response
   */
  register: async (userData) => {
    try {
      const response = await apiService.post('/register', userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise} - Login response with token and user data
   */
  login: async (credentials) => {
    try {
      const response = await apiService.post('/login', credentials);
      
      // Store token and user data
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        apiService.setAuthToken(response.token);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logout user
   * Clears token and user data from localStorage
   */
  logout: () => {
    apiService.clearAuthToken();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get current user from localStorage
   * @returns {Object|null} - User object or null
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        return null;
      }
    }
    return null;
  },

  /**
   * Get JWT token from localStorage
   * @returns {string|null} - Token or null
   */
  getToken: () => {
    return localStorage.getItem('token');
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} - True if user has valid token
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  /**
   * Get current user profile from API
   * @returns {Promise} - User profile data
   */
  getProfile: async () => {
    try {
      const response = await apiService.get('/me');
      // Update stored user data
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default authService;
