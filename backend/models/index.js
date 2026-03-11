// ============================================================================
// Models Index - Sequelize Initialization
// ============================================================================
// This file initializes Sequelize, loads all models, and sets up associations
// It's the central point for database access in the application
// ============================================================================

const { Sequelize } = require('sequelize');
const config = require('../config/database');

// Determine environment (default to development)
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions || {}
  }
);

// Object to hold all models
const db = {
  sequelize,
  Sequelize
};

// Import all models
db.User = require('./User')(sequelize);
db.Group = require('./Group')(sequelize);
db.GroupMember = require('./GroupMember')(sequelize);
db.Expense = require('./Expense')(sequelize);
db.ExpenseSplit = require('./ExpenseSplit')(sequelize);
db.Balance = require('./Balance')(sequelize);
db.ActivityLog = require('./ActivityLog')(sequelize);

// Set up associations between models
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

/**
 * Test database connection
 * @returns {Promise<boolean>} - True if connection successful
 */
db.testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('✗ Unable to connect to database:', error.message);
    return false;
  }
};

/**
 * Sync all models with database
 * WARNING: Use with caution in production!
 * @param {Object} options - Sequelize sync options
 * @returns {Promise<void>}
 */
db.syncModels = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✓ All models synchronized with database');
  } catch (error) {
    console.error('✗ Error synchronizing models:', error.message);
    throw error;
  }
};

/**
 * Close database connection
 * @returns {Promise<void>}
 */
db.closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error closing database connection:', error.message);
    throw error;
  }
};

/**
 * Execute raw SQL query
 * @param {string} sql - SQL query to execute
 * @param {Object} options - Query options
 * @returns {Promise<any>} - Query results
 */
db.query = async (sql, options = {}) => {
  return sequelize.query(sql, options);
};

/**
 * Start a database transaction
 * @returns {Promise<Transaction>} - Sequelize transaction object
 */
db.transaction = async () => {
  return sequelize.transaction();
};

// Export the db object with all models and utilities
module.exports = db;
