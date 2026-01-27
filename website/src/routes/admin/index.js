// Admin page routes - EJS templates
const express = require('express');
const AdminServices = require('../../services/AdminServices');
const router = express.Router();

// Initialize admin services
const adminService = new AdminServices();

// Get list of previous award types
router.get('/award-types', (req, res) => {
  try {
    const awardTypes = adminService.getAwardTypesList();
  } catch (error) {
    console.error('Error getting award types:', error);
  }
});

// Rendering pages for admin panel 
router.get('/submit', async (req, res) => {
    try {
        // Use Promise.all to fetch data from both sources simultaneously
        const [exhibitors, awardTypes] = await Promise.all([
            Promise.resolve(adminService.getExhibitorsList()),
            Promise.resolve(adminService.getAwardTypesList())
        ]);

        res.render('pages/submit', {
            title: 'Submit Award - Pacific Central Judging Center',
            exhibitors: exhibitors,
            awardTypes: awardTypes,
            loadedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error loading submit page:', error);
        res.status(500).render('pages/error', {
            title: 'Error - Pacific Central Judging Center',
            error: 'Unable to load submit page'
        });
    }
});

// TODO: Add in admin panel for entering in awards

module.exports = router;