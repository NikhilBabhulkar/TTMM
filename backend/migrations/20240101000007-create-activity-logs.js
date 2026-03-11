// ============================================================================
// Migration: Create Activity Logs Table
// ============================================================================
// Creates the activity_logs table for tracking all user actions
// ============================================================================

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      group_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      action_type: {
        type: Sequelize.ENUM(
          'group_created',
          'group_deleted',
          'member_added',
          'member_removed',
          'expense_created',
          'expense_updated',
          'expense_deleted',
          'user_registered',
          'user_login'
        ),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes for better query performance
    await queryInterface.addIndex('activity_logs', ['user_id'], {
      name: 'idx_activity_logs_user_id'
    });

    await queryInterface.addIndex('activity_logs', ['group_id'], {
      name: 'idx_activity_logs_group_id'
    });

    await queryInterface.addIndex('activity_logs', ['action_type'], {
      name: 'idx_activity_logs_action_type'
    });

    await queryInterface.addIndex('activity_logs', ['created_at'], {
      name: 'idx_activity_logs_created_at'
    });

    await queryInterface.addIndex('activity_logs', ['entity_id', 'entity_type'], {
      name: 'idx_activity_logs_entity'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('activity_logs');
  }
};
