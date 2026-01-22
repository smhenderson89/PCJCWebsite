const express = require('express');
const router = express.Router();

// Static pages that don't need database access
router.get('/about', (req, res) => {
  res.render('pages/about', { 
    title: 'About Pacific Central Judging Center' 
  });
});

router.get('/personnel', (req, res) => {
  res.render('pages/personnel', { 
    title: 'Personnel - Pacific Central Judging Center' 
  });
});

router.get('/calendar', (req, res) => {
  res.render('pages/calendar', { 
    title: 'Calendar - Pacific Central Judging Center' 
  });
});

module.exports = router;