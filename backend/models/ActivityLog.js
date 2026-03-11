// ============================================================================
// Activity Log Model
// ============================================================================
// Tracks all user actions for transparency and audit purposes
// Records who did what, when, and in which group
// ============================================================================

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    // Primary key - UUID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each activity log entry'
    },

    // User who performed the action
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who performed the action'
    },

    // Group where action occurred (optional - some actions are not group-specific)
    group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'groups',
        key: 'id'
      },
      comment: 'Group where the action occurred (if applicable)'
    },

    // Type of action performed
    action_type: {
      type: DataTypes.ENUM(
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
      allowNull: false,
      comment: 'Type of action performed'
    },

    // Entity ID (expense_id, group_id, etc.)
    entity_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID of the entity affected by the action'
    },

    // Entity type (expense, group, user, etc.)
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Type of entity affected'
    },

    // Description of the action
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Human-readable description of the action'
    },

    // Additional metadata (JSON)
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional data about the action (old values, new values, etc.)'
    },

    // IP address (for security)
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address from which action was performed'
    },

    // Timestamp
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'When the action occurred'
    }
  }, {
    tableName: 'activity_logs',
    timestamps: false,
    underscored: true,

    indexes: [
      {
        fields: ['user_id'],
        name: 'idx_activity_logs_user_id'
      },
      {
        fields: ['group_id'],
        name: 'idx_activity_logs_group_id'
      },
      {
        fields: ['action_type'],
        name: 'idx_activity_logs_action_type'
      },
      {
        fields: ['created_at'],
        name: 'idx_activity_logs_created_at'
      },
      {
        fields: ['entity_id', 'entity_type'],
        name: 'idx_activity_logs_entity'
      }
    ]
  });

  // Define associations
  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });

    ActivityLog.belongsTo(models.Group, {
      foreignKey: 'group_id',
      as: 'group',
      onDelete: 'CASCADE'
    });
  };

  // Class method to log an activity
  ActivityLog.logActivity = async ({
    userId,
    groupId = null,
    actionType,
    entityId = null,
    entityType = null,
    description,
    metadata = null,
    ipAddress = null
  }) => {
    try {
      return await ActivityLog.create({
        user_id: userId,
        group_id: groupId,
        action_type: actionType,
        entity_id: entityId,
        entity_type: entityType,
        description,
        metadata,
        ip_address: ipAddress,
        created_at: new Date()
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error - logging failure shouldn't break the main operation
      return null;
    }
  };

  return ActivityLog;
};
