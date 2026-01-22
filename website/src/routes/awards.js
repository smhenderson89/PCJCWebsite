const express = require('express');
const router = express.Router();
const AwardsController = require('../controllers/AwardsController');

const awardsController = new AwardsController();

// API route to get all awards
router.get('/api/awards', awardsController.getAwardCounts.bind(awardsController));
router.get('/api/awards/:year', awardsController.getAwardsByYear.bind(awardsController));

module.exports = router;