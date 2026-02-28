/* Routes for admin operations */

const express = require('express');
const AdminController = require('../../controllers/AdminController');
const router = express.Router();

// Initialize admin controller
const adminController = new AdminController();

// Middleware to explicitly disable CSP for all API routes
router.use('/api', (req, res, next) => {
  // Force remove CSP headers for all API endpoints
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
  
  // Set CORS headers to be permissive for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  next();
});

// Route to get all exhibitors
router.get('/api/exhibitors', adminController.getExhibitorsList.bind(adminController));

// Route to get awards for a specific exhibitor
router.get('/api/exhibitor/:exhibitor/awards', adminController.getAwardsByExhibitor.bind(adminController));

// Route to get award counts by exhibitor
router.get('/api/exhibitor/counts', adminController.getAwardCountsByExhibitor.bind(adminController));

// Route to get award types list
router.get('/api/award-types', adminController.getAwardTypesList.bind(adminController));

// Route to get all the previous event names
router.get('/api/event-names', adminController.getEventNamesList.bind(adminController));

// Route to get all the previous award numbers
router.get('/api/award-numbers', adminController.getAwardNumbersList.bind(adminController));

// Route to get all previous photographers
router.get('/api/photographers', adminController.getPhotographersList.bind(adminController));

// Route to get all awards missing an image
router.get('/api/missing-image', adminController.getAwardsMissingImage.bind(adminController));

// Route to get all awards with a null value in a field
router.get('/api/null-awards/:category', adminController.getAwardsWithNullValues.bind(adminController));

// Route to get all awards that reference another award in the description field, check it is displaying properly in the admin panel
router.get('/api/awards-linking', adminController.getAwardsReferencingAwards.bind(adminController));

// Combined route to get all submit form data using Promise.all
router.get('/api/submit-prep', adminController.getPrepareSubmitData.bind(adminController));



module.exports = router;
