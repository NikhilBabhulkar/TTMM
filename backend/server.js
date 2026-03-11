// ============================================================================
// Main Server File
// ============================================================================
// Express application entry point
// Configures middleware, routes, error handling, and starts the server
// ============================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import database
const db = require('./models');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const activityRoutes = require('./routes/activityRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// ============================================================================
// Middleware Stack
// ============================================================================

// 1. Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  crossOriginEmbedderPolicy: false
}));

// 2. CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Request logging with Morgan (only in development)
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 5. Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to auth routes
app.use('/register', authLimiter);
app.use('/login', authLimiter);

// ============================================================================
// Health Check Endpoints
// ============================================================================

/**
 * Basic health check
 * GET /health
 * GET /api/health (for Kubernetes)
 * Returns 200 if server is running
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

/**
 * Readiness check (includes database connection)
 * GET /ready
 * Returns 200 if server and database are ready
 */
app.get('/ready', async (req, res) => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      database: 'disconnected',
      error: error.message
    });
  }
});

// ============================================================================
// API Routes
// ============================================================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Expense Sharing API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      ready: '/ready',
      auth: {
        register: 'POST /register',
        login: 'POST /login',
        me: 'GET /me'
      },
      users: {
        list: 'GET /users',
        get: 'GET /users/:id',
        search: 'GET /users/search?q=query'
      },
      groups: {
        list: 'GET /groups',
        create: 'POST /groups',
        get: 'GET /groups/:id',
        addMember: 'POST /groups/:id/members'
      },
      expenses: {
        create: 'POST /expenses',
        getByGroup: 'GET /expenses/group/:id',
        get: 'GET /expenses/:id'
      },
      balances: {
        me: 'GET /balances/me',
        get: 'GET /balances/:userId',
        details: 'GET /balances/:userId/details'
      }
    }
  });
});

// Mount routes
app.use('/', authRoutes);              // /register, /login, /me
app.use('/users', userRoutes);         // /users/*
app.use('/groups', groupRoutes);       // /groups/*
app.use('/expenses', expenseRoutes);   // /expenses/*
app.use('/balances', balanceRoutes);   // /balances/*
app.use('/activity', activityRoutes);  // /activity/*

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    path: req.path
  });
});

// Global error handler - must be last
app.use(errorHandler);

// ============================================================================
// Database Connection and Server Startup
// ============================================================================

/**
 * Start the server
 * Connects to database and starts listening on configured port
 */
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔌 Connecting to database...');
    await db.testConnection();

    // Sync models (only in development - use migrations in production)
    if (NODE_ENV === 'development') {
      console.log('🔄 Syncing database models...');
      await db.sequelize.sync({ alter: false }); // Don't alter tables automatically
    }

    // Start listening
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('✅ Server started successfully!');
      console.log('');
      console.log(`🚀 Environment: ${NODE_ENV}`);
      console.log(`🌐 Server running on: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔍 API docs: http://localhost:${PORT}/`);
      console.log('');
      console.log('Press CTRL+C to stop the server');
      console.log('');
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async () => {
        console.log('✓ HTTP server closed');
        
        try {
          // Close database connection
          await db.closeConnection();
          console.log('✓ Database connection closed');
          
          console.log('✓ Graceful shutdown complete');
          process.exit(0);
        } catch (error) {
          console.error('✗ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('✗ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('✗ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('✗ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export app for testing
module.exports = app;
