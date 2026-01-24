const express = require('express');
const router = express.Router();
const AwardsController = require('../../controllers/AwardsController');

const awardsController = new AwardsController();

// API routes - return JSON data
router.get('/api/awards-count', awardsController.getAwardCounts.bind(awardsController));
router.get('/api/awards/:year', awardsController.getAwardsByYear.bind(awardsController));
router.get('/api/awards-by-day', awardsController.getAwardsByDay.bind(awardsController));
router.get('/api/all-awards', awardsController.getAllAwards.bind(awardsController));

module.exports = router;