// ============================================================================
// Balance Model
// ============================================================================
// Stores calculated balances for each user
// Tracks total amount owed and total amount due across all groups
// ============================================================================

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const Balance = sequelize.define('Balance', {
    // Primary key - UUID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for each balance record'
    },

    // Reference to the user (one balance per user)
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Reference to the user (must be unique - one balance per user)'
    },

    // Total amount this user owes to others
    amount_owed: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0, // Amount must be non-negative
        isDecimal: true
      },
      get() {
        // Convert to number when retrieving
        const value = this.getDataValue('amount_owed');
        return value ? parseFloat(value) : 0;
      },
      comment: 'Total amount this user owes to others'
    },

    // Total amount others owe to this user
    amount_due: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0, // Amount must be non-negative
        isDecimal: true
      },
      get() {
        // Convert to number when retrieving
        const value = this.getDataValue('amount_due');
        return value ? parseFloat(value) : 0;
      },
      comment: 'Total amount others owe to this user'
    },

    // Timestamp of last balance calculation
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp of last balance calculation'
    }
  }, {
    // Table configuration
    tableName: 'balances',
    timestamps: false, // We manage updated_at manually
    underscored: true,

    // Indexes for performance
    indexes: [
      {
        unique: true,
        fields: ['user_id'],
        name: 'idx_balances_user_id'
      }
    ],

    // Hooks to update timestamp
    hooks: {
      beforeUpdate: (balance) => {
        balance.updated_at = new Date();
      }
    }
  });

  // Define associations (relationships with other models)
  Balance.associate = (models) => {
    // Balance belongs to a User
    Balance.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  // Instance methods
  
  /**
   * Calculate net balance (positive = owed to user, negative = user owes)
   * @returns {number} - Net balance
   */
  Balance.prototype.getNetBalance = function() {
    return parseFloat((this.amount_due - this.amount_owed).toFixed(2));
  };

  /**
   * Check if user is in debt
   * @returns {boolean} - True if user owes more than they're owed
   */
  Balance.prototype.isInDebt = function() {
    return this.amount_owed > this.amount_due;
  };

  /**
   * Check if user is owed money
   * @returns {boolean} - True if others owe user more than user owes
   */
  Balance.prototype.isOwed = function() {
    return this.amount_due > this.amount_owed;
  };

  /**
   * Check if balance is settled (zero)
   * @returns {boolean} - True if net balance is zero
   */
  Balance.prototype.isSettled = function() {
    return Math.abs(this.getNetBalance()) < 0.01; // Account for rounding
  };

  // Override toJSON to include calculated fields
  Balance.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Convert amounts to numbers
    values.amount_owed = parseFloat(values.amount_owed || 0);
    values.amount_due = parseFloat(values.amount_due || 0);
    
    // Add calculated net balance
    values.net_balance = this.getNetBalance();
    
    return values;
  };

  // Class methods
  
  /**
   * Calculate balance for a specific user
   * This method queries all expenses and splits to calculate the balance
   * 
   * @param {string} userId - User ID to calculate balance for
   * @returns {Object} - Object with amount_owed and amount_due
   */
  Balance.calculateForUser = async (userId) => {
    const { Expense, ExpenseSplit } = sequelize.models;

    // Calculate amount_owed: sum of splits where user didn't pay
    const owedResult = await ExpenseSplit.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('ExpenseSplit.amount')), 'total']
      ],
      include: [{
        model: Expense,
        as: 'expense',
        attributes: [],
        where: {
          paid_by: {
            [Op.ne]: userId // Not equal to userId
          }
        }
      }],
      where: {
        user_id: userId
      },
      raw: true
    });

    const amount_owed = parseFloat(owedResult[0]?.total || 0);

    // Calculate amount_due: (sum of expenses paid) - (sum of own splits from those expenses)
    const paidExpenses = await Expense.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('Expense.amount')), 'total_paid']
      ],
      where: {
        paid_by: userId
      },
      raw: true
    });

    const total_paid = parseFloat(paidExpenses[0]?.total_paid || 0);

    const ownSplits = await ExpenseSplit.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('ExpenseSplit.amount')), 'total_own']
      ],
      include: [{
        model: Expense,
        as: 'expense',
        attributes: [],
        where: {
          paid_by: userId
        }
      }],
      where: {
        user_id: userId
      },
      raw: true
    });

    const total_own = parseFloat(ownSplits[0]?.total_own || 0);
    const amount_due = parseFloat((total_paid - total_own).toFixed(2));

    return {
      amount_owed: parseFloat(amount_owed.toFixed(2)),
      amount_due: Math.max(0, amount_due) // Ensure non-negative
    };
  };

  /**
   * Update or create balance for a user
   * @param {string} userId - User ID to update balance for
   * @returns {Balance} - Updated or created balance record
   */
  Balance.updateForUser = async (userId) => {
    const calculated = await Balance.calculateForUser(userId);
    
    const [balance, created] = await Balance.findOrCreate({
      where: { user_id: userId },
      defaults: {
        user_id: userId,
        amount_owed: calculated.amount_owed,
        amount_due: calculated.amount_due,
        updated_at: new Date()
      }
    });

    if (!created) {
      await balance.update({
        amount_owed: calculated.amount_owed,
        amount_due: calculated.amount_due,
        updated_at: new Date()
      });
    }

    return balance;
  };

  return Balance;
};
