// Admin page routes - EJS templates
const express = require('express');
const AdminServices = require('../../services/DatabaseService');
const router = express.Router();

// Initialize admin services
const adminService = new AdminServices();

// Rendering pages for admin panel 

// TODO: Add in admin panel for entering in awards

module.exports = router;