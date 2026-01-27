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

  // Close database connection
  close() {
    this.db.close();
  }

  // Get all data needed for submit form in one call
  getSubmitFormData() {
    try {
      const exhibitors = this.getExhibitorsList();
      const awardTypes = this.getAwardTypesList();
      const awardCounts = this.getAwardCountsByExhibitor();
      
      return {
        exhibitors,
        awardTypes, 
        awardCounts,
        // Add any other data the submit form needs
      };
    } catch (error) {
      console.error('Error getting submit form data:', error);
      throw error;
    }
  }
}


module.exports = AdminServices;