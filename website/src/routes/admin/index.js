// Admin page routes - EJS templates
const express = require('express');
const AdminServices = require('../../services/DatabaseService');
const router = express.Router();

// Initialize admin services
const adminService = new AdminServices();

// Rendering pages for admin panel 
router.get('/submit', (req, res) => {
    try {
        const exhibitors = adminService.getExhibitorsList();
        res.render('/submit', {
            title: 'Submit Award - Pacific Central Judging Center',
            exhibitors: exhibitors
        });
    } catch (error) {
        console.error('Error loading submit page:', error);
        res.status(500).render('pages/error', {
            title: 'Error - Pacific Central Judging Center',
            error: 'Unable to load submit page'
        })
    }
});

// TODO: Add in admin panel for entering in awards

module.exports = router;