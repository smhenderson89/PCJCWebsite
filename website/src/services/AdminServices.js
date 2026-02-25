/* Database services act as an interface to the SQLite database for the admin panel */

const Database = require('better-sqlite3');
const path = require('path');

class AdminServices {
  constructor() {
    const dbPath = path.join(__dirname, '..', '..', '..', 'db', 'orchid_awards.sqlite');
    // console.log('Database path:', dbPath); // Debug log
    this.db = new Database(dbPath);
    
    // Enable WAL mode for better performance with concurrent access
    this.db.pragma('journal_mode = WAL');
  }

  /* Exhibitors */

  // Get List of exhibitors
  getExhibitorsList() {
    const stmt = this.db.prepare(`SELECT DISTINCT exhibitor FROM awards ORDER BY exhibitor ASC`);
    const results = stmt.all();
    return results.map(row => row.exhibitor);
  }

  // Get number of awards per exhibitor
  getAwardCountsByExhibitor() {
    const stmt = this.db.prepare(`
      SELECT exhibitor, COUNT(*) as count
      FROM awards
      WHERE exhibitor IS NOT NULL
      GROUP BY exhibitor
      ORDER BY count DESC, exhibitor ASC
    `);
    return stmt.all();
  }

  // Get awards for a specific exhibitor
  getAwardsByExhibitor(exhibitor) {
    const stmt = this.db.prepare(`
      SELECT * FROM awards
      WHERE exhibitor = ?
      ORDER BY year DESC, awardNum ASC
    `);
    return stmt.all(exhibitor);
  }

  // Get list of award types
    getAwardTypesList() {
        const stmt = this.db.prepare(`SELECT DISTINCT award FROM awards ORDER BY award ASC`);
        const results = stmt.all();
        return results.map(row => row.award);
    }

  // Get list of all previous event names
  getEventNamesList() {
      const stmt = this.db.prepare(`SELECT DISTINCT location FROM awards ORDER BY location ASC`);
      const results = stmt.all();
      return results.map(row => row.location);
  }

  // Get list of all previous photographers
  getPhotographersList() {
      const stmt = this.db.prepare(`SELECT DISTINCT photographer FROM awards ORDER BY photographer ASC`);
      const results = stmt.all();
      return results.map(row => row.photographer);
  }

  // Get list of all previous award numbers
  getAwardNumbersList() {
      const stmt = this.db.prepare(`SELECT DISTINCT awardNum FROM awards ORDER BY awardNum ASC`);
      const results = stmt.all();
      return results.map(row => row.awardNum);
  }

  // Get list of awards missing an image
  getAwardsMissingImage() {
      const stmt = this.db.prepare(`SELECT * FROM awards WHERE photo IS NULL OR photo = ''`);
      return stmt.all();
  }

  // Get list of awards with a null value or an empty value in a field based on the category parameter (e.g. exhibitor, location, photographer)
  getAwardsWithNullValues(category) {
      const validCategories = ['awardpoints','clone', 'cross','exhibitor','measurementType', 'description', 'location', 'photographer', 'award', 'year', 'awardNum', 'numBuds', 'numFlowers', 'NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'LIPL', 'SYNSW', 'SYNSL', 'PCHW', 'PCHL', 'genus', 'species','cross'];
      if (!validCategories.includes(category)) {
          throw new Error('Invalid category for null value check');
      }
      const stmt = this.db.prepare(`SELECT * FROM awards WHERE ${category} IS NULL OR ${category} = ''`);
      return stmt.all();
  }

  // Get all data needed for submit form in one call
  getSubmitFormData() {
    try {
      const exhibitors = this.getExhibitorsList();
      const awardTypes = this.getAwardTypesList();
      const awardCounts = this.getAwardCountsByExhibitor();
      const eventNames = this.getEventNamesList();
      const awardNumbers = this.getAwardNumbersList();
      return {
        exhibitors,
        awardTypes, 
        awardCounts,
        eventNames,
        awardNumbers,
        // Add any other data the submit form needs
      };
    } catch (error) {
      console.error('Error getting submit form data:', error);
      throw error;
    }
  }

  // Close database connection
  close() {
    this.db.close();
  }
}


module.exports = AdminServices;