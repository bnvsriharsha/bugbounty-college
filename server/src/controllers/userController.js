const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Get all users with filter and pagination
// @route   GET /api/v1/users
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query).sort('-createdAt').skip(skip).limit(limitNum);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role or active status (Admin only)
// @route   PATCH /api/v1/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive, department } = req.body;

    // Prevent admin from removing their own admin role
    if (req.user._id.toString() === req.params.id && role && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot revoke your own administrator role.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (department) user.department = department;

    await user.save();

    await AuditLog.create({
      action: 'USER_ROLE_OR_STATUS_UPDATE',
      performedBy: req.user._id,
      targetType: 'User',
      targetId: user._id,
      details: { role, isActive, department },
    });

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};
