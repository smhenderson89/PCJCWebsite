#!/usr/bin/env node

/**
 * Verification script to check exhibitor names after fixes have been applied
 * This script will show current exhibitor name counts and identify any remaining duplicates
 */

const Database = require('better-sqlite3');
const path = require('path');

// Path to database
const dbPath = path.join(__dirname, '..', 'orchid_awards.sqlite');

function main() {
  console.log('📊 Exhibitor Name Verification Report');
  console.log('====================================\n');
  
  try {
    // Connect to database
    const db = Database(dbPath);
    
    // Get all unique exhibitor names with their counts
    const exhibitorCounts = db.prepare(`
      SELECT exhibitor, COUNT(*) as award_count 
      FROM awards 
      WHERE exhibitor IS NOT NULL AND exhibitor != ''
      GROUP BY exhibitor 
      ORDER BY exhibitor
    `).all();
    
    console.log(`📈 Total unique exhibitors: ${exhibitorCounts.length}`);
    console.log(`📈 Total awards with exhibitors: ${exhibitorCounts.reduce((sum, row) => sum + row.award_count, 0)}\n`);
    
    // Show all exhibitors (useful for spotting remaining issues)
    console.log('📋 All Exhibitor Names:');
    console.log('======================');
    exhibitorCounts.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(3)}. ${row.exhibitor} (${row.award_count} awards)`);
    });
    
    // Look for potential remaining duplicates (similar names)
    console.log('\n🔍 Potential Duplicate Detection:');
    console.log('=================================');
    
    const potentialDuplicates = [];
    const exhibitorNames = exhibitorCounts.map(row => row.exhibitor);
    
    for (let i = 0; i < exhibitorNames.length; i++) {
      for (let j = i + 1; j < exhibitorNames.length; j++) {
        const name1 = exhibitorNames[i].toLowerCase();
        const name2 = exhibitorNames[j].toLowerCase();
        
        // Simple similarity checks
        const similarity = getSimilarity(name1, name2);
        if (similarity > 0.8) { // 80% similarity threshold
          potentialDuplicates.push({
            name1: exhibitorNames[i],
            name2: exhibitorNames[j],
            similarity: Math.round(similarity * 100)
          });
        }
      }
    }
    
    if (potentialDuplicates.length > 0) {
      console.log('\n⚠️  Found potential duplicates:');
      potentialDuplicates.forEach(dup => {
        console.log(`   📍 "${dup.name1}" ↔ "${dup.name2}" (${dup.similarity}% similar)`);
      });
    } else {
      console.log('✅ No obvious duplicate names detected!');
    }
    
    // Show top exhibitors by award count
    console.log('\n🏆 Top Exhibitors by Award Count:');
    console.log('=================================');
    const topExhibitors = exhibitorCounts
      .sort((a, b) => b.award_count - a.award_count)
      .slice(0, 10);
    
    topExhibitors.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${row.exhibitor} - ${row.award_count} awards`);
    });
    
    db.close();
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

/**
 * Simple string similarity calculation using Levenshtein distance
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} Similarity ratio between 0 and 1
 */
function getSimilarity(str1, str2) {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  const distance = track[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
}

// Run the script
main();