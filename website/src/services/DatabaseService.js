/* Database services act as an interface to the SQLite database */

const Database = require('better-sqlite3');
const path = require('path');

class DatabaseService {
  constructor() {
    const dbPath = path.join(__dirname, '..', '..', '..', 'db', 'orchid_awards.sqlite');
    // console.log('Database path:', dbPath); // Debug log
    this.db = new Database(dbPath);
    
    // Enable WAL mode for better performance with concurrent access
    this.db.pragma('journal_mode = WAL');
  }

  // Get all awards - simple version
  getAwardCountsByYear() {
    const stmt = this.db.prepare(`SELECT year, COUNT(*) as count 
    FROM awards 
    WHERE year IS NOT NULL 
    GROUP BY year
    ORDER BY year ASC`);
    return stmt.all();
  }

  // Count awards for a specific year
  getAwardsByYear(year) {
    const stmt = this.db.prepare(`SELECT * FROM awards 
      WHERE year = ? ORDER BY award, genus, species`);
    return stmt.all(year);
  }

  // Count awards for a specific day for a specific year
  getAwardsCountsByDayForYear(year) {
    const stmt = this.db.prepare(`
      SELECT date_iso as date, COUNT(*) as count
      FROM awards
      WHERE year = ?
      AND date_iso IS NOT NULL
      GROUP BY date_iso
      ORDER BY date_iso ASC
    `);
    return stmt.all(year);
  }

  // Get awards for a specific day for a specific year
  getAwardsByDayForYear(year, day) {
    const stmt = this.db.prepare(`
      SELECT * FROM awards
      WHERE year = ?
      AND date_iso = ?
      ORDER BY awardNum ASC
    `);
    return stmt.all(year, day);
  }

  // Get awards grouped by award number
  getAllAwards() {
    const stmt = this.db.prepare(`SELECT * FROM awards ORDER BY awardNum ASC`);
    return stmt.all();
  }

  /* Exhibitors */

  // Get List of exhibitors
  getExhibitorsList() {
    const stmt = this.db.prepare(`SELECT DISTINCT exhibitor FROM awards ORDER BY exhibitor ASC`);
    return stmt.all();
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

  // Close database connection
  close() {
    this.db.close();
  }
}

module.exports = DatabaseService;