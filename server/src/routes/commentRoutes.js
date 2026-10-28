const express = require('express');
const router = express.Router({ mergeParams: true });
const { getComments, createComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.get('/', getComments);
router.post('/', protect, createComment);

module.exports = router;
