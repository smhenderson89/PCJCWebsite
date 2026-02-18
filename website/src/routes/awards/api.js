const express = require('express');
const router = express.Router();
const AwardsController = require('../../controllers/AwardsController');

const awardsController = new AwardsController();

// Middleware to explicitly disable CSP for all API routes
router.use('/api', (req, res, next) => {
  // Force remove CSP headers for all API endpoints
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  
  // Set CORS headers to be permissive for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  console.log(`🔧 API request to ${req.path} - CSP forcibly disabled`);
  next();
});

// API routes - return JSON data

// All awards
router.get('/api/all-awards', awardsController.getAllAwards.bind(awardsController));

// Award counts by year
router.get('/api/awards-count', awardsController.getAwardCounts.bind(awardsController));

// Awards for a specific year
router.get('/api/awards/:year', awardsController.getAwardsByYear.bind(awardsController));

// Award detailed information for a specific award number from a specific year
router.get('/api/awards/:year/:awardNum', awardsController.getDetailedAwardInfo.bind(awardsController));

// Awards grouped by day
router.get('/api/awards-by-day', awardsController.getAwardsByDay.bind(awardsController));

// Awards grouped by a particular exhibitor
router.get('/api/awards-by-exhibitor/:exhibitor', awardsController.getAwardsByExhibitor.bind(awardsController));

// Get info for a specific award by award number
router.get('/api/award/:awardNum', awardsController.getAwardByNumber.bind(awardsController));

// Get info for unique instances of plant details (genus, species, hybrid, cross)
router.get('/api/plant-details/:detail', awardsController.getUniquePlantDetails.bind(awardsController));

// Get counts for unique instances of plant details (genus, species, hybrid, cross)
router.get('/api/plant-details/count/:detail', awardsController.getUniquePlantDetailsCounts.bind(awardsController));

// Award Debug Info

// Get info on all awards for a specific category
router.get('/api/all-awards/:category', awardsController.getAwardsByCategory.bind(awardsController));

module.exports = router;