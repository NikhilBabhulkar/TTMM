// ============================================================================
// API Service
// ============================================================================
// Centralized HTTP client with Axios
// Handles all API requests to the backend with automatic token injection
// ============================================================================

import axios from 'axios';

// Get API base URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create Axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// ============================================================================
// Request Interceptor
// ============================================================================
// Automatically adds JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Add token to Authorization header if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor
// ============================================================================
// Handles errors globally, especially 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => {
    // Return response data directly
    return response.data;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      // 401 Unauthorized - token expired or invalid
      if (status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Return error data from server
      return Promise.reject(data);
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject({
        error: 'Network Error',
        message: 'Unable to connect to server. Please check your connection.'
      });
    } else {
      // Something else happened
      return Promise.reject({
        error: 'Request Error',
        message: error.message
      });
    }
  }
);

// ============================================================================
// API Service Methods
// ============================================================================

const apiService = {
  // Generic HTTP methods
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
  
  // Set auth token manually (used after login)
  setAuthToken: (token) => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  },
  
  // Clear auth token (used on logout)
  clearAuthToken: () => {
    delete apiClient.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default apiService;
