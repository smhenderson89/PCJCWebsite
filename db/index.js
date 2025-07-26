// const Database = require('better-sqlite3');
// const db = new Database('users.db');

// // Create table
// db.prepare(`
//   CREATE TABLE IF NOT EXISTS users (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     username TEXT UNIQUE NOT NULL,
//     password TEXT NOT NULL
//   )
// `).run();

// // Insert test user
// const exists = db.prepare(`SELECT * FROM users WHERE username = ?`).get('test');
// if (!exists) {
//   db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`).run('test', 'password123');
// }

// // ✅ Export the db so it can be used elsewhere
// module.exports = db;


// Comment out for now