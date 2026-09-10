// src/routes/environmentRoutes.js
const express = require('express');
const router = express.Router();
const environmentController = require('../controllers/environmentController');

// GET /api/environment/:city/aqi  → fast-path, returns AQI + weather only (~1-2 s)
router.get('/:city/aqi', environmentController.getAqiOnly);

// GET /api/environment/:city/today → full data: AQI + green cover + health score (~2-4 s)
router.get('/:city/today', environmentController.getTodayData);

// GET /api/environment/:city/history?range=30d
router.get('/:city/history', environmentController.getHistory);

module.exports = router;