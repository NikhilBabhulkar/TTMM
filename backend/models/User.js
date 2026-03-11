// ============================================================================
// User Model
// ============================================================================
// Represents a user account in the expense sharing application
// Handles user authentication and profile information
// ============================================================================

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    // Primary key - UUID for better security and distribution
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each user'
    },

    // User's full name
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100] // Name must be between 2 and 100 characters
      },
      comment: 'Full name of the user'
    },

    // Email address - used for login
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true, // Validate email format
        notEmpty: true
      },
      comment: 'Email address - must be unique, used for login'
    },

    // Hashed password - never store plain text passwords
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Bcrypt hashed password - never store plain text passwords'
    },

    // Timestamp when account was created
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp when the user account was created'
    }
  }, {
    // Table configuration
    tableName: 'users',
    timestamps: false, // We manage created_at manually
    underscored: true, // Use snake_case for column names

    // Indexes for performance
    indexes: [
      {
        unique: true,
        fields: ['email'],
        name: 'idx_users_email'
      },
      {
        fields: ['name'],
        name: 'idx_users_name'
      }
    ],

    // Default scope - exclude password_hash from queries by default
    defaultScope: {
      attributes: {
        exclude: ['password_hash']
      }
    },

    // Named scopes for specific use cases
    scopes: {
      // Include password hash (for authentication)
      withPassword: {
        attributes: {
          include: ['password_hash']
        }
      },
      // Only public information
      public: {
        attributes: ['id', 'name', 'email']
      }
    }
  });

  // Define associations (relationships with other models)
  User.associate = (models) => {
    // User can create many groups
    User.hasMany(models.Group, {
      foreignKey: 'created_by',
      as: 'createdGroups',
      onDelete: 'CASCADE'
    });

    // User can be a member of many groups (through group_members)
    User.belongsToMany(models.Group, {
      through: models.GroupMember,
      foreignKey: 'user_id',
      otherKey: 'group_id',
      as: 'groups'
    });

    // User can pay for many expenses
    User.hasMany(models.Expense, {
      foreignKey: 'paid_by',
      as: 'paidExpenses',
      onDelete: 'RESTRICT' // Can't delete user with expenses
    });

    // User can have many expense splits
    User.hasMany(models.ExpenseSplit, {
      foreignKey: 'user_id',
      as: 'expenseSplits',
      onDelete: 'CASCADE'
    });

    // User has one balance record
    User.hasOne(models.Balance, {
      foreignKey: 'user_id',
      as: 'balance',
      onDelete: 'CASCADE'
    });
  };

  return User;
};
