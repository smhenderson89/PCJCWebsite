const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Path to database
const dbPath = path.join(__dirname, '..', 'orchid_awards.sqlite');
const db = Database(dbPath);

// Paths
const projectRoot = path.join(__dirname, '..', '..');
const dbImagesDir = path.join(__dirname, '..', 'images');
const scraperImagesDir = path.join(projectRoot, 'scraper', 'copilot', 'localCopy', 'paccentraljc.org', 'awards', '2025', 'images');

async function copyMissingImages() {
    try {
        console.log('Copying missing images from scraper to db/images...\n');
        
        // Ensure db/images directory exists
        if (!fs.existsSync(dbImagesDir)) {
            fs.mkdirSync(dbImagesDir, { recursive: true });
            console.log(`Created directory: ${dbImagesDir}\n`);
        }
        
        // Get all 2025 awards with photo paths
        const awards = db.prepare(`
            SELECT id, awardNum, photo 
            FROM awards 
            WHERE year = 2025 
            AND photo IS NOT NULL 
            AND photo != ''
            AND photo LIKE 'database/images/%'
            ORDER BY awardNum
        `).all();
        
        console.log(`Found ${awards.length} awards with database/images/ paths to check.\n`);
        
        let copied = 0;
        let alreadyExists = 0;
        let notFoundInScraper = 0;
        
        for (const award of awards) {
            const filename = path.basename(award.photo);
            const dbImagePath = path.join(dbImagesDir, filename);
            const scraperImagePath = path.join(scraperImagesDir, filename);
            
            // Check if image already exists in db/images
            if (fs.existsSync(dbImagePath)) {
                console.log(`⏭ Already exists ${award.awardNum}: ${filename}`);
                alreadyExists++;
                continue;
            }
            
            // Check if image exists in scraper folder
            if (!fs.existsSync(scraperImagePath)) {
                console.log(`✗ Not found in scraper ${award.awardNum}: ${filename}`);
                notFoundInScraper++;
                continue;
            }
            
            // Copy the image
            try {
                fs.copyFileSync(scraperImagePath, dbImagePath);
                const stats = fs.statSync(dbImagePath);
                console.log(`✓ Copied ${award.awardNum}: ${filename} (${Math.round(stats.size / 1024)}KB)`);
                copied++;
            } catch (copyError) {
                console.log(`✗ Failed to copy ${award.awardNum}: ${copyError.message}`);
            }
        }
        
        console.log(`\n=== SUMMARY ===`);
        console.log(`Copied: ${copied} images`);
        console.log(`Already existed: ${alreadyExists} images`);
        console.log(`Not found in scraper: ${notFoundInScraper} images`);
        console.log(`Total processed: ${awards.length} awards\n`);
        
        if (copied > 0) {
            console.log(`Successfully copied ${copied} missing images to db/images/`);
        }
        
    } catch (error) {
        console.error('Error copying missing images:', error);
    } finally {
        db.close();
    }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'check') {
    // Just show what would be copied without making changes
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
        const dbImagePath = path.join(dbImagesDir, filename);
        const scraperImagePath = path.join(scraperImagesDir, filename);
        
        const dbExists = fs.existsSync(dbImagePath) ? '✓ EXISTS' : '✗ MISSING';
        const scraperExists = fs.existsSync(scraperImagePath) ? '✓ EXISTS' : '✗ MISSING';
        
        console.log(`${award.awardNum}: ${filename}`);
        console.log(`  DB location:      ${dbExists}`);
        console.log(`  Scraper location: ${scraperExists}`);
        console.log(`  Action: ${!fs.existsSync(dbImagePath) && fs.existsSync(scraperImagePath) ? 'WOULD COPY' : 'NO ACTION'}\n`);
    }
    
    db.close();
} else {
    // Run the actual copy
    copyMissingImages();
}