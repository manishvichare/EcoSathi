const express = require('express');
const router = express.Router();
const suggestionController = require('../controllers/suggestionController');

router.get('/:city', suggestionController.getSuggestions);

module.exports = router;
