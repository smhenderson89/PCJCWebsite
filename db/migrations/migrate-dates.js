const Database = require('better-sqlite3');
const path = require('path');

// Convert text date to ISO format
function convertDateToISO(textDate) {
  if (!textDate || textDate.trim() === '') {
    return null;
  }
  
  try {
    const date = new Date(textDate);
    if (isNaN(date.getTime())) {
      console.log(`Failed to parse date: "${textDate}"`);
      return null;
    }
    return date.toISOString().split('T')[0]; // Get YYYY-MM-DD format
  } catch (error) {
    console.log(`Error converting date "${textDate}":`, error.message);
    return null;
  }
}

function runDateMigration() {
  const dbPath = path.join(__dirname, 'orchid_awards.sqlite');
  const db = new Database(dbPath);
  
  console.log('Starting date migration...');
  
  try {
    // Step 1: Add new column for ISO dates (if it doesn't exist)
    console.log('Checking for date_iso column...');
    try {
      db.exec('ALTER TABLE awards ADD COLUMN date_iso TEXT');
      console.log('Added date_iso column.');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('date_iso column already exists, continuing...');
      } else {
        throw error;
      }
    }
    
    // Step 2: Get all records with dates
    console.log('Reading existing dates...');
    const awards = db.prepare('SELECT id, date FROM awards WHERE date IS NOT NULL').all();
    console.log(`Found ${awards.length} records with dates`);
    
    // Step 3: Convert and update each record
    console.log('Converting dates...');
    const updateStmt = db.prepare('UPDATE awards SET date_iso = ? WHERE id = ?');
    
    let converted = 0;
    let failed = 0;
    
    for (const award of awards) {
      const isoDate = convertDateToISO(award.date);
      
      if (isoDate) {
        updateStmt.run(isoDate, award.id);
        converted++;
      } else {
        failed++;
        console.log(`Failed to convert: ID ${award.id}, Date: "${award.date}"`);
      }
    }
    
    console.log(`Conversion complete! Converted: ${converted}, Failed: ${failed}`);
    
    // Step 4: Verify results
    console.log('Verifying conversion...');
    const sampleResults = db.prepare(`
      SELECT id, date, date_iso 
      FROM awards 
      WHERE date_iso IS NOT NULL 
      ORDER BY date_iso DESC 
      LIMIT 5
    `).all();
    
    console.log('Sample converted dates:');
    sampleResults.forEach(row => {
      console.log(`ID ${row.id}: "${row.date}" → "${row.date_iso}"`);
    });
    
    // Step 5: Show sorting improvement
    console.log('\nTesting sort order...');
    const sortTest = db.prepare(`
      SELECT date, date_iso 
      FROM awards 
      WHERE date_iso IS NOT NULL 
      ORDER BY date_iso DESC 
      LIMIT 3
    `).all();
    
    console.log('New chronological order:');
    sortTest.forEach(row => {
      console.log(`"${row.date}" (${row.date_iso})`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
  
  console.log('\nMigration completed successfully!');
  console.log('You can now update your DatabaseService to use date_iso for sorting.');
}

// Run the migration
if (require.main === module) {
  runDateMigration();
}

module.exports = { runDateMigration, convertDateToISO };