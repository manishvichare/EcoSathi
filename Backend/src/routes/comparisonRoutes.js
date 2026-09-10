// src/routes/comparisonRoutes.js
const express = require('express');
const router = express.Router();
const comparisonController = require('../controllers/comparisonController');

// GET /api/compare?cities=a,b
router.get('/', comparisonController.compareCities);

module.exports = router;