// ============================================================================
// Jest Setup File
// ============================================================================
// Runs before all tests to set up the test environment
// ============================================================================

// Load environment variables for testing
require('dotenv').config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(10000);

// Global test utilities can be added here
global.testUtils = {
  // Add any global test utilities here
};
