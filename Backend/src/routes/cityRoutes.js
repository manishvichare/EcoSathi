// src/routes/cityRoutes.js
const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');

// GET /api/cities  (optional helper, not in the original contract)
router.get('/', cityController.getAllCities);

// GET /api/cities/:name
router.get('/:name', cityController.getCityByName);

module.exports = router;
