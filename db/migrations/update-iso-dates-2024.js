/**
 * Update ISO Dates for New 2024 Awards
 * Converts human-readable dates to ISO format for the newly imported 2024 awards
 * This will make dates sortable and consistent with other years
 */

const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../orchid_awards.sqlite');

// Award number ranges for new 2024 awards that need ISO date updates
const NEW_AWARD_RANGES = [
    { start: 20245286, end: 20245310 }, // Missing 20245309
    { start: 20245350, end: 20245405 }
];

/**
 * Generate list of new award numbers to update
 * @returns {Array} - Array of award numbers to update
 */
function getNewAwardNumbers() {
    const awardNumbers = [];
    
    for (const range of NEW_AWARD_RANGES) {
        for (let i = range.start; i <= range.end; i++) {
            // Skip 20245309 as it doesn't exist
            if (i === 20245309) continue;
            awardNumbers.push(i.toString());
        }
    }
    
    return awardNumbers;
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
 * Update ISO dates for all newly imported 2024 awards
 */
function updateISODates() {
    console.log('📅 UPDATING ISO DATES FOR NEW 2024 AWARDS');
    console.log('=' .repeat(60));
    console.log(`📂 Database: ${dbPath}`);
    console.log(`🔄 Update Date: ${new Date().toISOString()}`);
    console.log('');
    
    // Connect to database
    const db = new Database(dbPath);
    console.log('📄 Connected to SQLite database');
    
    // Get awards that need ISO date updates
    const newAwardNumbers = getNewAwardNumbers();
    console.log(`📊 Awards to update: ${newAwardNumbers.length}`);
    console.log('');
    
    // Prepare update statement
    const updateStmt = db.prepare(`
        UPDATE awards 
        SET date_iso = ? 
        WHERE awardNum = ?
    `);
    
    // Prepare select statement to get current dates
    const selectStmt = db.prepare(`
        SELECT awardNum, date, date_iso 
        FROM awards 
        WHERE awardNum = ?
    `);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    console.log('🔄 Processing awards...');
    console.log('');
    
    for (const awardNum of newAwardNumbers) {
        try {
            // Get current award data
            const award = selectStmt.get(awardNum);
            
            if (!award) {
                console.log(`⚠️  Award ${awardNum} not found in database`);
                skipped++;
                continue;
            }
            
            // Skip if ISO date is already set
            if (award.date_iso) {
                console.log(`ℹ️  Award ${awardNum} already has ISO date: ${award.date_iso}`);
                skipped++;
                continue;
            }
            
            // Convert human date to ISO
            const isoDate = convertToISODate(award.date);
            
            if (!isoDate) {
                console.log(`❌ Failed to parse date for ${awardNum}: "${award.date}"`);
                errors++;
                continue;
            }
            
            // Update the database
            updateStmt.run(isoDate, awardNum);
            console.log(`✅ Updated ${awardNum}: "${award.date}" → ${isoDate}`);
            updated++;
            
        } catch (error) {
            console.log(`❌ Error updating ${awardNum}: ${error.message}`);
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
    
    // Verify a few updates
    console.log('');
    console.log('🔍 VERIFICATION SAMPLE');
    console.log('=' .repeat(30));
    
    const verifyStmt = db.prepare(`
        SELECT awardNum, date, date_iso 
        FROM awards 
        WHERE year = 2024 
        AND awardNum >= '20245286' 
        ORDER BY date_iso DESC 
        LIMIT 5
    `);
    
    const samples = verifyStmt.all();
    samples.forEach(award => {
        console.log(`${award.awardNum}: ${award.date} → ${award.date_iso}`);
    });
    
    db.close();
    console.log('');
    console.log('🎉 ISO date update completed successfully!');
    
    // Create update report
    const report = {
        updateDate: new Date().toISOString(),
        databasePath: dbPath,
        awardRanges: NEW_AWARD_RANGES,
        results: {
            updated,
            skipped,
            errors,
            totalProcessed: updated + skipped + errors
        }
    };
    
    const reportPath = path.join(__dirname, 'update-iso-dates-2024-report.json');
    const fs = require('fs');
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
    getNewAwardNumbers
};