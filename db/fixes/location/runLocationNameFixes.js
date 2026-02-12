#!/usr/bin/env node

/**
 * Runner script to apply location name fixes
 * Standardizes event location names in the orchid awards database
 */

const Database = require('better-sqlite3');
const path = require('path');
const readline = require('readline');
const { 
  allLocationNameFixes, 
  applyLocationNameFixes, 
  previewLocationNameFixes,
  locationFixSummary
} = require('./allLocationNameFixes.js');

// Path to database
const dbPath = path.join(__dirname, '..', '..', 'orchid_awards.sqlite');

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🌍 Location Name Standardization');
  console.log('=================================\n');
  
  try {
    // Connect to database
    console.log(`📂 Connecting to database: ${dbPath}`);
    const db = Database(dbPath);
    
    // First, show a preview of what would be changed
    console.log('\n📋 Previewing location name changes...\n');
    const preview = previewLocationNameFixes(db);
    
    if (preview.length === 0) {
      console.log('✅ No location variations found that need fixing!');
      console.log('All location names are already standardized.');
      db.close();
      rl.close();
      return;
    }
    
    // Show preview
    console.log(`Found ${preview.length} location variations to standardize:\n`);
    
    let totalRecordsToUpdate = 0;
    preview.forEach((fix, index) => {
      console.log(`${index + 1}. "${fix.from}" → "${fix.to}"`);
      console.log(`   📊 ${fix.recordsToUpdate} award records will be updated\n`);
      totalRecordsToUpdate += fix.recordsToUpdate;
    });
    
    console.log(`📈 Total records that will be updated: ${totalRecordsToUpdate}`);
    console.log(`🔧 Total location fixes defined: ${Object.keys(allLocationNameFixes).length}`);
    console.log(`✅ Fixes with matching records: ${preview.length}\n`);
    
    console.log('🎯 GOAL: Standardize location names for better filtering and user experience');
    console.log('   - Consolidate Filoli variations');
    console.log('   - Expand POS/GCCS abbreviation');
    console.log('   - Fix San Francisco typos and variations');
    console.log('   - Standardize Santa Clara Valley and Sonoma County names\n');
    
    // Ask for confirmation
    const confirmation = await question('Do you want to proceed with location name standardization? (yes/no): ');
    
    if (confirmation.toLowerCase() !== 'yes' && confirmation.toLowerCase() !== 'y') {
      console.log('❌ Updates cancelled by user.');
      db.close();
      rl.close();
      return;
    }
    
    console.log('\n🚀 Applying location name fixes to database...\n');
    
    // Apply the fixes
    const results = applyLocationNameFixes(db);
    
    console.log('\n📊 RESULTS:');
    console.log('===========');
    console.log(`✅ Successfully applied: ${results.applied} fixes`);
    console.log(`❌ Errors encountered: ${results.errors.length}`);
    console.log(`📝 Total fixes defined: ${results.totalFixes}\n`);
    
    if (results.details.length > 0) {
      console.log('📋 Detailed Results:');
      results.details.forEach(detail => {
        console.log(`   ✅ "${detail.from}" → "${detail.to}" (${detail.recordsUpdated} records)`);
      });
    }
    
    // Show errors if any
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => {
        console.log(`   ❌ "${error.incorrectLocation}" → "${error.correctLocation}": ${error.error}`);
      });
    }
    
    // Final summary
    const totalRecordsUpdated = results.details.reduce((sum, detail) => sum + detail.recordsUpdated, 0);
    console.log(`\n🎉 SUCCESS: Updated ${totalRecordsUpdated} award records!`);
    console.log('✨ Location names are now standardized for better user experience!');
    
    // Show most common standardized locations
    const topLocations = db.prepare(`
      SELECT location, COUNT(*) as count 
      FROM awards 
      GROUP BY location 
      ORDER BY count DESC 
      LIMIT 10
    `).all();
    
    console.log(`\n📊 Top 10 Event Locations (after standardization):`);
    topLocations.forEach((row, index) => {
      console.log(`   ${String(index + 1).padStart(2)}. ${row.location} - ${row.count} awards`);
    });
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
  } finally {
    rl.close();
    console.log('\n👋 Database connection closed.');
  }
}

// Run the script
main().catch(console.error);