/* Routes for admin operations */

const express = require('express');
const AdminController = require('../../controllers/AdminController');
const router = express.Router();

// Initialize admin controller
const adminController = new AdminController();

// Route to get all exhibitors
router.get('/api/exhibitors', adminController.getExhibitorsList.bind(adminController));

// Route to get awards for a specific exhibitor
router.get('/api/exhibitor/:exhibitor/awards', adminController.getAwardsByExhibitor.bind(adminController));

// Route to get award counts by exhibitor
router.get('/api/exhibitor/counts', adminController.getAwardCountsByExhibitor.bind(adminController));

// Route to get award types list
router.get('/api/award-types', adminController.getAwardTypesList.bind(adminController));

// Combined route to get all submit form data using Promise.all
router.get('/api/submit-prep', adminController.getPrepareSubmitData.bind(adminController));



module.exports = router;
