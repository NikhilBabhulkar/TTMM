// ============================================================================
// Migration: Create Users Table
// ============================================================================
// This migration creates the users table for storing user accounts
// Users can register, login, and participate in expense groups
// ============================================================================

'use strict';

module.exports = {
  // Run this migration
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each user'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Full name of the user'
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Email address - used for login, must be unique'
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Bcrypt hashed password - never store plain text'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp when the user account was created'
      }
    });

    // Create index on email for faster login queries
    await queryInterface.addIndex('users', ['email'], {
      name: 'idx_users_email',
      unique: true
    });

    // Create index on name for user search functionality
    await queryInterface.addIndex('users', ['name'], {
      name: 'idx_users_name'
    });
  },

  // Rollback this migration
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
