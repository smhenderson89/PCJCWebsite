const express = require('express');
const router = express.Router();

// Static pages that don't need database access

// About page
router.get('/about', (req, res) => {
  res.render('pages/resources/about', { 
    title: 'About Pacific Central Judging Center' 
  });
});

// Personnel page
router.get('/personnel', (req, res) => {
  res.render('pages/resources/personnel', { 
    title: 'Personnel - Pacific Central Judging Center' 
  });
});

// Donate Page
router.get('/donate', (req, res) => {
  res.render('pages/resources/donate', { 
    title: 'Donate - Pacific Central Judging Center' 
  });
});

// Location page
router.get('/location', (req, res) => {
  res.render('pages/attend/location', { 
    title: 'Location - Pacific Central Judging Center' 
  });
});

// Calendar page (may need database access in the future)
router.get('/calendar', (req, res) => {
  res.render('pages/attend/calendar', { 
    title: 'Calendar - Pacific Central Judging Center' 
  });
});

// Login page
router.get('/login', (req, res) => {
  res.render('pages/admin/login', { 
    title: 'Login - Pacific Central Judging Center' 
  });
});


module.exports = router;