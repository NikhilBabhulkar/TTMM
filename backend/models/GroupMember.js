// ============================================================================
// GroupMember Model
// ============================================================================
// Junction table linking users to groups (many-to-many relationship)
// Tracks which users belong to which groups
// ============================================================================

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroupMember = sequelize.define('GroupMember', {
    // Primary key - UUID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each group membership'
    },

    // Reference to the group
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id'
      },
      comment: 'Reference to the group'
    },

    // Reference to the user
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Reference to the user who is a member'
    },

    // Timestamp when user joined the group
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp when the user joined the group'
    }
  }, {
    // Table configuration
    tableName: 'group_members',
    timestamps: false, // We manage joined_at manually
    underscored: true,

    // Indexes for performance
    indexes: [
      {
        fields: ['group_id'],
        name: 'idx_group_members_group_id'
      },
      {
        fields: ['user_id'],
        name: 'idx_group_members_user_id'
      },
      {
        fields: ['group_id', 'user_id'],
        name: 'idx_group_members_composite'
      },
      {
        unique: true,
        fields: ['group_id', 'user_id'],
        name: 'unique_group_user'
      }
    ],

    // Validation at model level
    validate: {
      // Ensure a user can't be added to the same group twice
      async uniqueMembership() {
        const existing = await GroupMember.findOne({
          where: {
            group_id: this.group_id,
            user_id: this.user_id
          }
        });
        if (existing && existing.id !== this.id) {
          throw new Error('User is already a member of this group');
        }
      }
    }
  });

  // Define associations (relationships with other models)
  GroupMember.associate = (models) => {
    // GroupMember belongs to a Group
    GroupMember.belongsTo(models.Group, {
      foreignKey: 'group_id',
      as: 'group',
      onDelete: 'CASCADE'
    });

    // GroupMember belongs to a User
    GroupMember.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return GroupMember;
};
