// ============================================================================
// Expense Controller
// ============================================================================
// Handles expense creation and retrieval
// Implements equal and custom split logic with balance updates
// ============================================================================

const db = require('../models');

/**
 * Create a new expense
 * POST /expenses
 * 
 * Request body:
 * {
 *   "group_id": "uuid",
 *   "paid_by": "uuid",
 *   "amount": 3000,
 *   "description": "Dinner at restaurant",
 *   "split_type": "equal" | "custom",
 *   "splits": [
 *     { "user_id": "uuid", "amount": 1000 }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "message": "Expense created successfully",
 *   "expense": {...}
 * }
 */
const createExpense = async (req, res) => {
  // Start transaction to ensure atomicity
  const transaction = await db.transaction();

  try {
    const { group_id, paid_by, amount, description, split_type, splits } = req.body;

    // 1. Validate input
    if (!group_id || !paid_by || !amount || !description) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Invalid input',
        message: 'group_id, paid_by, amount, and description are required'
      });
    }

    // Validate amount is positive
    if (amount <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be greater than 0'
      });
    }

    // 2. Verify group exists
    const group = await db.Group.findByPk(group_id, {
      include: [{
        model: db.User,
        as: 'members',
        attributes: ['id']
      }]
    });

    if (!group) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Group not found',
        message: `No group found with ID: ${group_id}`
      });
    }

    // 3. Verify payer is a group member
    const memberIds = group.members.map(m => m.id);
    if (!memberIds.includes(paid_by)) {
      await transaction.rollback();
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Payer must be a member of the group'
      });
    }

    // 4. Calculate or validate splits
    let expenseSplits = [];

    if (split_type === 'equal' || !splits) {
      // Equal split: divide amount equally among all members
      const splitAmount = db.ExpenseSplit.calculateEqualSplit(amount, memberIds.length);
      
      expenseSplits = memberIds.map(memberId => ({
        user_id: memberId,
        amount: splitAmount
      }));

      // Adjust last split to account for rounding
      const totalSplits = splitAmount * memberIds.length;
      const difference = parseFloat((amount - totalSplits).toFixed(2));
      if (Math.abs(difference) > 0) {
        expenseSplits[expenseSplits.length - 1].amount = 
          parseFloat((splitAmount + difference).toFixed(2));
      }

    } else if (split_type === 'custom' && splits) {
      // Custom split: use provided splits
      expenseSplits = splits;

      // Validate all split users are group members
      for (const split of expenseSplits) {
        if (!memberIds.includes(split.user_id)) {
          await transaction.rollback();
          return res.status(400).json({
            error: 'Invalid split',
            message: `User ${split.user_id} is not a member of this group`
          });
        }
      }

      // Validate splits sum to total amount
      try {
        db.ExpenseSplit.validateSplitsSum(expenseSplits, amount);
      } catch (error) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Invalid splits',
          message: error.message
        });
      }

    } else {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Either use split_type="equal" or provide custom splits'
      });
    }

    // 5. Create expense record
    const expense = await db.Expense.create({
      group_id,
      paid_by,
      amount: parseFloat(amount),
      description: description.trim()
    }, { transaction });

    // 6. Create expense_splits records for each member
    const splitRecords = await Promise.all(
      expenseSplits.map(split =>
        db.ExpenseSplit.create({
          expense_id: expense.id,
          user_id: split.user_id,
          amount: parseFloat(split.amount)
        }, { transaction })
      )
    );

    // 7. Update balances for affected users
    // Get unique user IDs involved in this expense
    const affectedUserIds = new Set([paid_by, ...expenseSplits.map(s => s.user_id)]);
    
    await Promise.all(
      Array.from(affectedUserIds).map(userId =>
        db.Balance.updateForUser(userId)
      )
    );

    // 8. Commit transaction
    await transaction.commit();

    // 9. Fetch complete expense data with payer and splits
    const completeExpense = await db.Expense.findByPk(expense.id, {
      include: [
        {
          model: db.User,
          as: 'payer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: db.ExpenseSplit,
          as: 'splits',
          include: [{
            model: db.User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }]
        }
      ]
    });

    // Log activity
    await db.ActivityLog.logActivity({
      userId: paid_by,
      groupId: group_id,
      actionType: 'expense_created',
      entityId: expense.id,
      entityType: 'expense',
      description: `Created expense "${description}" for ${amount}`,
      metadata: { amount, split_type: split_type || 'equal', split_count: expenseSplits.length },
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Expense created successfully',
      expense: completeExpense
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Create expense error:', error);
    res.status(500).json({
      error: 'Failed to create expense',
      message: 'An error occurred while creating the expense'
    });
  }
};

/**
 * Get expenses for a group
 * GET /expenses/group/:id
 * 
 * Returns all expenses for a specific group with payer and split details
 * 
 * Response:
 * {
 *   "expenses": [
 *     {
 *       "id": "uuid",
 *       "amount": 3000,
 *       "description": "Dinner",
 *       "paid_by": {...},
 *       "splits": [...]
 *     }
 *   ]
 * }
 */
const getExpensesByGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;

    // Verify group exists
    const group = await db.Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        error: 'Group not found',
        message: `No group found with ID: ${groupId}`
      });
    }

    // Query expenses with payer info and splits
    const expenses = await db.Expense.findAll({
      where: { group_id: groupId },
      include: [
        {
          model: db.User,
          as: 'payer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: db.ExpenseSplit,
          as: 'splits',
          include: [{
            model: db.User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }]
        }
      ],
      order: [['created_at', 'DESC']] // Most recent first
    });

    res.status(200).json({
      count: expenses.length,
      group_id: groupId,
      expenses
    });

  } catch (error) {
    console.error('Get expenses by group error:', error);
    res.status(500).json({
      error: 'Failed to fetch expenses',
      message: 'An error occurred while fetching expenses'
    });
  }
};

/**
 * Get expense by ID
 * GET /expenses/:id
 * 
 * Returns detailed information about a specific expense
 * 
 * Response:
 * {
 *   "expense": {
 *     "id": "uuid",
 *     "amount": 3000,
 *     "description": "Dinner",
 *     "paid_by": {...},
 *     "splits": [...]
 *   }
 * }
 */
const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await db.Expense.findByPk(id, {
      include: [
        {
          model: db.User,
          as: 'payer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: db.Group,
          as: 'group',
          attributes: ['id', 'name']
        },
        {
          model: db.ExpenseSplit,
          as: 'splits',
          include: [{
            model: db.User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }]
        }
      ]
    });

    if (!expense) {
      return res.status(404).json({
        error: 'Expense not found',
        message: `No expense found with ID: ${id}`
      });
    }

    res.status(200).json({
      expense
    });

  } catch (error) {
    console.error('Get expense by ID error:', error);
    res.status(500).json({
      error: 'Failed to fetch expense',
      message: 'An error occurred while fetching expense data'
    });
  }
};

/**
 * Delete expense
 * DELETE /expenses/:id
 * 
 * Only the payer or group creator can delete an expense
 * Automatically updates balances after deletion
 * 
 * Response:
 * {
 *   "message": "Expense deleted successfully"
 * }
 */
const deleteExpense = async (req, res) => {
  const transaction = await db.transaction();

  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;

    // Find expense with group info
    const expense = await db.Expense.findByPk(id, {
      include: [{
        model: db.Group,
        as: 'group',
        attributes: ['created_by']
      }]
    });

    if (!expense) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Expense not found',
        message: `No expense found with ID: ${id}`
      });
    }

    // Check authorization: must be payer or group creator
    const isPayer = expense.paid_by === currentUserId;
    const isGroupCreator = expense.group.created_by === currentUserId;

    if (!isPayer && !isGroupCreator) {
      await transaction.rollback();
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the payer or group creator can delete this expense'
      });
    }

    // Get affected users before deletion
    const splits = await db.ExpenseSplit.findAll({
      where: { expense_id: id }
    });
    const affectedUserIds = new Set([expense.paid_by, ...splits.map(s => s.user_id)]);

    // Delete expense (splits will cascade delete)
    await expense.destroy({ transaction });

    // Update balances for affected users
    await Promise.all(
      Array.from(affectedUserIds).map(userId =>
        db.Balance.updateForUser(userId)
      )
    );

    await transaction.commit();

    // Log activity
    await db.ActivityLog.logActivity({
      userId: currentUserId,
      groupId: expense.group_id,
      actionType: 'expense_deleted',
      entityId: id,
      entityType: 'expense',
      description: `Deleted expense "${expense.description}"`,
      metadata: { amount: expense.amount, paid_by: expense.paid_by },
      ipAddress: req.ip
    });

    res.status(200).json({
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Delete expense error:', error);
    res.status(500).json({
      error: 'Failed to delete expense',
      message: 'An error occurred while deleting the expense'
    });
  }
};
/**
 * Update expense
 * PUT /expenses/:id
 *
 * Only the payer or group creator can update an expense
 * Updates expense details and recalculates balances
 *
 * Request body:
 * {
 *   "amount": 3500,
 *   "description": "Updated description",
 *   "split_type": "equal" | "custom",
 *   "splits": [...]
 * }
 *
 * Response:
 * {
 *   "message": "Expense updated successfully",
 *   "expense": {...}
 * }
 */
const updateExpense = async (req, res) => {
  const transaction = await db.transaction();

  try {
    const { id } = req.params;
    const { amount, description, split_type, splits } = req.body;
    const currentUserId = req.user.userId;

    // Find expense with group and current splits
    const expense = await db.Expense.findByPk(id, {
      include: [
        {
          model: db.Group,
          as: 'group',
          attributes: ['id', 'created_by'],
          include: [{
            model: db.User,
            as: 'members',
            attributes: ['id']
          }]
        },
        {
          model: db.ExpenseSplit,
          as: 'splits'
        }
      ]
    });

    if (!expense) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Expense not found',
        message: `No expense found with ID: ${id}`
      });
    }

    // Check authorization: must be payer or group creator
    const isPayer = expense.paid_by === currentUserId;
    const isGroupCreator = expense.group.created_by === currentUserId;

    if (!isPayer && !isGroupCreator) {
      await transaction.rollback();
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the payer or group creator can update this expense'
      });
    }

    // Store old values for activity log
    const oldValues = {
      amount: expense.amount,
      description: expense.description,
      splits: expense.splits.map(s => ({ user_id: s.user_id, amount: s.amount }))
    };

    // Update expense fields if provided
    if (amount !== undefined) {
      if (amount <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Invalid amount',
          message: 'Amount must be greater than 0'
        });
      }
      expense.amount = parseFloat(amount);
    }

    if (description !== undefined) {
      if (!description || description.trim().length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Invalid description',
          message: 'Description cannot be empty'
        });
      }
      expense.description = description.trim();
    }

    // Save expense updates
    await expense.save({ transaction });

    // Update splits if provided
    if (splits || split_type) {
      const memberIds = expense.group.members.map(m => m.id);
      let newSplits = [];

      if (split_type === 'equal' || !splits) {
        // Equal split
        const splitAmount = db.ExpenseSplit.calculateEqualSplit(expense.amount, memberIds.length);

        newSplits = memberIds.map(memberId => ({
          user_id: memberId,
          amount: splitAmount
        }));

        // Adjust last split for rounding
        const totalSplits = splitAmount * memberIds.length;
        const difference = parseFloat((expense.amount - totalSplits).toFixed(2));
        if (Math.abs(difference) > 0) {
          newSplits[newSplits.length - 1].amount =
            parseFloat((splitAmount + difference).toFixed(2));
        }

      } else if (split_type === 'custom' && splits) {
        // Custom split
        newSplits = splits;

        // Validate all split users are group members
        for (const split of newSplits) {
          if (!memberIds.includes(split.user_id)) {
            await transaction.rollback();
            return res.status(400).json({
              error: 'Invalid split',
              message: `User ${split.user_id} is not a member of this group`
            });
          }
        }

        // Validate splits sum to total amount
        try {
          db.ExpenseSplit.validateSplitsSum(newSplits, expense.amount);
        } catch (error) {
          await transaction.rollback();
          return res.status(400).json({
            error: 'Invalid splits',
            message: error.message
          });
        }
      }

      // Delete old splits
      await db.ExpenseSplit.destroy({
        where: { expense_id: id },
        transaction
      });

      // Create new splits
      await Promise.all(
        newSplits.map(split =>
          db.ExpenseSplit.create({
            expense_id: id,
            user_id: split.user_id,
            amount: parseFloat(split.amount)
          }, { transaction })
        )
      );
    }

    // Get affected users (old and new splits)
    const oldUserIds = oldValues.splits.map(s => s.user_id);
    const newSplitRecords = await db.ExpenseSplit.findAll({
      where: { expense_id: id }
    });
    const newUserIds = newSplitRecords.map(s => s.user_id);
    const affectedUserIds = new Set([expense.paid_by, ...oldUserIds, ...newUserIds]);

    // Update balances for all affected users
    await Promise.all(
      Array.from(affectedUserIds).map(userId =>
        db.Balance.updateForUser(userId)
      )
    );

    // Log activity
    await db.ActivityLog.logActivity({
      userId: currentUserId,
      groupId: expense.group_id,
      actionType: 'expense_updated',
      entityId: id,
      entityType: 'expense',
      description: `Updated expense "${expense.description}"`,
      metadata: { old_values: oldValues, new_amount: expense.amount },
      ipAddress: req.ip
    });

    await transaction.commit();

    // Fetch updated expense with all details
    const updatedExpense = await db.Expense.findByPk(id, {
      include: [
        {
          model: db.User,
          as: 'payer',
          attributes: ['id', 'name', 'email']
        },
        {
          model: db.ExpenseSplit,
          as: 'splits',
          include: [{
            model: db.User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }]
        }
      ]
    });

    res.status(200).json({
      message: 'Expense updated successfully',
      expense: updatedExpense
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Update expense error:', error);
    res.status(500).json({
      error: 'Failed to update expense',
      message: 'An error occurred while updating the expense'
    });
  }
};

module.exports = {
  createExpense,
  getExpensesByGroup,
  getExpenseById,
  deleteExpense,
  updateExpense
};
