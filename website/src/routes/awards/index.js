// Awards page routes - EJS templates
const express = require('express');
const DatabaseService = require('../../services/AwardServices');
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
    const year = parseInt(req.params.year, 10);
    
    // Validate year
    if (isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
      return res.status(404).json({ 
        success: false,
        error: `Invalid year: ${req.params.year}`
      });
    }

    // Just render the template with the year - let client-side load data
    res.render('pages/awardsYear', { 
      title: `${year} Awards - Pacific Central Judging Center`,
      year: year,
      awards: [] // Empty - will be loaded client-side
    });
  } catch (error) {
    console.error('Error rendering awards year page:', error);
    res.status(500).json({ 
      success: false,
      error: `Unable to load awards page for ${req.params.year}`
    });
  }
});


// Individual award detailed page - serves template for client-side data fetching
router.get('/award/:year/:awardNum', (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    const awardNum = req.params.awardNum;
    
    // Check if there's an error parameter from client-side
    if (req.query.error) {
      return res.render('pages/awardDetailed', {
        title: 'Award Not Found - Pacific Central Judging Center',
        year: year,
        awardNum: awardNum,
        award: null,
        error: req.query.error
      });
    }
    
    // Check if client-side data is being passed back
    if (req.query.data && req.query.source) {
      try {
        const awardData = JSON.parse(atob(req.query.data));
        return res.render('pages/awardDetailed', {
          title: `Award #${awardNum} (${year}) - Pacific Central Judging Center`,
          year: year,
          awardNum: awardNum,
          award: awardData,
          dataSource: req.query.source,
          error: null
        });
      } catch (error) {
        console.error('Error parsing client-side award data:', error);
        return res.render('pages/awardDetailed', {
          title: 'Award Not Found - Pacific Central Judging Center',
          year: year,
          awardNum: awardNum,
          award: null,
          error: 'Failed to parse award data'
        });
      }
    }
    
    // Validate year
    if (isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
      return res.status(404).render('pages/awardDetailed', {
        title: 'Award Not Found - Pacific Central Judging Center',
        year: year,
        awardNum: awardNum,
        award: null,
        error: `Invalid year: ${req.params.year}`
      });
    }

    // Validate award number format (should start with year)
    if (!awardNum || !awardNum.startsWith(year.toString())) {
      return res.status(404).render('pages/awardDetailed', {
        title: 'Award Not Found - Pacific Central Judging Center',
        year: year,
        awardNum: awardNum,
        award: null,
        error: `Invalid award number: ${awardNum}`
      });
    }

    // Serve template for client-side data fetching
    res.render('pages/awardDetailed', {
      title: `Loading Award #${awardNum} (${year}) - Pacific Central Judging Center`,
      year: year,
      awardNum: awardNum,
      award: null, // Client-side will populate
      dataSource: 'loading',
      error: null
    });
    
  } catch (error) {
    console.error('Error rendering award detailed page:', error);
    res.status(500).render('pages/awardDetailed', {
      title: 'Error - Pacific Central Judging Center',
      year: req.params.year,
      awardNum: req.params.awardNum,
      award: null,
      error: 'Unable to load award details'
    });
  }
});

// Counts of awards by day/event for a specific year
router.get('/awards/:year/events', (req, res) => {
  try {
    const year = req.params.year;
    const awardsByDay = dbService.getAwardsByDayForYear(year);
    res.render('pages/awardsByDay', { 
      title: `Awards by Day for ${year} - Pacific Central Judging Center`,
      awardsByDay: awardsByDay,
      year: year
    });
  } catch (error) {
    console.error('Error getting awards by day for year:', error);
    res.status(500).json({ 
      success: false,
      error: `Unable to load awards by day for ${req.params.year}`
    });
  }
});

// Exhibitor-specific awards page
router.get('/awards/exhibitor/:exhibitor', (req, res) => {
  try {
    const exhibitor = req.params.exhibitor;
    const awardsByExhibitor = dbService.getAwardsByExhibitor(exhibitor);

    res.render('pages/exhibitor', { 
      title: `Awards for Exhibitor ${exhibitor} - Pacific Central Judging Center`,
      awards: awardsByExhibitor,
      exhibitor: exhibitor
    });

  } catch (error) {
    console.error('Error getting awards by exhibitor:', error);
    res.status(500).json({ 
      success: false,
      error: `Unable to load awards for exhibitor ${req.params.exhibitor}`
    });
  }
});


module.exports = router;