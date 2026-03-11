// ============================================================================
// Migration: Create Balances Table
// ============================================================================
// This migration creates the balances table
// Stores calculated balances for each user across all groups
// ============================================================================

'use strict';

module.exports = {
  // Run this migration
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('balances', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each balance record'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        comment: 'Reference to the user (one balance per user)',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount_owed: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Total amount this user owes to others',
        validate: {
          min: 0
        }
      },
      amount_due: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Total amount others owe to this user',
        validate: {
          min: 0
        }
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp of last balance calculation'
      }
    });

    // Index for faster balance lookups by user
    await queryInterface.addIndex('balances', ['user_id'], {
      name: 'idx_balances_user_id',
      unique: true
    });
  },

  // Rollback this migration
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('balances');
  }
};
