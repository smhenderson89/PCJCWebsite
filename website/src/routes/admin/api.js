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

// Combined route to get all submit form data using Promise.all
router.get('/api/submit-prep', adminController.getPrepareSubmitData.bind(adminController));

module.exports = router;
