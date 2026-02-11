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
    
    // Debug: Check total award count
    const totalCount = this.db.prepare('SELECT COUNT(*) as count FROM awards').get();
    // console.log('Total awards in database:', totalCount.count); // Debug
  }

  // Get all awards grouped by award number
  getAllAwards() {
    const stmt = this.db.prepare(`SELECT * FROM awards ORDER BY awardNum ASC`);
    return stmt.all();
  }

  // Get award counts by year
  getAwardCountsByYear() {
    const stmt = this.db.prepare(`SELECT year, COUNT(*) as count 
    FROM awards 
    WHERE year IS NOT NULL 
    GROUP BY year
    ORDER BY year ASC`);
    return stmt.all();
  }

  // Select awards for a specific year
  getAwardsByYear(year) {
    console.log('getAwardsByYear called with year:', year, 'type:', typeof year); // Debug
    const stmt = this.db.prepare(`SELECT *,
      thumbnail_jpeg_small,
      thumbnail_jpeg_medium,
      thumbnail_webp_small,
      thumbnail_webp_medium
      FROM awards 
      WHERE year = ? 
      ORDER BY date_iso ASC, awardNum ASC `);
    const results = stmt.all(year);
    console.log('getAwardsByYear results count:', results.length); // Debug
    if (results.length > 0) {
      console.log('First few results for year', year, ':', results.slice(0, 3).map(r => `${r.awardNum}-${r.year}`)); // Debug
    }
    return results;
  }

  // Counts of awards by day/event for a specific year
  getAwardsCountsByDayForYear(year) {
    const stmt = this.db.prepare(`
      SELECT date_iso, COUNT(*) as count
      FROM awards
      WHERE year = ?
      AND date_iso IS NOT NULL
      GROUP BY date_iso
      ORDER BY date_iso ASC
    `);
    return stmt.all(year);
  }

  // Get awards grouped by a particular exhibitor
  getAwardsByExhibitor(exhibitor) {
    const stmt = this.db.prepare(`
      SELECT *
      FROM awards
      WHERE exhibitor LIKE ?
      ORDER BY year ASC, date_iso ASC, awardNum ASC
    `);
    const likePattern = `%${exhibitor}%`;
    return stmt.all(likePattern);
  }

  // Get info for a specific award by award number
  getAwardByNumber(awardNum) {
    const stmt = this.db.prepare(`
      SELECT *
      FROM awards
      WHERE awardNum = ?
    `);
    return stmt.get(awardNum);
  }

  // Close database connection
  close() {
    this.db.close();
  }
}

module.exports = DatabaseService;