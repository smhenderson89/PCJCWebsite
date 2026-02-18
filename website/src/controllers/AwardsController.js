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

      // Check if awards is empty and return 404 if so
      if (!awards || awards.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: `No awards found for year ${year}` 
        });
      }
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

  // API endpoint to get awards by a particular exhibitor
  async getAwardsByExhibitor(req, res) {
    const exhibitor = req.params.exhibitor;
    
    if (!exhibitor) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid exhibitor parameter' 
      });
    }

    try {
      const awards = this.dbService.getAwardsByExhibitor(exhibitor);
      const formattedAwards = MeasurementFormatter.formatAwardsArray(awards);
      res.json({ success: true, data: formattedAwards });
    } catch (error) {
      console.error(`Error getting awards for exhibitor ${exhibitor}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load awards for the specified exhibitor' 
      });
    }
  }

  // API endpoint to get info for a specific award by award number
  async getAwardByNumber(req, res) {
    const awardNum = req.params.awardNum;
    
    if (!awardNum) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid award number parameter' 
      });
    }

    try {
      const awardInfo = this.dbService.getAwardByNumber(awardNum);
      if (awardInfo) {
        const formattedAward = MeasurementFormatter.formatAward(awardInfo);
        res.json({ success: true, data: formattedAward });
      } else {
        res.status(404).json({ 
          success: false,
          error: 'Award not found' 
        });
      }
    } catch (error) {
      console.error(`Error getting award by number ${awardNum}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load award details for the specified award number' 
      });
    }
  } 

  // API endpoint to get unique instances of plant details (genus, species, hybrid, cross)
  async getUniquePlantDetails(req, res) {
    const detail = req.params.detail;
    
    const validDetails = ['genus', 'species', 'clone', 'cross'];
    if (!validDetails.includes(detail)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid detail parameter' 
      });
    }

    try {
      const details = this.dbService.getUniquePlantDetails(detail);
      res.json({ success: true, data: details });
    } catch (error) {
      console.error(`Error getting unique plant details for ${detail}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load unique plant details for the specified category' 
      });
    }
  }

  // API endpoint to get counts for unique instances of plant details (genus, species, hybrid, cross)
  async getUniquePlantDetailsCounts(req, res) {
    const detail = req.params.detail;
    
    const validDetails = ['genus', 'species', 'clone', 'cross'];
    if (!validDetails.includes(detail)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid detail parameter' 
      });
    }

    try {
      const detailsCounts = this.dbService.getUniquePlantDetailsCounts(detail);
      
      // data is being returned as an array of objects with the detail and count, 
      // Convert into an object with key/value pair of the counts to make it easier to process
      const detailsCountsObject = {};
      detailsCounts.forEach(item => {
        detailsCountsObject[item[detail]] = item.count;
      });

      // Organize by count in descending order to make it easier to see which details are most common
      const sortedDetailsCounts = Object.entries(detailsCountsObject).sort((a, b) => b[1] - a[1]);
      const sortedDetailsCountsObject = {};
      sortedDetailsCounts.forEach(item => {
        sortedDetailsCountsObject[item[0]] = item[1];
      });

      res.json({ success: true, data: detailsCountsObject });
    } catch (error) {
      console.error(`Error getting unique plant details counts for ${detail}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load unique plant details counts for the specified category' 
      });
    }
  }

  // API endpoint to get awards by category (for debugging)
  async getAwardsByCategory(req, res) {
    const category = req.params.category;
    
    if (!category) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid category parameter' 
      });
    }

    try {
      const awards = this.dbService.getAllAwards();
      const formattedAwards = MeasurementFormatter.formatAwardsArray(awards);
      console.log(`Filtering awards by category: ${category}`); // Debug

      let categoryInfo = {category: category};
      let characterObject = {}

      // Iterate over the awards and count characters in the specified category to get a sense of how much data is in that category and if there are any anomalies (e.g. extremely long entries that might be causing issues)
      formattedAwards.forEach(award => {
        const categoryValue = award[category];
        if (categoryValue) {
          let characterCount = categoryValue.length;
          if (characterObject[characterCount]) {
            characterObject[characterCount] += characterCount;
          } else {
            characterObject[characterCount] = characterCount;
          }
          categoryInfo.characterCount = characterObject;
        }
      });

      res.json({ success: true, data: categoryInfo });
    } catch (error) {
      console.error(`Error getting awards for category ${category}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'Unable to load awards for the specified category' 
      });
    }
  }

  // Close database connection when done
  close() {
    this.dbService.close();
  }
}

module.exports = AwardsController;