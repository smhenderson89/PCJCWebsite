const express = require('express');
const router = express.Router();

// Static pages that don't need database access

// About page
router.get('/about', (req, res) => {
  res.render('pages/about', { 
    title: 'About Pacific Central Judging Center' 
  });
});

// Personnel page
router.get('/personnel', (req, res) => {
  res.render('pages/personnel', { 
    title: 'Personnel - Pacific Central Judging Center' 
  });
});

// Calendar page (may need database access in the future)
router.get('/calendar', (req, res) => {
  res.render('pages/calendar', { 
    title: 'Calendar - Pacific Central Judging Center' 
  });
});

// Links Page

// AOS Judging Request Form





module.exports = router;