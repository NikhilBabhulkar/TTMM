// ============================================================================
// Expense Model
// ============================================================================
// Represents an expense that needs to be split among group members
// Each expense is paid by one user and belongs to a group
// ============================================================================

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Expense = sequelize.define('Expense', {
    // Primary key - UUID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each expense'
    },

    // Reference to the group this expense belongs to
    group_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id'
      },
      comment: 'Reference to the group this expense belongs to'
    },

    // User who paid for this expense
    paid_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User ID of the person who paid for this expense'
    },

    // Total amount of the expense
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01, // Amount must be positive
        isDecimal: true
      },
      get() {
        // Convert to number when retrieving
        const value = this.getDataValue('amount');
        return value ? parseFloat(value) : null;
      },
      comment: 'Total amount of the expense (must be positive)'
    },

    // Description of what the expense was for
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      },
      comment: 'Description of what the expense was for (e.g., "Dinner at restaurant")'
    },

    // Timestamp when expense was created
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp when the expense was created'
    }
  }, {
    // Table configuration
    tableName: 'expenses',
    timestamps: false, // We manage created_at manually
    underscored: true,

    // Indexes for performance
    indexes: [
      {
        fields: ['group_id'],
        name: 'idx_expenses_group_id'
      },
      {
        fields: ['paid_by'],
        name: 'idx_expenses_paid_by'
      },
      {
        fields: ['created_at'],
        name: 'idx_expenses_created_at'
      },
      {
        fields: ['group_id', 'created_at'],
        name: 'idx_expenses_group_date'
      }
    ],

    // Default ordering - most recent first
    order: [['created_at', 'DESC']]
  });

  // Define associations (relationships with other models)
  Expense.associate = (models) => {
    // Expense belongs to a Group
    Expense.belongsTo(models.Group, {
      foreignKey: 'group_id',
      as: 'group',
      onDelete: 'CASCADE'
    });

    // Expense belongs to a User (who paid)
    Expense.belongsTo(models.User, {
      foreignKey: 'paid_by',
      as: 'payer',
      onDelete: 'RESTRICT' // Can't delete user with expenses
    });

    // Expense has many splits
    Expense.hasMany(models.ExpenseSplit, {
      foreignKey: 'expense_id',
      as: 'splits',
      onDelete: 'CASCADE'
    });
  };

  // Instance methods
  Expense.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Convert amount to number for JSON response
    if (values.amount) {
      values.amount = parseFloat(values.amount);
    }
    
    return values;
  };

  return Expense;
};
