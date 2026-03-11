// ============================================================================
// Activity Controller
// ============================================================================
// Handles activity log retrieval for transparency and audit purposes
// ============================================================================

const db = require('../models');

/**
 * Get activity logs for current user
 * GET /activity
 * 
 * Query params:
 * - limit: Number of records to return (default: 50, max: 200)
 * - offset: Number of records to skip (default: 0)
 * - group_id: Filter by specific group (optional)
 * 
 * Response:
 * {
 *   "count": 25,
 *   "activities": [...]
 * }
 */
const getUserActivities = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0, group_id } = req.query;

    // Parse and validate pagination params
    const parsedLimit = Math.min(parseInt(limit) || 50, 200);
    const parsedOffset = parseInt(offset) || 0;

    // Build query conditions
    const whereClause = { user_id: userId };
    if (group_id) {
      whereClause.group_id = group_id;
    }

    // Fetch activities
    const activities = await db.ActivityLog.findAll({
      where: whereClause,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: db.Group,
          as: 'group',
          attributes: ['id', 'name'],
          required: false // LEFT JOIN (some activities don't have groups)
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.status(200).json({
      count: activities.length,
      limit: parsedLimit,
      offset: parsedOffset,
      activities
    });

  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      error: 'Failed to fetch activities',
      message: 'An error occurred while fetching activity logs'
    });
  }
};

/**
 * Get activity logs for a specific group
 * GET /activity/group/:id
 * 
 * Returns all activities related to a specific group
 * User must be a member of the group to view its activities
 * 
 * Query params:
 * - limit: Number of records to return (default: 50, max: 200)
 * - offset: Number of records to skip (default: 0)
 * 
 * Response:
 * {
 *   "count": 15,
 *   "group_id": "uuid",
 *   "activities": [...]
 * }
 */
const getGroupActivities = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const currentUserId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Parse and validate pagination params
    const parsedLimit = Math.min(parseInt(limit) || 50, 200);
    const parsedOffset = parseInt(offset) || 0;

    // Verify group exists
    const group = await db.Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        error: 'Group not found',
        message: `No group found with ID: ${groupId}`
      });
    }

    // Verify user is a member of the group
    const membership = await db.GroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: currentUserId
      }
    });

    if (!membership) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You must be a member of this group to view its activities'
      });
    }

    // Fetch activities for this group
    const activities = await db.ActivityLog.findAll({
      where: { group_id: groupId },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: db.Group,
          as: 'group',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.status(200).json({
      count: activities.length,
      limit: parsedLimit,
      offset: parsedOffset,
      group_id: groupId,
      activities
    });

  } catch (error) {
    console.error('Get group activities error:', error);
    res.status(500).json({
      error: 'Failed to fetch group activities',
      message: 'An error occurred while fetching activity logs'
    });
  }
};

module.exports = {
  getUserActivities,
  getGroupActivities
};
