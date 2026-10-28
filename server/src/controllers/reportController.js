const Report = require('../models/Report');
const VerificationVote = require('../models/VerificationVote');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { emitReportUpdate, emitNotification } = require('../sockets');

// Helper to calculate SLA expiry
const calculateSLA = (priority) => {
  const hours = priority === 'critical' ? 12 : priority === 'high' ? 24 : priority === 'medium' ? 48 : 72;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

// @desc    Get all reports (with filters, pagination, search)
// @route   GET /api/v1/reports
exports.getReports = async (req, res, next) => {
  try {
    const { status, category, building, priority, search, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (building && building !== 'all') {
      query.building = building;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (search) {
      query.$text = { $search: search };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate('reporter', 'name email department reputation')
      .populate('assignedStaff', 'name email department')
      .populate('duplicateOf', 'title status')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single report by ID
// @route   GET /api/v1/reports/:id
exports.getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name email department reputation')
      .populate('assignedStaff', 'name email department')
      .populate('resolutionEvidence.completedBy', 'name email')
      .populate('reopenHistory.reopenedBy', 'name email')
      .populate('duplicateOf', 'title status');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Check if the current user has verified or flagged this report
    let userVote = null;
    if (req.user) {
      userVote = await VerificationVote.findOne({ report: report._id, user: req.user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        report,
        userVote: userVote ? userVote.voteType : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check for similar reports (Duplicate detection)
// @route   GET /api/v1/reports/check-duplicates
exports.checkDuplicates = async (req, res, next) => {
  try {
    const { title, category, building } = req.query;
    if (!title || !category || !building) {
      return res.status(200).json({ success: true, data: { similarReports: [] } });
    }

    // Find reports in same category and building that are still open
    const openStatuses = ['reported', 'verified', 'assigned', 'fixing', 'reopened'];
    const candidates = await Report.find({
      category,
      building,
      status: { $in: openStatuses },
    }).select('title description building locationDetail status createdAt');

    // Simple keyword similarity
    const titleWords = title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const matches = candidates.filter((c) => {
      const cTitle = c.title.toLowerCase();
      return titleWords.some((w) => cTitle.includes(w));
    });

    res.status(200).json({
      success: true,
      data: { similarReports: matches.slice(0, 5) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new report
// @route   POST /api/v1/reports
exports.createReport = async (req, res, next) => {
  try {
    const { title, description, category, building, locationDetail, suggestedSeverity, coordinates } = req.body;

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        images.push({
          url: file.path ? (file.path.startsWith('http') ? file.path : `/uploads/${file.filename}`) : '',
          publicId: file.filename || '',
        });
      }
    }

    // Priority starts initialized to suggestedSeverity pending admin review
    const priority = suggestedSeverity || 'medium';

    const report = await Report.create({
      title,
      description,
      category,
      building,
      locationDetail,
      coordinates: coordinates ? JSON.parse(coordinates) : { lat: null, lng: null },
      images,
      reporter: req.user._id,
      suggestedSeverity: priority,
      priority,
      status: 'reported',
      history: [
        {
          fromStatus: null,
          toStatus: 'reported',
          actor: req.user._id,
          actorName: req.user.name,
          actorRole: req.user.role,
          note: 'Initial report submitted',
          timestamp: new Date(),
        },
      ],
    });

    // Award reputation points for submitting genuine report
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { reportsSubmitted: 1, reputation: 5 },
    });

    // Notify administrators of new report
    emitReportUpdate(report);

    res.status(201).json({
      success: true,
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify or flag a report (Atomic anti-abuse voting)
// @route   POST /api/v1/reports/:id/verify
exports.verifyReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Anti-abuse: cannot verify own report
    if (report.reporter.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot verify or flag your own report.',
      });
    }

    const { voteType = 'confirm', reason = '' } = req.body;

    // Check existing vote
    const existingVote = await VerificationVote.findOne({
      report: report._id,
      user: req.user._id,
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Toggle/withdraw vote
        await VerificationVote.findByIdAndDelete(existingVote._id);
        const incField = voteType === 'confirm' ? { verificationCount: -1 } : { flagCount: -1 };
        const updatedReport = await Report.findByIdAndUpdate(report._id, { $inc: incField }, { new: true });
        
        emitReportUpdate(updatedReport);
        return res.status(200).json({
          success: true,
          message: 'Vote withdrawn',
          data: { report: updatedReport, userVote: null },
        });
      } else {
        // Switch vote type atomically
        existingVote.voteType = voteType;
        existingVote.reason = reason;
        await existingVote.save();

        const updateDoc =
          voteType === 'confirm'
            ? { $inc: { verificationCount: 1, flagCount: -1 } }
            : { $inc: { verificationCount: -1, flagCount: 1 } };

        const updatedReport = await Report.findByIdAndUpdate(report._id, updateDoc, { new: true });
        emitReportUpdate(updatedReport);
        return res.status(200).json({
          success: true,
          message: 'Vote updated',
          data: { report: updatedReport, userVote: voteType },
        });
      }
    }

    // Create new vote atomically
    await VerificationVote.create({
      report: report._id,
      user: req.user._id,
      voteType,
      reason,
    });

    // Update counts & check auto-verification threshold
    const incField = voteType === 'confirm' ? { verificationCount: 1 } : { flagCount: 1 };
    let updatedReport = await Report.findByIdAndUpdate(report._id, { $inc: incField }, { new: true });

    // If community verification threshold reached (e.g. 3 confirms) and currently reported
    if (voteType === 'confirm' && updatedReport.verificationCount >= 3 && updatedReport.status === 'reported') {
      updatedReport.status = 'verified';
      updatedReport.history.push({
        fromStatus: 'reported',
        toStatus: 'verified',
        actor: req.user._id,
        actorName: 'Community Verification Engine',
        actorRole: 'system',
        note: `Reached community verification threshold (${updatedReport.verificationCount} votes)`,
        timestamp: new Date(),
      });
      await updatedReport.save();

      // Notify reporter
      await Notification.create({
        recipient: updatedReport.reporter,
        sender: req.user._id,
        title: 'Report Verified!',
        message: `Your report "${updatedReport.title}" reached community consensus and is now marked Verified.`,
        type: 'verified',
        report: updatedReport._id,
      });
    }

    if (voteType === 'confirm') {
      await User.findByIdAndUpdate(req.user._id, { $inc: { reportsVerified: 1, reputation: 2 } });
    }

    emitReportUpdate(updatedReport);

    res.status(200).json({
      success: true,
      message: voteType === 'confirm' ? 'Report verified successfully' : 'Report flagged for review',
      data: { report: updatedReport, userVote: voteType },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Review/Verify/Reject or Update Priority
// @route   POST /api/v1/reports/:id/review
exports.reviewReport = async (req, res, next) => {
  try {
    const { action, priority, rejectionReason } = req.body; // action: 'approve', 'reject'
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const previousStatus = report.status;

    if (action === 'reject') {
      report.status = 'rejected';
      report.rejectionReason = rejectionReason || 'Does not comply with campus policy';
      report.history.push({
        fromStatus: previousStatus,
        toStatus: 'rejected',
        actor: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        note: `Rejected by Admin: ${report.rejectionReason}`,
        timestamp: new Date(),
      });

      await Notification.create({
        recipient: report.reporter,
        sender: req.user._id,
        title: 'Report Rejected',
        message: `Your report "${report.title}" was rejected: ${report.rejectionReason}`,
        type: 'rejected',
        report: report._id,
      });
    } else {
      // Approve/Verify
      report.status = 'verified';
      if (priority) report.priority = priority;
      report.history.push({
        fromStatus: previousStatus,
        toStatus: 'verified',
        actor: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        note: `Approved & Prioritized (${report.priority}) by Administrator`,
        timestamp: new Date(),
      });

      await Notification.create({
        recipient: report.reporter,
        sender: req.user._id,
        title: 'Report Approved by Admin',
        message: `Your report "${report.title}" has been verified and set to ${report.priority} priority.`,
        type: 'verified',
        report: report._id,
      });
    }

    await report.save();

    // Audit log
    await AuditLog.create({
      action: `REPORT_REVIEW_${action.toUpperCase()}`,
      performedBy: req.user._id,
      targetType: 'Report',
      targetId: report._id,
      details: { action, priority, rejectionReason },
    });

    emitReportUpdate(report);

    res.status(200).json({ success: true, data: { report } });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Assign issue to staff
// @route   POST /api/v1/reports/:id/assign
exports.assignReport = async (req, res, next) => {
  try {
    const { staffId, priority } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const staff = await User.findById(staffId);
    if (!staff || (staff.role !== 'staff' && staff.role !== 'admin')) {
      return res.status(400).json({ success: false, message: 'Invalid maintenance staff selected' });
    }

    const previousStatus = report.status;
    report.status = 'assigned';
    report.assignedStaff = staff._id;
    report.assignedAt = new Date();
    if (priority) report.priority = priority;
    report.expectedResolutionTime = calculateSLA(report.priority);

    report.history.push({
      fromStatus: previousStatus,
      toStatus: 'assigned',
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      note: `Assigned to ${staff.name} (${staff.department})`,
      timestamp: new Date(),
    });

    await report.save();

    // Notify staff
    await Notification.create({
      recipient: staff._id,
      sender: req.user._id,
      title: 'New Maintenance Assignment',
      message: `You have been assigned to: "${report.title}" at ${report.building} (${report.locationDetail}).`,
      type: 'assigned',
      report: report._id,
    });

    // Notify reporter
    await Notification.create({
      recipient: report.reporter,
      sender: req.user._id,
      title: 'Report Assigned',
      message: `Your report "${report.title}" is assigned to maintenance staff (${staff.name}).`,
      type: 'assigned',
      report: report._id,
    });

    emitReportUpdate(report);

    res.status(200).json({ success: true, data: { report } });
  } catch (error) {
    next(error);
  }
};

// @desc    Staff: Update work progress / status (e.g., start fixing or complete)
// @route   POST /api/v1/reports/:id/status
exports.updateReportStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Authorization: staff assigned or admin
    const isAssigned = report.assignedStaff && report.assignedStaff.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAssigned && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only assigned staff or administrators can update progress.' });
    }

    const previousStatus = report.status;

    // Check transition validity
    const allowed = {
      assigned: ['fixing', 'rejected'],
      fixing: ['resolved', 'assigned'],
      resolved: ['reopened'],
    };

    if (allowed[previousStatus] && !allowed[previousStatus].includes(status) && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition from ${previousStatus} to ${status}`,
      });
    }

    report.status = status;

    // If resolving, handle evidence
    if (status === 'resolved') {
      const evidenceImages = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          evidenceImages.push({
            url: file.path ? (file.path.startsWith('http') ? file.path : `/uploads/${file.filename}`) : '',
            publicId: file.filename || '',
          });
        }
      }

      report.resolutionEvidence = {
        notes: note || 'Issue repaired and verified on-site.',
        images: evidenceImages,
        completedAt: new Date(),
        completedBy: req.user._id,
      };

      // Notify reporter for resolution confirmation
      await Notification.create({
        recipient: report.reporter,
        sender: req.user._id,
        title: 'Issue Resolved! Please Verify',
        message: `Staff marked "${report.title}" as resolved. Inspect the resolution evidence and confirm or request reopening.`,
        type: 'resolved',
        report: report._id,
      });
    }

    report.history.push({
      fromStatus: previousStatus,
      toStatus: status,
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      note: note || `Status updated to ${status}`,
      timestamp: new Date(),
    });

    await report.save();
    emitReportUpdate(report);

    res.status(200).json({ success: true, data: { report } });
  } catch (error) {
    next(error);
  }
};

// @desc    Reporter/Student: Reopen an issue
// @route   POST /api/v1/reports/:id/reopen
exports.reopenReport = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'A descriptive reason of at least 5 characters is required to reopen.' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'Only resolved reports can be reopened.' });
    }

    const previousStatus = report.status;
    report.status = 'reopened';
    report.reopenHistory.push({
      reason,
      reopenedBy: req.user._id,
      reopenedAt: new Date(),
    });

    report.history.push({
      fromStatus: previousStatus,
      toStatus: 'reopened',
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      note: `Reopened by user: ${reason}`,
      timestamp: new Date(),
    });

    await report.save();

    // Alert staff if assigned
    if (report.assignedStaff) {
      await Notification.create({
        recipient: report.assignedStaff,
        sender: req.user._id,
        title: 'Issue Reopened!',
        message: `Report "${report.title}" was reopened with note: ${reason}`,
        type: 'reopened',
        report: report._id,
      });
    }

    emitReportUpdate(report);

    res.status(200).json({ success: true, data: { report } });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Mark as duplicate and link to canonical report
// @route   POST /api/v1/reports/:id/merge
exports.mergeDuplicate = async (req, res, next) => {
  try {
    const { canonicalReportId, note } = req.body;
    const report = await Report.findById(req.params.id);
    const canonical = await Report.findById(canonicalReportId);

    if (!report || !canonical) {
      return res.status(404).json({ success: false, message: 'Report or Canonical Report not found' });
    }

    if (report._id.toString() === canonical._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot mark a report as duplicate of itself.' });
    }

    const previousStatus = report.status;
    report.status = 'duplicate';
    report.duplicateOf = canonical._id;

    report.history.push({
      fromStatus: previousStatus,
      toStatus: 'duplicate',
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      note: note || `Linked as duplicate of #${canonical._id.toString().slice(-6)}: "${canonical.title}"`,
      timestamp: new Date(),
    });

    await report.save();

    // Transfer verification count credit
    canonical.verificationCount += report.verificationCount;
    await canonical.save();

    emitReportUpdate(report);
    emitReportUpdate(canonical);

    res.status(200).json({ success: true, data: { report } });
  } catch (error) {
    next(error);
  }
};
