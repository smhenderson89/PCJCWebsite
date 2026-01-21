/**
 * SQLite Database Schema for Orchid Awards
 * This file defines the database structure for storing award data
 */

const Database = require('better-sqlite3');
const path = require('path');

// Database schema
const SCHEMA = {
    awards: `
        CREATE TABLE IF NOT EXISTS awards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            awardNum TEXT UNIQUE NOT NULL,
            award TEXT NOT NULL,
            awardpoints INTEGER,
            location TEXT,
            date TEXT,
            genus TEXT,
            species TEXT,
            clone TEXT,
            cross TEXT,
            exhibitor TEXT,
            photographer TEXT,
            photo TEXT,
            sourceUrl TEXT,
            htmlReference TEXT,
            year INTEGER,
            scrapedDate TEXT,
            -- Measurement fields
            measurementType TEXT,
            description TEXT,
            numFlowers INTEGER,
            numBuds INTEGER,
            numInflorescences INTEGER,
            NS REAL,
            NSV REAL,
            DSW REAL,
            DSL REAL,
            PETW REAL,
            PETL REAL,
            LSW REAL,
            LSL REAL,
            LIPW REAL,
            LIPL REAL,
            SYNSW REAL,
            SYNSL REAL,
            PCHW REAL,
            PCHL REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `
};

// Index definitions for better query performance
const INDEXES = [
    'CREATE INDEX IF NOT EXISTS idx_awards_year ON awards(year)',
    'CREATE INDEX IF NOT EXISTS idx_awards_award_type ON awards(award)',
    'CREATE INDEX IF NOT EXISTS idx_awards_genus ON awards(genus)',
    'CREATE INDEX IF NOT EXISTS idx_awards_location ON awards(location)',
    'CREATE INDEX IF NOT EXISTS idx_awards_exhibitor ON awards(exhibitor)',
    'CREATE INDEX IF NOT EXISTS idx_awards_measurement_type ON awards(measurementType)'
];

/**
 * Initialize the SQLite database with schema
 * @param {string} dbPath - Path to the SQLite database file
 * @returns {Promise} - Resolves when database is initialized
 */
function initializeDatabase(dbPath) {
    try {
        const db = new Database(dbPath);
        console.log('📄 Connected to SQLite database');
        
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        
        // Create tables
        Object.entries(SCHEMA).forEach(([tableName, sql]) => {
            db.exec(sql);
            console.log(`✅ Created table: ${tableName}`);
        });
        
        // Create indexes
        INDEXES.forEach((indexSql) => {
            db.exec(indexSql);
        });
        
        console.log('✅ Database schema initialized successfully');
        db.close();
        
        return Promise.resolve();
    } catch (error) {
        return Promise.reject(new Error(`Failed to initialize database: ${error.message}`));
    }
}

module.exports = {
    SCHEMA,
    INDEXES,
    initializeDatabase
};