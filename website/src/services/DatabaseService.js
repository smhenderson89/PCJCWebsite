/* Database services act as an interface to the SQLite database */

const Database = require('better-sqlite3');
const path = require('path');

class DatabaseService {
  constructor() {
    const dbPath = path.join(__dirname, '..', '..', '..', 'db', 'orchid_awards.sqlite');
    console.log('Database path:', dbPath); // Debug log
    this.db = new Database(dbPath);
    
    // Enable WAL mode for better performance with concurrent access
    this.db.pragma('journal_mode = WAL');
  }

  // Get all awards - simple version
  getAllAwards() {
    const stmt = this.db.prepare('SELECT * FROM awards ORDER BY date_iso ASC');
    return stmt.all();
  }

  // Close database connection
  close() {
    this.db.close();
  }
}

module.exports = DatabaseService;