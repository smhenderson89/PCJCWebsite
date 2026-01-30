/**
 * Import New 2024 Awards to SQLite Database
 * Specifically imports the 53 new 2024 awards that were collected in January 2026
 * Awards from May 19, 2024 through December 21, 2024 (20245286-20245405)
 * 
 * Run Date: January 30, 2026
 * Source: Repaired and validated JSON files from local copy
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Paths
const jsonDataPath = path.join(__dirname, '../../scraper/copilot/localCopy/paccentraljc.org/awards/2024/data/json');
const dbPath = path.join(__dirname, '../orchid_awards.sqlite');

// Award number ranges for new 2024 awards
const NEW_AWARD_RANGES = [
    { start: 20245286, end: 20245310 }, // Missing 20245309
    { start: 20245350, end: 20245405 }
];

/**
 * Generate list of new award numbers to import
 * @returns {Array} - Array of award numbers to import
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
 * Check if award already exists in database
 * @param {Object} db - SQLite database connection
 * @param {string} awardNum - Award number to check
 * @returns {boolean} - True if award exists
 */
function awardExists(db, awardNum) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM awards WHERE awardNum = ?');
    const result = stmt.get(awardNum);
    return result.count > 0;
}

/**
 * Insert single award data into database
 * @param {Object} db - SQLite database connection
 * @param {Object} awardData - Award data from JSON
 * @returns {boolean} - Success status
 */
function insertAwardData(db, awardData) {
    const insertAward = db.prepare(`
        INSERT OR REPLACE INTO awards (
            awardNum, award, awardpoints, location, date, genus, species, clone, cross,
            exhibitor, photographer, photo, sourceUrl, htmlReference, year, scrapedDate,
            measurementType, description, numFlowers, numBuds, numInflorescences,
            NS, NSV, DSW, DSL, PETW, PETL, LSW, LSL, LIPW, LIPL,
            SYNSW, SYNSL, PCHW, PCHL
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    try {
        // Extract measurement data
        const measurements = awardData.measurements || {};
        
        // Extract year from awardNum (first 4 digits)
        const year = parseInt(awardData.awardNum.substring(0, 4));
        
        const awardValues = [
            awardData.awardNum,
            awardData.award,
            awardData.awardpoints === 'N/A' ? null : parseInt(awardData.awardpoints),
            awardData.location,
            awardData.date,
            awardData.genus,
            awardData.species,
            awardData.clone,
            awardData.cross,
            awardData.exhibitor,
            awardData.photographer,
            awardData.photo,
            awardData.sourceUrl,
            awardData.htmlReference || null,
            year,
            awardData.scrapedDate,
            // Measurement fields
            measurements.type || null,
            measurements.description || null,
            measurements.numFlowers || null,
            measurements.numBuds || null,
            measurements.numInflorescences || null,
            measurements.NS || null,
            measurements.NSV || null,
            measurements.DSW || null,
            measurements.DSL || null,
            measurements.PETW || null,
            measurements.PETL || null,
            measurements.LSW || null,
            measurements.LSL || null,
            measurements.LIPW || null,
            measurements.LIPL || null,
            measurements.SYNSW || null,
            measurements.SYNSL || null,
            measurements.PCHW || null,
            measurements.PCHL || null
        ];
        
        insertAward.run(awardValues);
        return true;
        
    } catch (error) {
        console.error(`❌ Failed to insert award ${awardData.awardNum}: ${error.message}`);
        return false;
    }
}

/**
 * Main import function
 */
async function importNew2024Awards() {
    console.log('🌺 IMPORTING NEW 2024 ORCHID AWARDS');
    console.log('=' .repeat(60));
    console.log(`📅 Import Date: ${new Date().toISOString()}`);
    console.log(`📂 Source Path: ${jsonDataPath}`);
    console.log(`🗄️  Database: ${dbPath}`);
    console.log('');
    
    // Verify database exists
    if (!fs.existsSync(dbPath)) {
        console.log('❌ Database file not found!');
        return;
    }
    
    // Verify JSON directory exists
    if (!fs.existsSync(jsonDataPath)) {
        console.log('❌ JSON data directory not found!');
        return;
    }
    
    // Get list of awards to import
    const newAwardNumbers = getNewAwardNumbers();
    console.log(`📊 Awards to import: ${newAwardNumbers.length}`);
    console.log(`🔢 Award ranges: ${NEW_AWARD_RANGES.map(r => `${r.start}-${r.end}`).join(', ')}`);
    console.log('');
    
    // Connect to database
    const db = new Database(dbPath);
    console.log('📄 Connected to SQLite database');
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    let existingAwards = 0;
    
    console.log('🔄 Processing awards...');
    console.log('');
    
    for (const awardNum of newAwardNumbers) {
        const jsonFile = path.join(jsonDataPath, `${awardNum}.json`);
        
        if (!fs.existsSync(jsonFile)) {
            console.log(`⚠️  JSON file not found: ${awardNum}.json`);
            skipped++;
            continue;
        }
        
        try {
            // Check if award already exists
            if (awardExists(db, awardNum)) {
                console.log(`ℹ️  Award ${awardNum} already exists - skipping`);
                existingAwards++;
                continue;
            }
            
            // Read and parse JSON
            const jsonContent = fs.readFileSync(jsonFile, 'utf8');
            const awardData = JSON.parse(jsonContent);
            
            // Insert into database
            if (insertAwardData(db, awardData)) {
                console.log(`✅ Imported: ${awardNum} - ${awardData.genus} ${awardData.species} '${awardData.clone || 'N/A'}'`);
                imported++;
            } else {
                errors++;
            }
            
        } catch (error) {
            console.log(`❌ Error processing ${awardNum}: ${error.message}`);
            errors++;
        }
    }
    
    console.log('');
    console.log('📊 IMPORT SUMMARY');
    console.log('=' .repeat(40));
    console.log(`✅ Successfully imported: ${imported}`);
    console.log(`ℹ️  Already existing: ${existingAwards}`);
    console.log(`⚠️  Skipped (file not found): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${imported + existingAwards + skipped + errors}`);
    
    // Final database count
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM awards WHERE year = 2024').get();
    console.log(`🗄️  Total 2024 awards in database: ${totalCount.count}`);
    
    db.close();
    console.log('');
    console.log('🎉 Import completed successfully!');
    
    // Create import report
    const report = {
        importDate: new Date().toISOString(),
        sourcePath: jsonDataPath,
        databasePath: dbPath,
        awardRanges: NEW_AWARD_RANGES,
        results: {
            imported,
            existingAwards,
            skipped,
            errors,
            totalProcessed: imported + existingAwards + skipped + errors,
            finalDatabaseCount: totalCount.count
        }
    };
    
    const reportPath = path.join(__dirname, 'import-new-2024-awards-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Import report saved: ${reportPath}`);
}

// Run the import if this script is executed directly
if (require.main === module) {
    importNew2024Awards().catch(console.error);
}

module.exports = {
    importNew2024Awards,
    getNewAwardNumbers,
    insertAwardData
};