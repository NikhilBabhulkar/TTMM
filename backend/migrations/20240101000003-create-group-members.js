// ============================================================================
// Migration: Create Group Members Table
// ============================================================================
// This migration creates the group_members junction table
// Links users to groups (many-to-many relationship)
// ============================================================================

'use strict';

module.exports = {
  // Run this migration
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('group_members', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Unique identifier for each group membership'
      },
      group_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Reference to the group',
        references: {
          model: 'groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Reference to the user who is a member',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp when the user joined the group'
      }
    });

    // Unique constraint to prevent duplicate memberships
    await queryInterface.addConstraint('group_members', {
      fields: ['group_id', 'user_id'],
      type: 'unique',
      name: 'unique_group_user'
    });

    // Index for finding all members of a group
    await queryInterface.addIndex('group_members', ['group_id'], {
      name: 'idx_group_members_group_id'
    });

    // Index for finding all groups a user belongs to
    await queryInterface.addIndex('group_members', ['user_id'], {
      name: 'idx_group_members_user_id'
    });

    // Composite index for checking membership efficiently
    await queryInterface.addIndex('group_members', ['group_id', 'user_id'], {
      name: 'idx_group_members_composite'
    });
  },

  // Rollback this migration
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('group_members');
  }
};
