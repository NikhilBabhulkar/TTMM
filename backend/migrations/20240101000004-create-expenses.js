// ============================================================================
// Migration: Create Expenses Table
// ============================================================================
// This migration creates the expenses table for tracking shared expenses
// Each expense is paid by one user and belongs to a group
// ============================================================================

'use strict';

module.exports = {
  // Run this migration
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('expenses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each expense'
      },
      group_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Reference to the group this expense belongs to',
        references: {
          model: 'groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      paid_by: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'User ID of the person who paid for this expense',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // Prevent deleting users who have paid expenses
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Total amount of the expense (must be positive)',
        validate: {
          min: 0.01
        }
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Description of what the expense was for'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp when the expense was created'
      }
    });

    // Index for finding all expenses in a group
    await queryInterface.addIndex('expenses', ['group_id'], {
      name: 'idx_expenses_group_id'
    });

    // Index for finding all expenses paid by a user
    await queryInterface.addIndex('expenses', ['paid_by'], {
      name: 'idx_expenses_paid_by'
    });

    // Index for sorting expenses by date (most recent first)
    await queryInterface.addIndex('expenses', ['created_at'], {
      name: 'idx_expenses_created_at',
      order: [['created_at', 'DESC']]
    });

    // Composite index for group expenses sorted by date
    await queryInterface.addIndex('expenses', ['group_id', 'created_at'], {
      name: 'idx_expenses_group_date'
    });
  },

  // Rollback this migration
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('expenses');
  }
};
