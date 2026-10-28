const Comment = require('../models/Comment');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const { getIO } = require('../sockets');

// @desc    Get comments for a report
// @route   GET /api/v1/reports/:id/comments
exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ report: req.params.id })
      .populate('user', 'name role department avatar reputation')
      .sort('createdAt');

    res.status(200).json({
      success: true,
      count: comments.length,
      data: { comments },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Post comment or staff note
// @route   POST /api/v1/reports/:id/comments
exports.createComment = async (req, res, next) => {
  try {
    const { content, isStaffNote } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    const comment = await Comment.create({
      report: report._id,
      user: req.user._id,
      content: content.trim(),
      isStaffNote: (req.user.role === 'staff' || req.user.role === 'admin') && Boolean(isStaffNote),
    });

    const populatedComment = await Comment.findById(comment._id).populate('user', 'name role department avatar reputation');

    // Notify reporter if not commented by reporter themselves
    if (report.reporter.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: report.reporter,
        sender: req.user._id,
        title: 'New Comment on Your Report',
        message: `${req.user.name} commented on "${report.title}": "${content.slice(0, 50)}..."`,
        type: 'comment',
        report: report._id,
      });
    }

    // Socket emission
    const io = getIO();
    if (io) {
      io.to(`report:${report._id}`).emit('comment:new', populatedComment);
    }

    res.status(201).json({
      success: true,
      data: { comment: populatedComment },
    });
  } catch (error) {
    next(error);
  }
};
