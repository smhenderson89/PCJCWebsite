/**
 * Migrate JSON Award Data to SQLite Database
 * Loads award JSON files into the SQLite database
 * 
 * Usage:
 *   node migrate.js        - Process all years (2015-2025) 
 *   node migrate.js 2026   - Process only 2026
 *   node migrate.js 2025   - Process only 2025
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { initializeDatabase } = require('../schema');

// Paths
const baseDataPath = path.join(__dirname, '../../scraper/copilot/localCopy/paccentraljc.org/awards');
const dbPath = path.join(__dirname, '../orchid_awards.sqlite');

/**
 * Get all JSON files from a specific year
 * @param {number} year - Year to get JSON files for
 * @returns {Array} - Array of JSON file data
 */
function getJsonFilesForYear(year) {
    const yearPath = path.join(baseDataPath, year.toString(), 'data', 'json');
    
    if (!fs.existsSync(yearPath)) {
        console.log(`⚠️  Directory not found for year ${year}: ${yearPath}`);
        return [];
    }
    
    const jsonFiles = fs.readdirSync(yearPath)
        .filter(file => file.endsWith('.json'))
        .sort();
    
    const jsonData = [];
    
    for (const file of jsonFiles) {
        try {
            const filePath = path.join(yearPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            jsonData.push(data);
        } catch (error) {
            console.log(`❌ Error parsing ${file}: ${error.message}`);
        }
    }
    
    return jsonData;
}

/**
 * Check if award already exists in database
 * @param {Object} db - SQLite database connection
 * @param {string} awardNum - Award number to check
 * @returns {boolean} - True if award exists
 */
function awardExists(db, awardNum) {
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM awards WHERE awardNum = ?');
    const result = checkStmt.get(awardNum);
    return result.count > 0;
}

/**
 * Insert award data into database (with duplicate checking)
 * @param {Object} db - SQLite database connection
 * @param {Object} awardData - Award data from JSON
 * @returns {string} - 'inserted', 'skipped', or 'error'
 */
function insertAwardData(db, awardData) {
    try {
        // Check if award already exists
        if (awardExists(db, awardData.awardNum)) {
            return 'skipped';
        }
        
        // Prepare statement for inserting new awards only
        const insertAward = db.prepare(`
            INSERT INTO awards (
                awardNum, award, awardpoints, location, date, genus, species, clone, cross,
                exhibitor, photographer, photo, sourceUrl, htmlReference, year, scrapedDate,
                measurementType, description, numFlowers, numBuds, numInflorescences,
                NS, NSV, DSW, DSL, PETW, PETL, LSW, LSL, LIPW, LIPL,
                SYNSW, SYNSL, PCHW, PCHL
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        // Extract measurement data if it exists
        const measurements = awardData.measurements || {};
        
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
            awardData.htmlReference,
            awardData.year,
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
        return 'inserted';
        
    } catch (error) {
        throw new Error(`Failed to insert award ${awardData.awardNum}: ${error.message}`);
    }
}

/**
 * Main migration function
 */
async function migrateJsonToDatabase() {
    console.log('🔄 MIGRATING JSON DATA TO SQLITE DATABASE');
    console.log('=' .repeat(60));
    console.log(`📁 Base data path: ${baseDataPath}`);
    console.log(`🗄️  Database path: ${dbPath}\n`);
    
    try {
        // Initialize database schema
        console.log('🔧 Initializing database schema...');
        await initializeDatabase(dbPath);
        
        // Parse command line arguments for year specification
        const yearArg = process.argv[2];
        let years;
        
        if (yearArg) {
            const specifiedYear = parseInt(yearArg);
            if (isNaN(specifiedYear) || specifiedYear < 2000 || specifiedYear > new Date().getFullYear()) {
                console.error(`❌ Invalid year: ${yearArg}. Must be between 2000 and ${new Date().getFullYear()}`);
                process.exit(1);
            }
            years = [specifiedYear];
            console.log(`🎯 Processing only year: ${specifiedYear}`);
        } else {
            // Default: process all years (2015-2025)
            years = Array.from({ length: 11 }, (_, i) => 2015 + i);
            console.log('📅 Processing all years: 2015-2025');
        }
        
        const db = new Database(dbPath);
        
        let totalAwards = 0;
        let successfulInserts = 0;
        let skippedDuplicates = 0;
        let errors = [];
        
        for (const year of years) {
            console.log(`\n📅 Processing year ${year}...`);
            
            const yearData = getJsonFilesForYear(year);
            console.log(`   Found ${yearData.length} awards for ${year}`);
            
            if (yearData.length === 0) {
                continue;
            }
            
            totalAwards += yearData.length;
            
            // Process each award individually to check for duplicates
            let yearInserts = 0;
            let yearSkips = 0;
            let yearErrors = 0;
            
            for (const [index, awardData] of yearData.entries()) {
                try {
                    const result = insertAwardData(db, awardData);
                    
                    if (result === 'inserted') {
                        yearInserts++;
                        successfulInserts++;
                        console.log(`   ✅ [${index + 1}/${yearData.length}] Inserted ${awardData.awardNum}`);
                    } else if (result === 'skipped') {
                        yearSkips++;
                        skippedDuplicates++;
                        console.log(`   ⏭️  [${index + 1}/${yearData.length}] Skipped ${awardData.awardNum} (already exists)`);
                    }
                } catch (insertError) {
                    yearErrors++;
                    console.log(`   ❌ [${index + 1}/${yearData.length}] Failed ${awardData.awardNum}: ${insertError.message}`);
                    errors.push({
                        year: year,
                        awardNum: awardData.awardNum,
                        error: insertError.message
                    });
                }
            }
            
            console.log(`   📊 Year ${year} summary: ${yearInserts} inserted, ${yearSkips} skipped, ${yearErrors} errors`);
        }
        
        db.close();
        
        // Print summary
        console.log('\n' + '=' .repeat(80));
        console.log('📊 MIGRATION SUMMARY');
        console.log('=' .repeat(80));
        console.log(`📈 PROCESSING STATS:`);
        console.log(`   Total awards found: ${totalAwards}`);
        console.log(`   Successfully inserted: ${successfulInserts}`);
        console.log(`   Skipped duplicates: ${skippedDuplicates}`);
        console.log(`   Failed inserts: ${errors.length}`);
        
        if (totalAwards > 0) {
            const successRate = (((successfulInserts + skippedDuplicates) / totalAwards) * 100).toFixed(1);
            console.log(`   Overall success rate: ${successRate}%`);
        }
        
        if (errors.length > 0) {
            console.log(`\n❌ ERRORS:`);
            errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.year}/${error.awardNum}: ${error.error}`);
            });
        }
        
        // Save migration report
        const migrationReport = {
            timestamp: new Date().toISOString(),
            databasePath: dbPath,
            totalAwards: totalAwards,
            successfulInserts: successfulInserts,
            skippedDuplicates: skippedDuplicates,
            failedInserts: errors.length,
            successRate: totalAwards > 0 ? (((successfulInserts + skippedDuplicates) / totalAwards) * 100).toFixed(1) + '%' : 'N/A',
            errors: errors
        };
        
        const reportPath = path.join(__dirname, 'migration-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(migrationReport, null, 2));
        
        console.log(`\n📊 Migration report saved: ${reportPath}`);
        console.log(`🗄️  SQLite database created: ${dbPath}`);
        
        if (errors.length === 0) {
            console.log('\n🎉 ALL DATA MIGRATED SUCCESSFULLY!');
        } else {
            console.log(`\n⚠️  Migration completed with ${errors.length} errors. Check report for details.`);
        }
        
    } catch (error) {
        console.error(`💥 Migration failed: ${error.message}`);
        process.exit(1);
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateJsonToDatabase().catch(console.error);
}

module.exports = { migrateJsonToDatabase };