const Report = require('../models/Report');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const VerificationVote = require('../models/VerificationVote');

// @desc    Public Dashboard Metrics & Analytics
// @route   GET /api/v1/dashboard/public
exports.getPublicDashboard = async (req, res, next) => {
  try {
    const totalReports = await Report.countDocuments();
    const openReports = await Report.countDocuments({
      status: { $in: ['reported', 'verified', 'assigned', 'fixing', 'reopened'] },
    });
    const verifiedAwaitingAssignment = await Report.countDocuments({ status: 'verified' });
    const inProgress = await Report.countDocuments({ status: 'fixing' });
    const resolved = await Report.countDocuments({ status: 'resolved' });
    const criticalOpen = await Report.countDocuments({
      priority: 'critical',
      status: { $in: ['reported', 'verified', 'assigned', 'fixing', 'reopened'] },
    });

    // Recent public reports
    const recentReports = await Report.find({ status: { $ne: 'rejected' } })
      .populate('reporter', 'name department')
      .sort('-createdAt')
      .limit(6);

    // Category breakdown
    const categoryStats = await Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Building/Location breakdown
    const buildingStats = await Report.aggregate([
      { $group: { _id: '$building', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // Status breakdown
    const statusStats = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Mapped reports (with coordinates)
    const mapReports = await Report.find({
      'coordinates.lat': { $ne: null },
      'coordinates.lng': { $ne: null },
      status: { $ne: 'rejected' },
    }).select('title category building locationDetail priority status coordinates createdAt');

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalReports,
          openReports,
          verifiedAwaitingAssignment,
          inProgress,
          resolved,
          criticalOpen,
        },
        recentReports,
        categoryStats,
        buildingStats,
        statusStats,
        mapReports,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student Dashboard
// @route   GET /api/v1/dashboard/student
exports.getStudentDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const myReports = await Report.find({ reporter: userId }).sort('-createdAt');
    const myVotes = await VerificationVote.find({ user: userId }).select('report voteType');
    const votedReportIds = myVotes.map((v) => v.report);

    const verifiedByMe = await Report.find({ _id: { $in: votedReportIds } })
      .populate('reporter', 'name department')
      .sort('-createdAt');

    const awaitingVerification = await Report.find({
      status: 'reported',
      reporter: { $ne: userId },
      _id: { $nin: votedReportIds },
    })
      .populate('reporter', 'name department')
      .sort('-createdAt')
      .limit(10);

    const counts = {
      submitted: myReports.length,
      resolved: myReports.filter((r) => r.status === 'resolved').length,
      inProgress: myReports.filter((r) => ['assigned', 'fixing', 'verified'].includes(r.status)).length,
      votesGiven: myVotes.length,
    };

    res.status(200).json({
      success: true,
      data: {
        counts,
        myReports,
        verifiedByMe,
        awaitingVerification,
        userReputation: req.user.reputation,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Maintenance Staff Dashboard
// @route   GET /api/v1/dashboard/staff
exports.getStaffDashboard = async (req, res, next) => {
  try {
    const staffId = req.user._id;

    const assignedTasks = await Report.find({
      assignedStaff: staffId,
      status: { $in: ['assigned', 'fixing', 'reopened'] },
    })
      .populate('reporter', 'name department email')
      .sort('priority -createdAt');

    const completedTasks = await Report.find({
      assignedStaff: staffId,
      status: 'resolved',
    })
      .populate('reporter', 'name department')
      .sort('-updatedAt')
      .limit(10);

    const now = new Date();
    const overdueTasks = assignedTasks.filter((t) => t.expectedResolutionTime && new Date(t.expectedResolutionTime) < now);
    const criticalTasks = assignedTasks.filter((t) => t.priority === 'critical');

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAssigned: assignedTasks.length,
          overdueCount: overdueTasks.length,
          criticalCount: criticalTasks.length,
          completedCount: completedTasks.length,
        },
        assignedTasks,
        completedTasks,
        overdueTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Administrator Dashboard
// @route   GET /api/v1/dashboard/admin
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const pendingVerification = await Report.find({ status: 'reported' })
      .populate('reporter', 'name department')
      .sort('-verificationCount -createdAt');

    const unassignedVerified = await Report.find({ status: 'verified', assignedStaff: null })
      .populate('reporter', 'name department')
      .sort('priority -createdAt');

    const criticalReports = await Report.find({
      priority: 'critical',
      status: { $in: ['reported', 'verified', 'assigned', 'fixing', 'reopened'] },
    }).populate('reporter', 'name department').populate('assignedStaff', 'name');

    const now = new Date();
    const overdueReports = await Report.find({
      status: { $in: ['assigned', 'fixing'] },
      expectedResolutionTime: { $lt: now },
    }).populate('assignedStaff', 'name email').populate('reporter', 'name');

    const flaggedReports = await Report.find({
      $or: [{ flagCount: { $gt: 0 } }, { isFlaggedForAbuse: true }],
    }).populate('reporter', 'name email');

    // Maintenance staff list with current workload
    const staffMembers = await User.find({ role: { $in: ['staff', 'admin'] } }).select('name email role department');
    const staffWorkload = await Promise.all(
      staffMembers.map(async (staff) => {
        const activeTasks = await Report.countDocuments({
          assignedStaff: staff._id,
          status: { $in: ['assigned', 'fixing', 'reopened'] },
        });
        const completedTasks = await Report.countDocuments({
          assignedStaff: staff._id,
          status: 'resolved',
        });
        return {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          department: staff.department,
          activeTasks,
          completedTasks,
        };
      })
    );

    const recentAuditLogs = await AuditLog.find()
      .populate('performedBy', 'name role')
      .sort('-createdAt')
      .limit(10);

    const totalUsers = await User.countDocuments();
    const totalReports = await Report.countDocuments();
    const totalResolved = await Report.countDocuments({ status: 'resolved' });

    res.status(200).json({
      success: true,
      data: {
        counts: {
          pendingVerification: pendingVerification.length,
          unassignedVerified: unassignedVerified.length,
          criticalReports: criticalReports.length,
          overdueReports: overdueReports.length,
          flaggedReports: flaggedReports.length,
          totalUsers,
          totalReports,
          totalResolved,
        },
        pendingVerification: pendingVerification.slice(0, 10),
        unassignedVerified: unassignedVerified.slice(0, 10),
        criticalReports,
        overdueReports,
        flaggedReports,
        staffWorkload,
        recentAuditLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};
