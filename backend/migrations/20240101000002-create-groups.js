// ============================================================================
// Migration: Create Groups Table
// ============================================================================
// This migration creates the groups table for organizing expense sharing
// Each group has a creator and can have multiple members
// ============================================================================

'use strict';

module.exports = {
  // Run this migration
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('groups', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each group'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Display name of the group (e.g., "Weekend Trip", "Roommates")'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'User ID of the group creator',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp when the group was created'
      }
    });

    // Index for finding all groups created by a specific user
    await queryInterface.addIndex('groups', ['created_by'], {
      name: 'idx_groups_created_by'
    });

    // Index for searching groups by name
    await queryInterface.addIndex('groups', ['name'], {
      name: 'idx_groups_name'
    });
  },

  // Rollback this migration
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('groups');
  }
};
