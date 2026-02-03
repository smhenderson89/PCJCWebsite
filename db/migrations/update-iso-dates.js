/**
 * Update ISO Dates for All Awards
 * Scans the entire database and converts human-readable dates to ISO format
 * for any awards that don't already have ISO dates.
 * This ensures all dates are sortable and consistent across all years.
 * 
 * Usage:
 *   node update-iso-dates.js        - Process all awards missing ISO dates
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(__dirname, '../orchid_awards.sqlite');

/**
 * Get all awards that need ISO date updates (those with missing date_iso)
 * @returns {Array} - Array of award objects {awardNum, date, date_iso}
 */
function getAwardsNeedingISODates() {
    const db = new Database(dbPath);
    
    const stmt = db.prepare(`
        SELECT awardNum, date, date_iso 
        FROM awards 
        WHERE date IS NOT NULL 
        AND date != '' 
        AND (date_iso IS NULL OR date_iso = '')
        ORDER BY awardNum ASC
    `);
    
    const awards = stmt.all();
    db.close();
    
    return awards;
}

/**
 * Convert human-readable date to ISO format
 * @param {string} humanDate - Human readable date like "January 2, 2024"
 * @returns {string|null} - ISO date string (YYYY-MM-DD) or null if parsing fails
 */
function convertToISODate(humanDate) {
    try {
        // Parse the human-readable date and convert to ISO format
        const date = new Date(humanDate);
        
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return null;
        }
        
        // Convert to ISO date string (YYYY-MM-DD)
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error(`Error parsing date "${humanDate}": ${error.message}`);
        return null;
    }
}

/**
 * Update ISO dates for all awards missing them
 */
function updateISODates() {
    console.log('📅 UPDATING ISO DATES FOR ALL AWARDS');
    console.log('=' .repeat(60));
    console.log(`📂 Database: ${dbPath}`);
    console.log(`🔄 Update Date: ${new Date().toISOString()}`);
    console.log('');
    
    // Get awards that need ISO date updates
    console.log('🔍 Scanning database for awards missing ISO dates...');
    const awardsToUpdate = getAwardsNeedingISODates();
    console.log(`📊 Awards needing ISO dates: ${awardsToUpdate.length}`);
    
    if (awardsToUpdate.length === 0) {
        console.log('🎉 All awards already have ISO dates!');
        return;
    }
    
    console.log('');
    
    // Connect to database
    const db = new Database(dbPath);
    console.log('📄 Connected to SQLite database');
    
    // Prepare update statement
    const updateStmt = db.prepare(`
        UPDATE awards 
        SET date_iso = ? 
        WHERE awardNum = ?
    `);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    console.log('🔄 Processing awards...');
    console.log('');
    
    for (const [index, award] of awardsToUpdate.entries()) {
        try {
            // Show progress for every 50 awards
            if ((index + 1) % 50 === 0) {
                console.log(`📊 Progress: ${index + 1}/${awardsToUpdate.length} awards processed`);
            }
            
            // Double-check that ISO date is not already set (safety check)
            if (award.date_iso && award.date_iso.trim() !== '') {
                console.log(`ℹ️  Award ${award.awardNum} already has ISO date: ${award.date_iso}`);
                skipped++;
                continue;
            }
            
            // Convert human date to ISO
            const isoDate = convertToISODate(award.date);
            
            if (!isoDate) {
                console.log(`❌ Failed to parse date for ${award.awardNum}: "${award.date}"`);
                errors++;
                continue;
            }
            
            // Update the database
            updateStmt.run(isoDate, award.awardNum);
            
            // Only show first 20 updates to avoid spam, then show every 100th
            if (updated < 20 || (updated + 1) % 100 === 0) {
                console.log(`✅ Updated ${award.awardNum}: "${award.date}" → ${isoDate}`);
            }
            updated++;
            
        } catch (error) {
            console.log(`❌ Error updating ${award.awardNum}: ${error.message}`);
            errors++;
        }
    }
    
    console.log('');
    console.log('📊 UPDATE SUMMARY');
    console.log('=' .repeat(40));
    console.log(`✅ Successfully updated: ${updated}`);
    console.log(`ℹ️  Skipped (already set): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${updated + skipped + errors}`);
    
    // Verify a few recent updates
    console.log('');
    console.log('🔍 VERIFICATION SAMPLE (Recent Updates)');
    console.log('=' .repeat(40));
    
    const verifyStmt = db.prepare(`
        SELECT awardNum, date, date_iso 
        FROM awards 
        WHERE date_iso IS NOT NULL 
        AND date_iso != '' 
        ORDER BY awardNum DESC 
        LIMIT 5
    `);
    
    const samples = verifyStmt.all();
    samples.forEach(award => {
        console.log(`${award.awardNum}: ${award.date} → ${award.date_iso}`);
    });
    
    // Check remaining awards without ISO dates
    const remainingStmt = db.prepare(`
        SELECT COUNT(*) as count 
        FROM awards 
        WHERE date IS NOT NULL 
        AND date != '' 
        AND (date_iso IS NULL OR date_iso = '')
    `);
    
    const remaining = remainingStmt.get();
    console.log('');
    console.log(`🔍 Awards still missing ISO dates: ${remaining.count}`);
    
    db.close();
    console.log('');
    console.log('🎉 ISO date update completed successfully!');
    
    // Create update report
    const report = {
        updateDate: new Date().toISOString(),
        databasePath: dbPath,
        processedAwards: awardsToUpdate.length,
        results: {
            updated,
            skipped,
            errors,
            totalProcessed: updated + skipped + errors
        },
        remainingWithoutISO: remaining.count
    };
    
    const reportPath = path.join(__dirname, 'update-iso-dates-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Update report saved: ${reportPath}`);
}

// Run the update if this script is executed directly
if (require.main === module) {
    updateISODates();
}

module.exports = {
    updateISODates,
    convertToISODate,
    getAwardsNeedingISODates
};