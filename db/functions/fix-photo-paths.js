const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Path to database
const dbPath = path.join(__dirname, '..', 'orchid_awards.sqlite');
const db = Database(dbPath);

// Base paths
const actualImageBase = 'scraper/copilot/localCopy/paccentraljc.org/awards/2025/images/';
const currentDbBase = 'database/images/';
const projectRoot = path.join(__dirname, '..', '..');

async function fixPhotoPaths() {
    try {
        console.log('Fixing 2025 award photo paths...\n');
        
        // Get all 2025 awards with photo paths
        const awards = db.prepare(`
            SELECT id, awardNum, photo 
            FROM awards 
            WHERE year = 2025 
            AND photo IS NOT NULL 
            AND photo != ''
            ORDER BY awardNum
        `).all();
        
        console.log(`Found ${awards.length} awards with photos to check.\n`);
        
        let fixed = 0;
        let missing = 0;
        let skipped = 0;
        
        const updatePhotoPath = db.prepare('UPDATE awards SET photo = ? WHERE id = ?');
        
        for (const award of awards) {
            const currentPath = award.photo;
            
            // Check if current path has the wrong prefix
            if (currentPath.startsWith(currentDbBase)) {
                const filename = path.basename(currentPath);
                const correctPath = `${actualImageBase}${filename}`;
                const fullPath = path.join(projectRoot, actualImageBase, filename);
                
                // Check if the actual image file exists
                if (fs.existsSync(fullPath)) {
                    // Update the database path
                    updatePhotoPath.run(correctPath, award.id);
                    console.log(`✓ Fixed ${award.awardNum}: ${currentPath} -> ${correctPath}`);
                    fixed++;
                } else {
                    console.log(`✗ Missing ${award.awardNum}: ${fullPath} does not exist`);
                    missing++;
                }
            } else {
                console.log(`⏭ Skipped ${award.awardNum}: path already correct (${currentPath})`);
                skipped++;
            }
        }
        
        console.log(`\n=== SUMMARY ===`);
        console.log(`Fixed: ${fixed} awards`);
        console.log(`Missing files: ${missing} awards`);
        console.log(`Already correct: ${skipped} awards`);
        console.log(`Total processed: ${awards.length} awards\n`);
        
        if (fixed > 0) {
            console.log('Database paths updated successfully!');
        }
        
    } catch (error) {
        console.error('Error fixing photo paths:', error);
    } finally {
        db.close();
    }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'check') {
    // Just show what would be changed without making updates
    console.log('=== DRY RUN MODE ===\n');
    const awards = db.prepare(`
        SELECT id, awardNum, photo 
        FROM awards 
        WHERE year = 2025 
        AND photo IS NOT NULL 
        AND photo != ''
        AND photo LIKE 'database/images/%'
        LIMIT 5
    `).all();
    
    for (const award of awards) {
        const filename = path.basename(award.photo);
        const correctPath = `${actualImageBase}${filename}`;
        const fullPath = path.join(projectRoot, actualImageBase, filename);
        const exists = fs.existsSync(fullPath) ? '✓ EXISTS' : '✗ MISSING';
        
        console.log(`${award.awardNum}:`);
        console.log(`  Current: ${award.photo}`);
        console.log(`  Correct: ${correctPath}`);
        console.log(`  File:    ${exists}\n`);
    }
    
    db.close();
} else {
    // Run the actual fix
    fixPhotoPaths();
}