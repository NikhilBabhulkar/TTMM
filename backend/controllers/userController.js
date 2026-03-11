// ============================================================================
// User Controller
// ============================================================================
// Handles user profile operations
// All endpoints require authentication
// ============================================================================

const db = require('../models');

/**
 * Get all users
 * GET /users
 * 
 * Returns list of all users (public information only)
 * Useful for adding members to groups
 * 
 * Response:
 * {
 *   "users": [
 *     {
 *       "id": "uuid",
 *       "name": "John Doe",
 *       "email": "john@example.com"
 *     }
 *   ]
 * }
 */
const getAllUsers = async (req, res) => {
  try {
    // Query all users, excluding password_hash (default scope)
    const users = await db.User.findAll({
      attributes: ['id', 'name', 'email', 'created_at'],
      order: [['name', 'ASC']] // Sort alphabetically by name
    });

    res.status(200).json({
      count: users.length,
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email
      }))
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: 'An error occurred while fetching users'
    });
  }
};

/**
 * Get user by ID
 * GET /users/:id
 * 
 * Returns public information for a specific user
 * 
 * Response:
 * {
 *   "user": {
 *     "id": "uuid",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "created_at": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user by ID, excluding password_hash
    const user = await db.User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'created_at']
    });

    // Return 404 if user not found
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID: ${id}`
      });
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: 'An error occurred while fetching user data'
    });
  }
};

/**
 * Search users by name or email
 * GET /users/search?q=query
 * 
 * Searches for users matching the query string
 * 
 * Response:
 * {
 *   "users": [
 *     {
 *       "id": "uuid",
 *       "name": "John Doe",
 *       "email": "john@example.com"
 *     }
 *   ]
 * }
 */
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid query',
        message: 'Search query cannot be empty'
      });
    }

    const searchTerm = `%${q.trim()}%`;

    // Search by name or email using LIKE operator
    const users = await db.User.findAll({
      attributes: ['id', 'name', 'email'],
      where: {
        [db.Sequelize.Op.or]: [
          { name: { [db.Sequelize.Op.iLike]: searchTerm } },
          { email: { [db.Sequelize.Op.iLike]: searchTerm } }
        ]
      },
      limit: 20, // Limit results to prevent large responses
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      count: users.length,
      query: q,
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email
      }))
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while searching for users'
    });
  }
};

/**
 * Update current user profile
 * PUT /users/me
 * 
 * Allows user to update their own name
 * Email cannot be changed (would require re-verification)
 * 
 * Request body:
 * {
 *   "name": "New Name"
 * }
 * 
 * Response:
 * {
 *   "message": "Profile updated successfully",
 *   "user": {
 *     "id": "uuid",
 *     "name": "New Name",
 *     "email": "john@example.com"
 *   }
 * }
 */
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.userId;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Name cannot be empty'
      });
    }

    // Find and update user
    const user = await db.User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    user.name = name.trim();
    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Update failed',
      message: 'An error occurred while updating profile'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  searchUsers,
  updateProfile
};
