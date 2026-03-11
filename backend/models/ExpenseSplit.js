// ============================================================================
// ExpenseSplit Model
// ============================================================================
// Represents how an expense is divided among users
// Each row represents one person's share of an expense
// ============================================================================

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExpenseSplit = sequelize.define('ExpenseSplit', {
    // Primary key - UUID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each split'
    },

    // Reference to the expense being split
    expense_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'expenses',
        key: 'id'
      },
      comment: 'Reference to the expense being split'
    },

    // User who owes this portion
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who owes this portion of the expense'
    },

    // Amount this user owes
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0, // Amount must be non-negative
        isDecimal: true
      },
      get() {
        // Convert to number when retrieving
        const value = this.getDataValue('amount');
        return value ? parseFloat(value) : null;
      },
      comment: 'Amount this user owes for this expense'
    }
  }, {
    // Table configuration
    tableName: 'expense_splits',
    timestamps: false, // No timestamps needed for splits
    underscored: true,

    // Indexes for performance
    indexes: [
      {
        fields: ['expense_id'],
        name: 'idx_expense_splits_expense_id'
      },
      {
        fields: ['user_id'],
        name: 'idx_expense_splits_user_id'
      },
      {
        fields: ['expense_id', 'user_id'],
        name: 'idx_expense_splits_composite'
      }
    ]
  });

  // Define associations (relationships with other models)
  ExpenseSplit.associate = (models) => {
    // ExpenseSplit belongs to an Expense
    ExpenseSplit.belongsTo(models.Expense, {
      foreignKey: 'expense_id',
      as: 'expense',
      onDelete: 'CASCADE'
    });

    // ExpenseSplit belongs to a User
    ExpenseSplit.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  // Instance methods
  ExpenseSplit.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Convert amount to number for JSON response
    if (values.amount) {
      values.amount = parseFloat(values.amount);
    }
    
    return values;
  };

  // Class methods
  
  /**
   * Calculate equal splits for an expense
   * @param {number} totalAmount - Total expense amount
   * @param {number} numberOfPeople - Number of people to split among
   * @returns {number} - Amount per person (rounded to 2 decimals)
   */
  ExpenseSplit.calculateEqualSplit = (totalAmount, numberOfPeople) => {
    if (numberOfPeople <= 0) {
      throw new Error('Number of people must be positive');
    }
    return parseFloat((totalAmount / numberOfPeople).toFixed(2));
  };

  /**
   * Validate that splits sum to total amount
   * @param {Array} splits - Array of split amounts
   * @param {number} totalAmount - Total expense amount
   * @returns {boolean} - True if valid, throws error otherwise
   */
  ExpenseSplit.validateSplitsSum = (splits, totalAmount) => {
    const sum = splits.reduce((acc, split) => acc + parseFloat(split.amount), 0);
    const roundedSum = parseFloat(sum.toFixed(2));
    const roundedTotal = parseFloat(totalAmount.toFixed(2));
    
    // Allow small rounding differences (1 cent)
    const difference = Math.abs(roundedSum - roundedTotal);
    if (difference > 0.01) {
      throw new Error(
        `Splits sum (${roundedSum}) does not equal total amount (${roundedTotal})`
      );
    }
    
    return true;
  };

  return ExpenseSplit;
};
