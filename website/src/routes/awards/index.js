// Awards page routes - EJS templates
const express = require('express');
const DatabaseService = require('../../services/DatabaseService');
const router = express.Router();

// Initialize database service
const dbService = new DatabaseService();

// Awards list page with award counts by year
router.get('/awardslist', (req, res) => {
  try {
    const awardCounts = dbService.getAwardCountsByYear();
    res.render('pages/awardslist', { 
      title: 'Awards List - Pacific Central Judging Center',
      awardCounts: awardCounts
    });
  } catch (error) {
    console.error('Error getting award counts:', error);
    res.status(500).render('pages/awardslist', { 
      title: 'Awards List - Pacific Central Judging Center',
      awardCounts: [],
      error: 'Unable to load award counts'
    });
  }
});

// Individual year awards page
router.get('/awards/:year', (req, res) => {
  try {
    const year = req.params.year;
    const awards = dbService.getAwardsByYear(year);
    res.render('pages/awards-year', { 
      title: `${year} Awards - Pacific Central Judging Center`,
      awards: awards,
      year: year
    });
  } catch (error) {
    console.error('Error getting awards for year:', error);
    res.status(500).render('pages/error', { 
      title: 'Error - Pacific Central Judging Center',
      error: `Unable to load awards for ${req.params.year}`
    });
  }
});

module.exports = router;