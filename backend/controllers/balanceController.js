// ============================================================================
// Balance Controller
// ============================================================================
// Handles balance calculation and retrieval
// Calculates who owes whom across all groups
// ============================================================================

const db = require('../models');

/**
 * Get balance for a user
 * GET /balances/:userId
 * 
 * Returns the user's balance showing:
 * - amount_owed: Total amount user owes to others
 * - amount_due: Total amount others owe to user
 * - net_balance: Difference (positive = owed to user, negative = user owes)
 * 
 * Response:
 * {
 *   "balance": {
 *     "user_id": "uuid",
 *     "amount_owed": 1500.00,
 *     "amount_due": 3000.00,
 *     "net_balance": 1500.00,
 *     "updated_at": "2024-01-15T21:00:00Z"
 *   }
 * }
 */
const getBalanceByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID: ${userId}`
      });
    }

    // Try to get existing balance
    let balance = await db.Balance.findOne({
      where: { user_id: userId }
    });

    // If balance doesn't exist, calculate it
    if (!balance) {
      balance = await db.Balance.updateForUser(userId);
    }

    // Return balance data with net balance
    res.status(200).json({
      balance: {
        user_id: balance.user_id,
        amount_owed: balance.amount_owed,
        amount_due: balance.amount_due,
        net_balance: balance.getNetBalance(),
        is_settled: balance.isSettled(),
        updated_at: balance.updated_at
      }
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      error: 'Failed to fetch balance',
      message: 'An error occurred while fetching balance data'
    });
  }
};

/**
 * Get detailed balance breakdown for a user
 * GET /balances/:userId/details
 * 
 * Returns detailed breakdown showing:
 * - Who owes the user money
 * - Whom the user owes money
 * - Breakdown by group
 * 
 * Response:
 * {
 *   "user_id": "uuid",
 *   "summary": {
 *     "amount_owed": 1500,
 *     "amount_due": 3000,
 *     "net_balance": 1500
 *   },
 *   "owed_to_user": [...],
 *   "user_owes": [...]
 * }
 */
const getBalanceDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID: ${userId}`
      });
    }

    // Get summary balance
    const balance = await db.Balance.findOne({
      where: { user_id: userId }
    }) || await db.Balance.updateForUser(userId);

    // Calculate who owes the user (expenses user paid)
    const expensesPaid = await db.Expense.findAll({
      where: { paid_by: userId },
      include: [{
        model: db.ExpenseSplit,
        as: 'splits',
        where: {
          user_id: { [db.Sequelize.Op.ne]: userId } // Exclude user's own splits
        },
        include: [{
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }]
      }],
      order: [['created_at', 'DESC']]
    });

    // Calculate whom the user owes (expenses others paid)
    const expensesOwed = await db.ExpenseSplit.findAll({
      where: { user_id: userId },
      include: [{
        model: db.Expense,
        as: 'expense',
        where: {
          paid_by: { [db.Sequelize.Op.ne]: userId } // Exclude expenses user paid
        },
        include: [{
          model: db.User,
          as: 'payer',
          attributes: ['id', 'name', 'email']
        }]
      }]
    });

    // Format owed to user
    const owedToUser = expensesPaid.flatMap(expense =>
      expense.splits.map(split => ({
        user: split.user,
        amount: split.amount,
        expense_description: expense.description,
        expense_date: expense.created_at
      }))
    );

    // Format user owes
    const userOwes = expensesOwed.map(split => ({
      user: split.expense.payer,
      amount: split.amount,
      expense_description: split.expense.description,
      expense_date: split.expense.created_at
    }));

    res.status(200).json({
      user_id: userId,
      summary: {
        amount_owed: balance.amount_owed,
        amount_due: balance.amount_due,
        net_balance: balance.getNetBalance()
      },
      owed_to_user: owedToUser,
      user_owes: userOwes
    });

  } catch (error) {
    console.error('Get balance details error:', error);
    res.status(500).json({
      error: 'Failed to fetch balance details',
      message: 'An error occurred while fetching balance details'
    });
  }
};

/**
 * Recalculate balance for a user
 * POST /balances/:userId/recalculate
 * 
 * Forces recalculation of user's balance from all expenses
 * Useful if balance gets out of sync
 * 
 * Response:
 * {
 *   "message": "Balance recalculated successfully",
 *   "balance": {...}
 * }
 */
const recalculateBalance = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID: ${userId}`
      });
    }

    // Recalculate balance
    const balance = await db.Balance.updateForUser(userId);

    res.status(200).json({
      message: 'Balance recalculated successfully',
      balance: {
        user_id: balance.user_id,
        amount_owed: balance.amount_owed,
        amount_due: balance.amount_due,
        net_balance: balance.getNetBalance(),
        updated_at: balance.updated_at
      }
    });

  } catch (error) {
    console.error('Recalculate balance error:', error);
    res.status(500).json({
      error: 'Failed to recalculate balance',
      message: 'An error occurred while recalculating balance'
    });
  }
};

/**
 * Get current user's balance
 * GET /balances/me
 * 
 * Convenience endpoint to get authenticated user's balance
 * 
 * Response:
 * {
 *   "balance": {...}
 * }
 */
const getCurrentUserBalance = async (req, res) => {
  try {
    const userId = req.user.userId;

    let balance = await db.Balance.findOne({
      where: { user_id: userId }
    });

    if (!balance) {
      balance = await db.Balance.updateForUser(userId);
    }

    res.status(200).json({
      balance: {
        user_id: balance.user_id,
        amount_owed: balance.amount_owed,
        amount_due: balance.amount_due,
        net_balance: balance.getNetBalance(),
        is_settled: balance.isSettled(),
        updated_at: balance.updated_at
      }
    });

  } catch (error) {
    console.error('Get current user balance error:', error);
    res.status(500).json({
      error: 'Failed to fetch balance',
      message: 'An error occurred while fetching balance data'
    });
  }
};

module.exports = {
  getBalanceByUserId,
  getBalanceDetails,
  recalculateBalance,
  getCurrentUserBalance
};
