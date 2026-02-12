#!/usr/bin/env node

/**
 * COMPREHENSIVE LOCATION NAME STANDARDIZATIONS
 * ============================================
 * 
 * This file contains all location name fixes for event standardization
 * in the orchid awards database. Similar to exhibitor name fixes but for
 * the 'location' field.
 * 
 * PURPOSE: Clean up event location names to make them consistent for
 * filtering, display, and user experience.
 * 
 * CREATED: February 11, 2026
 */

/**
 * ALL LOCATION NAME STANDARDIZATIONS
 * Complete list of all location corrections to be applied to the database
 */
const allLocationNameFixes = {
  
  // ============================================================================
  // FILOLI HISTORIC HOUSE STANDARDIZATION
  // ============================================================================
  "Filoli": "Filoli Historic House",
  "Filoli Historic House Monthly": "Filoli Historic House",
  
  // ============================================================================
  // POS/GCCS SHOW STANDARDIZATION  
  // ============================================================================
  "POS/GCCS Show": "Peninsula Orchid Society and Gold Coast Cymbidium Society Show",
  
  // ============================================================================
  // SAN FRANCISCO STANDARDIZATION
  // ============================================================================
  "San Francisco Monthly": "San Francisco",
  "San Fransisco": "San Francisco", // Fix typo
  
  // ============================================================================
  // SANTA CLARA VALLEY OS STANDARDIZATION
  // ============================================================================
  "Santa Clara Valley OS Outreach Judging": "Santa Clara Valley OS Outreach",
  
  // ============================================================================
  // SONOMA COUNTY OS STANDARDIZATION
  // ============================================================================
  "Sonoma County OS Show": "Sonoma County Orchid Society Show",

};

/**
 * Function to apply all location name fixes to the database
 * @param {Object} database - Database instance
 * @returns {Object} - Results of the update operation
 */
function applyLocationNameFixes(database) {
  const results = {
    totalFixes: Object.keys(allLocationNameFixes).length,
    applied: 0,
    errors: [],
    details: []
  };

  const updateStmt = database.prepare(`
    UPDATE awards 
    SET location = ? 
    WHERE location = ?
  `);

  for (const [incorrectLocation, correctLocation] of Object.entries(allLocationNameFixes)) {
    try {
      const result = updateStmt.run(correctLocation, incorrectLocation);
      
      if (result.changes > 0) {
        results.applied++;
        results.details.push({
          from: incorrectLocation,
          to: correctLocation,
          recordsUpdated: result.changes
        });
        console.log(`✅ Updated "${incorrectLocation}" → "${correctLocation}" (${result.changes} records)`);
      } else {
        console.log(`ℹ️  No records found for "${incorrectLocation}"`);
      }
    } catch (error) {
      results.errors.push({
        incorrectLocation,
        correctLocation,
        error: error.message
      });
      console.error(`❌ Error updating "${incorrectLocation}":`, error.message);
    }
  }

  return results;
}

/**
 * Function to preview what changes would be made (dry run)
 * @param {Object} database - Database instance
 * @returns {Array} - List of potential changes
 */
function previewLocationNameFixes(database) {
  const preview = [];
  
  const selectStmt = database.prepare(`
    SELECT location, COUNT(*) as count 
    FROM awards 
    WHERE location = ? 
    GROUP BY location
  `);

  for (const [incorrectLocation, correctLocation] of Object.entries(allLocationNameFixes)) {
    const result = selectStmt.get(incorrectLocation);
    if (result) {
      preview.push({
        from: incorrectLocation,
        to: correctLocation,
        recordsToUpdate: result.count
      });
    }
  }

  return preview;
}

/**
 * STANDARDIZATION CATEGORIES BY TYPE
 */
const fixesByCategory = {
  filoli: [
    "Filoli → Filoli Historic House",
    "Filoli Historic House Monthly → Filoli Historic House"
  ],
  
  peninsulaGoldCoast: [
    "POS/GCCS Show → Peninsula Orchid Society and Gold Coast Cymbidium Society Show"
  ],
  
  sanFrancisco: [
    "San Francisco Monthly → San Francisco", 
    "San Fransisco → San Francisco (typo fix)"
  ],
  
  santaClaraValley: [
    "Santa Clara Valley OS Outreach Judging → Santa Clara Valley OS Outreach"
  ],
  
  sonomaCounty: [
    "Sonoma County OS Show → Sonoma County Orchid Society Show"
  ]
};

/**
 * SUMMARY STATISTICS
 */
const locationFixSummary = {
  totalFixes: Object.keys(allLocationNameFixes).length,
  categories: Object.keys(fixesByCategory).length,
  purpose: "Standardize location names for better filtering and user experience"
};

// Export for use in other scripts
module.exports = {
  allLocationNameFixes,
  applyLocationNameFixes,
  previewLocationNameFixes,
  fixesByCategory,
  locationFixSummary
};

// If run directly, show comprehensive summary
if (require.main === module) {
  console.log('🌍 ORCHID AWARDS DATABASE - LOCATION NAME STANDARDIZATION');
  console.log('==========================================================');
  console.log(`📅 Created: February 11, 2026`);
  console.log(`🔧 Total Fixes Defined: ${locationFixSummary.totalFixes}`);
  console.log(`🏷️  Categories: ${locationFixSummary.categories}`);
  console.log(`🎯 Purpose: ${locationFixSummary.purpose}\n`);
  
  console.log('📊 FIXES BY CATEGORY:');
  Object.entries(fixesByCategory).forEach(([category, fixes]) => {
    console.log(`\n${category.toUpperCase()}:`);
    fixes.forEach(fix => console.log(`   ✅ ${fix}`));
  });
  
  console.log('\n📋 ALL LOCATION FIXES:');
  Object.entries(allLocationNameFixes).forEach(([from, to], index) => {
    console.log(`   ${String(index + 1).padStart(2)}. "${from}" → "${to}"`);
  });
  
  console.log('\n💡 NEXT STEPS:');
  console.log('   1. Create and run runner script to apply fixes');
  console.log('   2. Verify changes with location verification script');
  console.log('   3. Check standardized location list in admin interface');
}