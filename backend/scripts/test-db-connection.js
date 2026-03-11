// ============================================================================
// Test Database Connection Script
// ============================================================================
// Simple script to verify database connection is working
// Run with: node scripts/test-db-connection.js
// ============================================================================

require('dotenv').config();
const db = require('../models');

async function testConnection() {
  console.log('Testing database connection...\n');
  
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Database:', process.env.DB_NAME);
  console.log('Host:', process.env.DB_HOST);
  console.log('Port:', process.env.DB_PORT);
  console.log('User:', process.env.DB_USER);
  console.log('\n---\n');

  try {
    // Test connection
    const connected = await db.testConnection();
    
    if (connected) {
      console.log('\n✓ Database connection successful!');
      
      // List all models
      console.log('\nLoaded models:');
      Object.keys(db).forEach(key => {
        if (db[key].name && typeof db[key] === 'function') {
          console.log(`  - ${db[key].name}`);
        }
      });
      
      // Close connection
      await db.closeConnection();
      process.exit(0);
    } else {
      console.error('\n✗ Database connection failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testConnection();
