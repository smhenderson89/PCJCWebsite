/* Controllers are for handling HTTP requests and responses */

const DatabaseService = require('../services/AwardServices');
const MeasurementFormatter = require('../services/MeasurementFormatter');

class AwardsController {
  constructor() {
    this.dbService = new DatabaseService();
  }

  // API endpoint to get all awards
  async getAwardCounts(req, res) {
    try {
      const counts = this.dbService.getAwardCountsByYear();
      res.json({ success: true, data: counts });
    } catch (error) {
      console.error('Error getting awards:', error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load awards' 
      });
    }
  }

  // API endpoint to get awards counts by event(day) for a specific year
  async groupAwardsByDayForYear(req, res) {
    const year = parseInt(req.params.year, 10);
    if (isNaN(year)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid year parameter' 
      });
    }
    try {
      const awards = this.dbService.getAwardsCountsByDayForYear(year);
      res.json({ success: true, data: awards });
    } catch (error) {
      console.error(`Error getting awards for year ${year}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load awards for the specified year' 
      });
    }
  }

  // API endpoint to get awards for a specific year
  async getAwardsByYear(req, res) {
    const year = parseInt(req.params.year, 10);
    if (isNaN(year)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid year parameter' 
      });
    }

    try {
      const awards = this.dbService.getAwardsByYear(year);
      // const formattedAwards = MeasurementFormatter.formatAwardsArray(awards);
      res.json({ success: true, data: awards });
    } catch (error) {
      console.error(`Error getting awards for year ${year}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load awards for the specified year' 
      });
    }
  }

  // API endpoint to get award by award number for a specific year
  async getDetailedAwardInfo(req, res) {
    // Check if session storage already exists for this year/awardNum?
    
    // If yes, then use the sesison data to reurn the specific award info
    
    // If no, then fetch from API

    const year = parseInt(req.params.year, 10);
    const awardNum = req.params.awardNum;
    if (isNaN(year) || !awardNum) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid year or award number parameter' 
      });
    }

    try {
      const awards = this.dbService.getAwardsByYear(year);
      const award = awards.find(a => a.awardNum === awardNum);
      if (award) {
        res.json({ success: true, data: award });
      } else {
        res.status(404).json({ 
          success: false,
          error: 'Award not found' 
        });
      }
    } catch (error) {
      console.error(`Error getting award number ${awardNum} for year ${year}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load award for the specified year and award number' 
      });
    }
  }
  // API endpoint to get awards by day
  async getAwardsByDay(req, res) {
    try {
      const awardsByDay = this.dbService.getAwardsGroupedByDay();
      res.json({ success: true, data: awardsByDay });
    } catch (error) {
      console.error('Error getting awards by day:', error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load awards by day' 
      });
    }
  }

  // API endpoint to get all awards
  async getAllAwards(req, res) {
    try {
      const awards = this.dbService.getAllAwards();
      const formattedAwards = MeasurementFormatter.formatAwardsArray(awards);
      res.json({
        success: true,
        count: formattedAwards.length,
        data: formattedAwards
      });
    } catch (error) {
      console.error('Error getting awards:', error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load awards' 
      });
    }
  }

  // API endpoint to get awards by day for a specific year
  async getAwardsByDayForYear(req, res) {
    const year = parseInt(req.params.year, 10);
    const day = req.params.day;
    
    if (isNaN(year)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid year parameter' 
      });
    }

    try {
      const awards = this.dbService.getAwardsByDayForYear(year, day);
      const formattedAwards = MeasurementFormatter.formatAwardsArray(awards);
      res.json({ success: true, data: formattedAwards });
    } catch (error) {
      console.error(`Error getting awards for year ${year}, day ${day}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load awards for the specified day' 
      });
    }
  }

  // Close database connection when done
  close() {
    this.dbService.close();
  }
}

module.exports = AwardsController;