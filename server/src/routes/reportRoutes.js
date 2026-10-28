const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const {
  getReports,
  getReportById,
  checkDuplicates,
  createReport,
  verifyReport,
  reviewReport,
  assignReport,
  updateReportStatus,
  reopenReport,
  mergeDuplicate,
} = require('../controllers/reportController');

// Public route to list and view reports
router.get('/', getReports);
router.get('/check-duplicates', checkDuplicates);
router.get('/:id', (req, res, next) => {
  // Optional auth check for getting personal vote status
  if (req.cookies?.token || req.headers?.authorization) {
    return protect(req, res, () => getReportById(req, res, next));
  }
  return getReportById(req, res, next);
});

// Protected routes
router.post('/', protect, upload.array('images', 5), createReport);
router.post('/:id/verify', protect, verifyReport);
router.post('/:id/reopen', protect, reopenReport);

// Staff and Admin routes
router.post('/:id/status', protect, upload.array('evidenceImages', 4), updateReportStatus);

// Admin only routes
router.post('/:id/review', protect, authorize('admin'), reviewReport);
router.post('/:id/assign', protect, authorize('admin'), assignReport);
router.post('/:id/merge', protect, authorize('admin'), mergeDuplicate);

module.exports = router;
