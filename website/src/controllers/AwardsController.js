const DatabaseService = require('../services/DatabaseService');

class AwardsController {
  constructor() {
    this.dbService = new DatabaseService();
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
}

module.exports = AwardsController;