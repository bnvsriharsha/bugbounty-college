const express = require('express');
const router = express.Router();
const {
  getPublicDashboard,
  getStudentDashboard,
  getStaffDashboard,
  getAdminDashboard,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.get('/public', getPublicDashboard);
router.get('/student', protect, getStudentDashboard);
router.get('/staff', protect, authorize('staff', 'admin'), getStaffDashboard);
router.get('/admin', protect, authorize('admin'), getAdminDashboard);

module.exports = router;
