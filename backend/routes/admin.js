const express = require('express');
const Grievance = require('../models/Grievance');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// All routes in this file require admin privileges
router.use(protect);
router.use(admin);

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Admin only
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalGrievances,
      pending,
      inProgress,
      resolved,
      rejected,
      totalUsers,
      recentGrievances
    ] = await Promise.all([
      Grievance.countDocuments(),
      Grievance.countDocuments({ status: 'pending' }),
      Grievance.countDocuments({ status: 'in-progress' }),
      Grievance.countDocuments({ status: 'resolved' }),
      Grievance.countDocuments({ status: 'rejected' }),
      User.countDocuments(),
      Grievance.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
    ]);

    // Category distribution
    const categoryStats = await Grievance.aggregate([
      { $group: { _id: '$aiCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      stats: {
        grievances: {
          total: totalGrievances,
          pending,
          inProgress,
          resolved,
          rejected
        },
        users: {
          total: totalUsers
        },
        categoryDistribution: categoryStats,
        recentGrievances
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

/**
 * @route   GET /api/admin/grievances
 * @desc    Get all grievances with filters
 * @access  Admin only
 */
router.get('/grievances', async (req, res) => {
  try {
    const {
      status,
      category,
      urgency,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.aiCategory = category;
    if (urgency) query.urgencyLevel = urgency;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const grievances = await Grievance.find(query)
      .populate('user', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Grievance.countDocuments(query);

    res.json({
      success: true,
      data: grievances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching admin grievances:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching grievances'
    });
  }
});

/**
 * @route   PATCH /api/admin/grievances/:id/status
 * @desc    Update grievance status
 * @access  Admin only
 */
router.patch('/grievances/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'in-progress', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const grievance = await Grievance.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      grievance
    });
  } catch (error) {
    console.error('Error updating grievance status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating status'
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Admin only
 */
router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get grievance count for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const grievanceCount = await Grievance.countDocuments({ user: user._id });
      return {
        ...user.toObject(),
        grievanceCount
      };
    }));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Change user role
 * @access  Admin only
 */
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role value'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user role'
    });
  }
});

/**
 * @route   GET /api/admin/users/:id/grievances
 * @desc    Get grievances for a specific user
 * @access  Admin only
 */
router.get('/users/:id/grievances', async (req, res) => {
  try {
    const grievances = await Grievance.find({ user: req.params.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: grievances
    });
  } catch (error) {
    console.error('Error fetching user grievances:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user grievances'
    });
  }
});

module.exports = router;