// ============================================================================
// Database Setup Script
// ============================================================================
// Creates database, runs migrations, and optionally seeds data
// Usage: node scripts/setup-database.js [--seed]
// ============================================================================

require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const db = require('../models');

/**
 * Create database if it doesn't exist
 */
async function createDatabase() {
  // Connect to postgres database (default database)
  const sequelize = new Sequelize({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default postgres database
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('✓ Connected to PostgreSQL');

    // Check if database exists
    const [results] = await sequelize.query(
      `SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`
    );

    if (results.length === 0) {
      // Create database
      await sequelize.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`✓ Created database: ${process.env.DB_NAME}`);
    } else {
      console.log(`✓ Database already exists: ${process.env.DB_NAME}`);
    }

    await sequelize.close();
  } catch (error) {
    console.error('✗ Database creation failed:', error.message);
    throw error;
  }
}

/**
 * Run migrations
 */
async function runMigrations() {
  try {
    console.log('\n🔄 Running migrations...');
    
    // Sync all models (creates tables if they don't exist)
    await db.sequelize.sync({ force: false });
    
    console.log('✓ Migrations completed');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  }
}

/**
 * Seed database with sample data
 */
async function seedDatabase() {
  try {
    console.log('\n🌱 Seeding database...');

    const { User, Group, GroupMember, Expense, ExpenseSplit } = db;

    // Hash password for sample users
    const hashedPassword = await bcrypt.hash('Password123', 10);

    // Create sample users
    const users = await Promise.all([
      User.create({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password_hash: hashedPassword
      }),
      User.create({
        name: 'Bob Smith',
        email: 'bob@example.com',
        password_hash: hashedPassword
      }),
      User.create({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password_hash: hashedPassword
      })
    ]);

    console.log('✓ Created 3 sample users');

    // Create sample group
    const group = await Group.create({
      name: 'Weekend Trip',
      created_by: users[0].id
    });

    // Add all users to the group
    await Promise.all(
      users.map(user => 
        GroupMember.create({
          group_id: group.id,
          user_id: user.id
        })
      )
    );

    console.log('✓ Created sample group with members');

    // Create sample expense
    const expense = await Expense.create({
      group_id: group.id,
      paid_by: users[0].id,
      amount: 3000,
      description: 'Dinner at restaurant',
      split_type: 'equal'
    });

    // Create equal splits
    const splitAmount = 3000 / 3;
    await Promise.all(
      users.map(user =>
        ExpenseSplit.create({
          expense_id: expense.id,
          user_id: user.id,
          amount: splitAmount
        })
      )
    );

    console.log('✓ Created sample expense with splits');
    console.log('\n✅ Database seeding completed!');
    console.log('\nSample credentials:');
    console.log('  Email: alice@example.com');
    console.log('  Email: bob@example.com');
    console.log('  Email: charlie@example.com');
    console.log('  Password: Password123');
  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    throw error;
  }
}

/**
 * Main setup function
 */
async function setup() {
  const shouldSeed = process.argv.includes('--seed');

  try {
    console.log('🚀 Starting database setup...\n');

    // Step 1: Create database
    await createDatabase();

    // Step 2: Run migrations
    await runMigrations();

    // Step 3: Seed data (optional)
    if (shouldSeed) {
      await seedDatabase();
    }

    console.log('\n✅ Database setup completed successfully!');
    console.log('\nYou can now start the server with: npm start');
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setup();
