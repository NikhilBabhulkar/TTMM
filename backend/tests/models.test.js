// ============================================================================
// Models Test
// ============================================================================
// Basic tests to verify Sequelize models are configured correctly
// ============================================================================

const db = require('../models');

describe('Database Models', () => {
  // Test database connection before running tests
  beforeAll(async () => {
    const connected = await db.testConnection();
    expect(connected).toBe(true);
  });

  // Close connection after all tests
  afterAll(async () => {
    await db.closeConnection();
  });

  describe('Model Definitions', () => {
    test('User model should be defined', () => {
      expect(db.User).toBeDefined();
      expect(db.User.name).toBe('User');
    });

    test('Group model should be defined', () => {
      expect(db.Group).toBeDefined();
      expect(db.Group.name).toBe('Group');
    });

    test('GroupMember model should be defined', () => {
      expect(db.GroupMember).toBeDefined();
      expect(db.GroupMember.name).toBe('GroupMember');
    });

    test('Expense model should be defined', () => {
      expect(db.Expense).toBeDefined();
      expect(db.Expense.name).toBe('Expense');
    });

    test('ExpenseSplit model should be defined', () => {
      expect(db.ExpenseSplit).toBeDefined();
      expect(db.ExpenseSplit.name).toBe('ExpenseSplit');
    });

    test('Balance model should be defined', () => {
      expect(db.Balance).toBeDefined();
      expect(db.Balance.name).toBe('Balance');
    });
  });

  describe('Model Associations', () => {
    test('User should have associations', () => {
      expect(db.User.associations).toBeDefined();
      expect(db.User.associations.createdGroups).toBeDefined();
      expect(db.User.associations.groups).toBeDefined();
      expect(db.User.associations.paidExpenses).toBeDefined();
      expect(db.User.associations.balance).toBeDefined();
    });

    test('Group should have associations', () => {
      expect(db.Group.associations).toBeDefined();
      expect(db.Group.associations.creator).toBeDefined();
      expect(db.Group.associations.members).toBeDefined();
      expect(db.Group.associations.expenses).toBeDefined();
    });

    test('Expense should have associations', () => {
      expect(db.Expense.associations).toBeDefined();
      expect(db.Expense.associations.group).toBeDefined();
      expect(db.Expense.associations.payer).toBeDefined();
      expect(db.Expense.associations.splits).toBeDefined();
    });
  });

  describe('ExpenseSplit Helper Methods', () => {
    test('calculateEqualSplit should divide amount equally', () => {
      const result = db.ExpenseSplit.calculateEqualSplit(3000, 3);
      expect(result).toBe(1000);
    });

    test('calculateEqualSplit should round to 2 decimals', () => {
      const result = db.ExpenseSplit.calculateEqualSplit(100, 3);
      expect(result).toBe(33.33);
    });

    test('calculateEqualSplit should throw error for invalid input', () => {
      expect(() => {
        db.ExpenseSplit.calculateEqualSplit(100, 0);
      }).toThrow('Number of people must be positive');
    });

    test('validateSplitsSum should accept valid splits', () => {
      const splits = [
        { amount: 1000 },
        { amount: 1000 },
        { amount: 1000 }
      ];
      expect(() => {
        db.ExpenseSplit.validateSplitsSum(splits, 3000);
      }).not.toThrow();
    });

    test('validateSplitsSum should reject invalid splits', () => {
      const splits = [
        { amount: 1000 },
        { amount: 1000 },
        { amount: 500 }
      ];
      expect(() => {
        db.ExpenseSplit.validateSplitsSum(splits, 3000);
      }).toThrow('Splits sum');
    });

    test('validateSplitsSum should allow small rounding differences', () => {
      const splits = [
        { amount: 33.33 },
        { amount: 33.33 },
        { amount: 33.34 }
      ];
      expect(() => {
        db.ExpenseSplit.validateSplitsSum(splits, 100);
      }).not.toThrow();
    });
  });
});
