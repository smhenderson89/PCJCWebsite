const express = require('express');
const router = express.Router();
const AwardsController = require('../../controllers/AwardsController');

const awardsController = new AwardsController();

// API routes - return JSON data

// All awards
router.get('/api/all-awards', awardsController.getAllAwards.bind(awardsController));

// Award counts by year
router.get('/api/awards-count', awardsController.getAwardCounts.bind(awardsController));

// Awards for a specific year
router.get('/api/awards/:year', awardsController.getAwardsByYear.bind(awardsController));

// Awards counts per Judging Day for a specific year
router.get('/api/awards/:year/events', awardsController.getAwardsByDayForYear.bind(awardsController));

// Awards grouped by day
router.get('/api/awards-by-day', awardsController.getAwardsByDay.bind(awardsController));


module.exports = router;