#!/usr/bin/env node

/**
 * Location Name Verification Script
 * =================================
 * 
 * Analyzes all location names in the orchid awards database to verify standardization
 * and detect potential duplicates or inconsistencies.
 */

const Database = require('better-sqlite3');
const path = require('path');

// Path to database
const dbPath = path.join(__dirname, '..', '..', 'orchid_awards.sqlite');

function findPotentialDuplicates(locations) {
  const duplicates = [];
  
  for (let i = 0; i < locations.length; i++) {
    const current = locations[i];
    
    for (let j = i + 1; j < locations.length; j++) {
      const other = locations[j];
      
      // Check for similar names using various criteria
      const currentLower = current.location.toLowerCase();
      const otherLower = other.location.toLowerCase();
      
      // Check for substring matches (one contains the other)
      if (currentLower.includes(otherLower) || otherLower.includes(currentLower)) {
        duplicates.push({
          location1: current.location,
          count1: current.count,
          location2: other.location,
          count2: other.count,
          reason: 'Substring match'
        });
      }
      
      // Check for abbreviation patterns
      if (currentLower.includes(' os ') && otherLower.includes('orchid society') ||
          otherLower.includes(' os ') && currentLower.includes('orchid society')) {
        duplicates.push({
          location1: current.location,
          count1: current.count,
          location2: other.location,
          count2: other.count,
          reason: 'OS abbreviation pattern'
        });
      }
      
      // Check for common typos/variations
      const distance = levenshteinDistance(currentLower, otherLower);
      if (distance <= 3 && Math.abs(current.location.length - other.location.length) <= 3) {
        duplicates.push({
          location1: current.location,
          count1: current.count,
          location2: other.location,
          count2: other.count,
          reason: `Similar spelling (edit distance: ${distance})`
        });
      }
    }
  }
  
  return duplicates;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function main() {
  console.log('📊 Location Name Verification Report');
  console.log('====================================');

  try {
    // Connect to database
    const db = Database(dbPath);
    
    // Get all unique locations with counts
    const locations = db.prepare(`
      SELECT location, COUNT(*) as count
      FROM awards 
      WHERE location IS NOT NULL AND location != ''
      GROUP BY location 
      ORDER BY count DESC
    `).all();
    
    const totalAwards = db.prepare(`
      SELECT COUNT(*) as total
      FROM awards 
      WHERE location IS NOT NULL AND location != ''
    `).get();
    
    console.log(`\n📈 Total unique locations: ${locations.length}`);
    console.log(`📈 Total awards with locations: ${totalAwards.total}\n`);
    
    // Show all locations
    console.log('📋 All Event Locations:');
    console.log('=======================');
    locations.forEach((row, index) => {
      console.log(`${String(index + 1).padStart(3)}. ${row.location} (${row.count} awards)`);
    });
    
    // Find potential duplicates
    console.log('\n🔍 Potential Duplicate Detection:');
    console.log('=================================');
    
    const duplicates = findPotentialDuplicates(locations);
    
    if (duplicates.length === 0) {
      console.log('✅ No obvious duplicate location names detected!');
    } else {
      console.log(`⚠️  Found ${duplicates.length} potential duplicate pairs:\n`);
      
      duplicates.forEach((dup, index) => {
        console.log(`${index + 1}. "${dup.location1}" (${dup.count1} awards)`);
        console.log(`   "${dup.location2}" (${dup.count2} awards)`); 
        console.log(`   Reason: ${dup.reason}\n`);
      });
    }
    
    // Show top locations
    console.log('\n🏆 Top Event Locations by Award Count:');
    console.log('=====================================');
    const topLocations = locations.slice(0, 15);
    topLocations.forEach((row, index) => {
      console.log(`${String(index + 1).padStart(2)}. ${row.location} - ${row.count} awards`);
    });
    
    // Location statistics
    const avgAwardsPerLocation = (totalAwards.total / locations.length).toFixed(1);
    const locationsWithOneAward = locations.filter(loc => loc.count === 1).length;
    const locationsWithManyAwards = locations.filter(loc => loc.count >= 10).length;
    
    console.log('\n📊 Location Statistics:');
    console.log('=======================');
    console.log(`Average awards per location: ${avgAwardsPerLocation}`);
    console.log(`Locations with only 1 award: ${locationsWithOneAward}`);
    console.log(`Locations with 10+ awards: ${locationsWithManyAwards}`);
    
    console.log('\n✅ Verification complete!');
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  }
}

// Run the verification
main();