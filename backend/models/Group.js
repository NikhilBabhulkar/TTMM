// ============================================================================
// Group Model
// ============================================================================
// Represents an expense sharing group
// Groups contain multiple users who share expenses together
// ============================================================================

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Group = sequelize.define('Group', {
    // Primary key - UUID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each group'
    },

    // Group display name
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100] // Name must be between 1 and 100 characters
      },
      comment: 'Display name of the group (e.g., "Weekend Trip", "Roommates")'
    },

    // User who created the group
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User ID of the group creator'
    },

    // Timestamp when group was created
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp when the group was created'
    }
  }, {
    // Table configuration
    tableName: 'groups',
    timestamps: false, // We manage created_at manually
    underscored: true,

    // Indexes for performance
    indexes: [
      {
        fields: ['created_by'],
        name: 'idx_groups_created_by'
      },
      {
        fields: ['name'],
        name: 'idx_groups_name'
      }
    ]
  });

  // Define associations (relationships with other models)
  Group.associate = (models) => {
    // Group belongs to a creator (User)
    Group.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator',
      onDelete: 'CASCADE'
    });

    // Group has many members (through group_members)
    Group.belongsToMany(models.User, {
      through: models.GroupMember,
      foreignKey: 'group_id',
      otherKey: 'user_id',
      as: 'members'
    });

    // Group has many expenses
    Group.hasMany(models.Expense, {
      foreignKey: 'group_id',
      as: 'expenses',
      onDelete: 'CASCADE'
    });

    // Direct association with GroupMember for more control
    Group.hasMany(models.GroupMember, {
      foreignKey: 'group_id',
      as: 'memberships',
      onDelete: 'CASCADE'
    });
  };

  return Group;
};
