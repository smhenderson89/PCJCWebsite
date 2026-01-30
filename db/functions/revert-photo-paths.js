const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Path to database
const dbPath = path.join(__dirname, '..', 'orchid_awards.sqlite');
const db = Database(dbPath);

async function revertPhotoPaths() {
    try {
        console.log('Reverting 2025 award photo paths back to database/images/...\n');
        
        // Get all 2025 awards with the long scraper paths
        const awards = db.prepare(`
            SELECT id, awardNum, photo 
            FROM awards 
            WHERE year = 2025 
            AND photo LIKE 'scraper/copilot/localCopy/paccentraljc.org/awards/2025/images/%'
            ORDER BY awardNum
        `).all();
        
        console.log(`Found ${awards.length} awards with scraper paths to revert.\n`);
        
        const updatePhotoPath = db.prepare('UPDATE awards SET photo = ? WHERE id = ?');
        
        for (const award of awards) {
            const filename = path.basename(award.photo);
            const correctPath = `database/images/${filename}`;
            
            updatePhotoPath.run(correctPath, award.id);
            console.log(`✓ Reverted ${award.awardNum}: ${correctPath}`);
        }
        
        console.log(`\n=== SUMMARY ===`);
        console.log(`Reverted: ${awards.length} awards back to database/images/ paths\n`);
        
    } catch (error) {
        console.error('Error reverting photo paths:', error);
    } finally {
        db.close();
    }
}

revertPhotoPaths();