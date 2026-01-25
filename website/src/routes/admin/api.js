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

module.exports = router;
