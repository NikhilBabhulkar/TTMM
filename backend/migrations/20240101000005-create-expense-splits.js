// ============================================================================
// Migration: Create Expense Splits Table
// ============================================================================
// This migration creates the expense_splits table
// Stores how each expense is divided among users
// ============================================================================

'use strict';

module.exports = {
  // Run this migration
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('expense_splits', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each split'
      },
      expense_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Reference to the expense being split',
        references: {
          model: 'expenses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'User who owes this portion of the expense',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Amount this user owes for this expense',
        validate: {
          min: 0
        }
      }
    });

    // Index for finding all splits for an expense
    await queryInterface.addIndex('expense_splits', ['expense_id'], {
      name: 'idx_expense_splits_expense_id'
    });

    // Index for finding all splits for a user
    await queryInterface.addIndex('expense_splits', ['user_id'], {
      name: 'idx_expense_splits_user_id'
    });

    // Composite index for checking if a user has a split in an expense
    await queryInterface.addIndex('expense_splits', ['expense_id', 'user_id'], {
      name: 'idx_expense_splits_composite'
    });
  },

  // Rollback this migration
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('expense_splits');
  }
};
