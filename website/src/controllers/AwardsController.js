/* Controllers are for handling HTTP requests and responses */

const DatabaseService = require('../services/DatabaseService');

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
      res.json({ success: true, data: awards });
    } catch (error) {
      console.error(`Error getting awards for year ${year}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load awards for the specified year' 
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
      res.json({
        success: true,
        count: awards.length,
        data: awards
      });
    } catch (error) {
      console.error('Error getting awards:', error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load awards' 
      });
    }
  }

  // Close database connection when done
  close() {
    this.dbService.close();
  }
}

module.exports = AwardsController;