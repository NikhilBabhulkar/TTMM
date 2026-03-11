// ============================================================================
// Group Controller
// ============================================================================
// Handles group creation, management, and member operations
// All endpoints require authentication
// ============================================================================

const db = require('../models');

/**
 * Create a new group
 * POST /groups
 * 
 * Request body:
 * {
 *   "name": "Weekend Trip",
 *   "members": ["uuid1", "uuid2"] // Optional - additional members to add
 * }
 * 
 * Response:
 * {
 *   "message": "Group created successfully",
 *   "group": {
 *     "id": "uuid",
 *     "name": "Weekend Trip",
 *     "created_by": "uuid",
 *     "members": [...]
 *   }
 * }
 */
const createGroup = async (req, res) => {
  // Start a transaction to ensure atomicity
  const transaction = await db.transaction();

  try {
    const { name, members } = req.body;
    const creatorId = req.user.userId;

    // 1. Validate input (group name)
    if (!name || name.trim().length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Group name is required'
      });
    }

    // 2. Create group with created_by = current user
    const group = await db.Group.create({
      name: name.trim(),
      created_by: creatorId
    }, { transaction });

    // 3. Add creator as first group member
    await db.GroupMember.create({
      group_id: group.id,
      user_id: creatorId
    }, { transaction });

    // 4. Add additional members if provided
    const memberIds = new Set([creatorId]); // Track added members
    
    if (members && Array.isArray(members) && members.length > 0) {
      for (const memberId of members) {
        // Skip if already added (creator or duplicate)
        if (memberIds.has(memberId)) {
          continue;
        }

        // Verify user exists
        const userExists = await db.User.findByPk(memberId);
        if (!userExists) {
          await transaction.rollback();
          return res.status(400).json({
            error: 'Invalid member',
            message: `User with ID ${memberId} does not exist`
          });
        }

        // Add member to group
        await db.GroupMember.create({
          group_id: group.id,
          user_id: memberId
        }, { transaction });

        memberIds.add(memberId);
      }
    }

    // Commit transaction
    await transaction.commit();

    // Fetch complete group data with members
    const completeGroup = await db.Group.findByPk(group.id, {
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: db.User,
          as: 'members',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] } // Exclude junction table data
        }
      ]
    });

    // Log activity
    await db.ActivityLog.logActivity({
      userId: creatorId,
      groupId: group.id,
      actionType: 'group_created',
      entityId: group.id,
      entityType: 'group',
      description: `Created group "${group.name}"`,
      metadata: { member_count: memberIds.size },
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Group created successfully',
      group: {
        id: completeGroup.id,
        name: completeGroup.name,
        created_by: completeGroup.created_by,
        creator: completeGroup.creator,
        members: completeGroup.members,
        created_at: completeGroup.created_at
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Create group error:', error);
    res.status(500).json({
      error: 'Failed to create group',
      message: 'An error occurred while creating the group'
    });
  }
};

/**
 * Get group by ID
 * GET /groups/:id
 * 
 * Returns group details including members and creator
 * 
 * Response:
 * {
 *   "group": {
 *     "id": "uuid",
 *     "name": "Weekend Trip",
 *     "created_by": "uuid",
 *     "creator": {...},
 *     "members": [...]
 *   }
 * }
 */
const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    // Query group with members (JOIN group_members)
    const group = await db.Group.findByPk(id, {
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: db.User,
          as: 'members',
          attributes: ['id', 'name', 'email'],
          through: { 
            attributes: ['joined_at'] // Include when they joined
          }
        }
      ]
    });

    // Return 404 if group not found
    if (!group) {
      return res.status(404).json({
        error: 'Group not found',
        message: `No group found with ID: ${id}`
      });
    }

    res.status(200).json({
      group: {
        id: group.id,
        name: group.name,
        created_by: group.created_by,
        creator: group.creator,
        members: group.members,
        created_at: group.created_at
      }
    });

  } catch (error) {
    console.error('Get group by ID error:', error);
    res.status(500).json({
      error: 'Failed to fetch group',
      message: 'An error occurred while fetching group data'
    });
  }
};

/**
 * Add member to group
 * POST /groups/:id/members
 * 
 * Request body:
 * {
 *   "user_id": "uuid"
 * }
 * 
 * Response:
 * {
 *   "message": "Member added successfully",
 *   "member": {...}
 * }
 */
const addMemberToGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const { user_id: userId } = req.body;

    // 1. Validate groupId and userId
    if (!userId) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'User ID is required'
      });
    }

    // 2. Check if group exists
    const group = await db.Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        error: 'Group not found',
        message: `No group found with ID: ${groupId}`
      });
    }

    // 3. Check if user exists
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID: ${userId}`
      });
    }

    // 4. Check if already a member
    const existingMembership = await db.GroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: userId
      }
    });

    if (existingMembership) {
      return res.status(409).json({
        error: 'Already a member',
        message: 'User is already a member of this group'
      });
    }

    // Create group_members record
    const membership = await db.GroupMember.create({
      group_id: groupId,
      user_id: userId
    });

    // Log activity
    await db.ActivityLog.logActivity({
      userId: req.user.userId,
      groupId: groupId,
      actionType: 'member_added',
      entityId: userId,
      entityType: 'user',
      description: `Added ${user.name} to group`,
      metadata: { added_user_id: userId, added_user_name: user.name },
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'Member added successfully',
      member: {
        id: user.id,
        name: user.name,
        email: user.email,
        joined_at: membership.joined_at
      }
    });

  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      error: 'Failed to add member',
      message: 'An error occurred while adding member to group'
    });
  }
};

/**
 * Get all groups for current user
 * GET /groups
 * 
 * Returns all groups the authenticated user is a member of
 * 
 * Response:
 * {
 *   "groups": [
 *     {
 *       "id": "uuid",
 *       "name": "Weekend Trip",
 *       "member_count": 3
 *     }
 *   ]
 * }
 */
const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all groups where user is a member
    const user = await db.User.findByPk(userId, {
      include: [{
        model: db.Group,
        as: 'groups',
        attributes: ['id', 'name', 'created_by', 'created_at'],
        through: { attributes: [] }, // Exclude junction table
        include: [{
          model: db.User,
          as: 'members',
          attributes: ['id'],
          through: { attributes: [] }
        }]
      }]
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    // Format response with member counts
    const groups = user.groups.map(group => ({
      id: group.id,
      name: group.name,
      created_by: group.created_by,
      is_creator: group.created_by === userId,
      member_count: group.members.length,
      created_at: group.created_at
    }));

    res.status(200).json({
      count: groups.length,
      groups
    });

  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({
      error: 'Failed to fetch groups',
      message: 'An error occurred while fetching groups'
    });
  }
};

/**
 * Remove member from group
 * DELETE /groups/:id/members/:userId
 * 
 * Only group creator can remove members
 * Members can remove themselves
 * 
 * Response:
 * {
 *   "message": "Member removed successfully"
 * }
 */
const removeMemberFromGroup = async (req, res) => {
  try {
    const { id: groupId, userId: memberIdToRemove } = req.params;
    const currentUserId = req.user.userId;

    // Check if group exists
    const group = await db.Group.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        error: 'Group not found',
        message: `No group found with ID: ${groupId}`
      });
    }

    // Check authorization: must be creator or removing self
    const isCreator = group.created_by === currentUserId;
    const isRemovingSelf = memberIdToRemove === currentUserId;

    if (!isCreator && !isRemovingSelf) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only group creator can remove other members'
      });
    }

    // Find and delete membership
    const membership = await db.GroupMember.findOne({
      where: {
        group_id: groupId,
        user_id: memberIdToRemove
      }
    });

    if (!membership) {
      return res.status(404).json({
        error: 'Member not found',
        message: 'User is not a member of this group'
      });
    }

    await membership.destroy();

    // Log activity
    const removedUser = await db.User.findByPk(memberIdToRemove);
    await db.ActivityLog.logActivity({
      userId: currentUserId,
      groupId: groupId,
      actionType: 'member_removed',
      entityId: memberIdToRemove,
      entityType: 'user',
      description: `Removed ${removedUser?.name || 'user'} from group`,
      metadata: { removed_user_id: memberIdToRemove, removed_user_name: removedUser?.name },
      ipAddress: req.ip
    });

    res.status(200).json({
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      error: 'Failed to remove member',
      message: 'An error occurred while removing member from group'
    });
  }
};
/**
 * Delete group
 * DELETE /groups/:id
 *
 * Only group creator can delete a group
 * Deletes all associated data (members, expenses, splits, balances)
 *
 * Response:
 * {
 *   "message": "Group deleted successfully"
 * }
 */
const deleteGroup = async (req, res) => {
  const transaction = await db.transaction();

  try {
    const { id: groupId } = req.params;
    const currentUserId = req.user.userId;

    // Find group
    const group = await db.Group.findByPk(groupId);
    if (!group) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Group not found',
        message: `No group found with ID: ${groupId}`
      });
    }

    // Check authorization: must be creator
    if (group.created_by !== currentUserId) {
      await transaction.rollback();
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the group creator can delete this group'
      });
    }

    // Get all members for balance recalculation
    const members = await db.GroupMember.findAll({
      where: { group_id: groupId },
      attributes: ['user_id']
    });
    const memberIds = members.map(m => m.user_id);

    // Log activity before deletion
    await db.ActivityLog.logActivity({
      userId: currentUserId,
      groupId: groupId,
      actionType: 'group_deleted',
      entityId: groupId,
      entityType: 'group',
      description: `Deleted group "${group.name}"`,
      metadata: { group_name: group.name, member_count: memberIds.length },
      ipAddress: req.ip
    });

    // Delete group (cascades to members, expenses, splits via DB constraints)
    await group.destroy({ transaction });

    // Update balances for all affected users
    await Promise.all(
      memberIds.map(userId => db.Balance.updateForUser(userId))
    );

    await transaction.commit();

    res.status(200).json({
      message: 'Group deleted successfully'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Delete group error:', error);
    res.status(500).json({
      error: 'Failed to delete group',
      message: 'An error occurred while deleting the group'
    });
  }
};

module.exports = {
  createGroup,
  getGroupById,
  addMemberToGroup,
  getUserGroups,
  removeMemberFromGroup,
  deleteGroup
};
