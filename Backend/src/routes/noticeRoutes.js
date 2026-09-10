// src/routes/noticeRoutes.js
const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');

// GET /api/notices/:city
router.get('/:city', noticeController.getNoticesByCity);

// POST /api/notices/generate/:complaintId
// (not in the original contract table, but needed to actually create a Notice)
router.post('/generate/:complaintId', noticeController.generateNotice);

module.exports = router;