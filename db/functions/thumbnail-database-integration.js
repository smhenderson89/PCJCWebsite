/**
 * Thumbnail Database Integration
 * Handles database schema updates and thumbnail path integration
 * Separate from thumbnail generation for clean architecture
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs').promises;

class ThumbnailDatabaseIntegration {
  constructor(dbPath = null) {
    // Database connection
    this.dbPath = dbPath || path.join(__dirname, '..', 'orchid_awards.sqlite');
    this.db = new Database(this.dbPath);
    
    // Paths
    this.thumbnailsPath = path.join(__dirname, '..', 'thumbnails');
    this.jpegPath = path.join(this.thumbnailsPath, 'jpeg');
    this.webpPath = path.join(this.thumbnailsPath, 'webp');
    this.jpegSmallPath = path.join(this.jpegPath, 'small');
    this.jpegMediumPath = path.join(this.jpegPath, 'medium');
    this.webpSmallPath = path.join(this.webpPath, 'small');
    this.webpMediumPath = path.join(this.webpPath, 'medium');
  }

  /**
   * Main function - Complete database integration for thumbnails
   */
  async integrateAllThumbnails() {
    try {
      console.log('🗄️  Starting Complete Thumbnail Database Integration');
      console.log('================================================\n');

      // Step 1: Check and add thumbnail columns to the database
      await this.addThumbnailColumns();

      // Step 2: Find all existing thumbnails on disk
      const existingThumbnails = await this.findExistingThumbnails();
      console.log(`📁 Found ${existingThumbnails.length} awards with complete thumbnail sets\n`);

      // Step 3: Update database records with thumbnail paths
      const updateResult = await this.updateThumbnailPaths(existingThumbnails);

      // Step 4: Generate summary report
      await this.generateIntegrationReport(updateResult);

      console.log('\n✅ Database integration completed successfully!');
      return { 
        success: true, 
        totalThumbnails: existingThumbnails.length,
        updated: updateResult.updated,
        alreadyHasThumbnails: updateResult.alreadyHasThumbnails,
        skipped: updateResult.skipped,
        errors: updateResult.errors
      };

    } catch (error) {
      console.error(`❌ Database integration failed: ${error.message}`);
      throw error;
    } finally {
      this.close();
    }
  }

  /**
   * Add thumbnail columns to the database if they don't exist
   */
  async addThumbnailColumns() {
    console.log('🔧 Checking and adding thumbnail columns...');
    
    // Check if columns already exist
    const tableInfo = this.db.prepare("PRAGMA table_info(awards)").all();
    const existingColumns = tableInfo.map(col => col.name);
    
    const thumbnailColumns = [
      'thumbnail_jpeg_small',
      'thumbnail_jpeg_medium', 
      'thumbnail_webp_small',
      'thumbnail_webp_medium'
    ];
    
    const columnsToAdd = thumbnailColumns.filter(col => !existingColumns.includes(col));
    
    if (columnsToAdd.length === 0) {
      console.log('✓ All thumbnail columns already exist');
      return { added: 0, existing: thumbnailColumns.length };
    }

    // Add missing columns
    for (const column of columnsToAdd) {
      try {
        this.db.prepare(`ALTER TABLE awards ADD COLUMN ${column} TEXT`).run();
        console.log(`✓ Added column: ${column}`);
      } catch (error) {
        console.error(`❌ Failed to add column ${column}: ${error.message}`);
        throw error;
      }
    }
    
    console.log(`✅ Added ${columnsToAdd.length} thumbnail columns to database\n`);
    return { added: columnsToAdd.length, existing: thumbnailColumns.length - columnsToAdd.length };
  }

  /**
   * Find all awards that have complete thumbnail sets on disk
   */
  async findExistingThumbnails() {
    console.log('🔍 Scanning for existing thumbnails...');
    
    const thumbnailSets = [];

    try {
      // Get all JPEG small thumbnails as the base list
      const jpegSmallFiles = await fs.readdir(this.jpegSmallPath);
      
      for (const filename of jpegSmallFiles) {
        if (!filename.endsWith('.jpg')) continue;
        
        const awardNum = filename.replace('.jpg', '');
        const webpFilename = awardNum + '.webp';
        
        // Check if all four thumbnail variants exist
        const requiredFiles = [
          path.join(this.jpegSmallPath, filename),
          path.join(this.jpegMediumPath, filename),
          path.join(this.webpSmallPath, webpFilename),
          path.join(this.webpMediumPath, webpFilename)
        ];
        
        let allExist = true;
        for (const filePath of requiredFiles) {
          try {
            await fs.access(filePath);
          } catch {
            allExist = false;
            break;
          }
        }
        
        if (allExist) {
          thumbnailSets.push({
            awardNum,
            jpegSmall: `thumbnails/jpeg/small/${filename}`,
            jpegMedium: `thumbnails/jpeg/medium/${filename}`,
            webpSmall: `thumbnails/webp/small/${webpFilename}`,
            webpMedium: `thumbnails/webp/medium/${webpFilename}`
          });
        }
      }
      
      console.log(`✓ Found ${thumbnailSets.length} complete thumbnail sets`);
      return thumbnailSets;
      
    } catch (error) {
      console.error(`❌ Error scanning thumbnails: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update database records with thumbnail paths
   */
  async updateThumbnailPaths(thumbnailSets) {
    console.log('💾 Updating database with thumbnail paths...');
    
    if (thumbnailSets.length === 0) {
      console.log('⚠️  No thumbnail sets to update');
      return { updated: 0, errors: 0, skipped: 0 };
    }

    // Prepare statements
    const updateStmt = this.db.prepare(`
      UPDATE awards 
      SET thumbnail_jpeg_small = ?, 
          thumbnail_jpeg_medium = ?, 
          thumbnail_webp_small = ?, 
          thumbnail_webp_medium = ?
      WHERE awardNum = ?
    `);

    const checkStmt = this.db.prepare('SELECT awardNum FROM awards WHERE awardNum = ?');
    
    // Check for existing thumbnails in database
    const checkThumbnailsStmt = this.db.prepare(`
      SELECT awardNum, thumbnail_jpeg_small, thumbnail_jpeg_medium, 
             thumbnail_webp_small, thumbnail_webp_medium 
      FROM awards 
      WHERE awardNum = ?
    `);

    let updated = 0;
    let errors = 0;
    let skipped = 0;
    let alreadyHasThumbnails = 0;

    // Process in batches for better performance
    const batchSize = 50;
    for (let i = 0; i < thumbnailSets.length; i += batchSize) {
      const batch = thumbnailSets.slice(i, i + batchSize);
      
      const transaction = this.db.transaction(() => {
        for (const thumbnail of batch) {
          try {
            // Check if award exists in database
            const award = checkThumbnailsStmt.get(thumbnail.awardNum);
            if (!award) {
              console.log(`⚠️  Award ${thumbnail.awardNum} not found in database, skipping`);
              skipped++;
              continue;
            }

            // Check if award already has thumbnails
            if (award.thumbnail_jpeg_small && 
                award.thumbnail_jpeg_medium && 
                award.thumbnail_webp_small && 
                award.thumbnail_webp_medium) {
              
              // Only show first 10 to avoid spam
              if (alreadyHasThumbnails < 10) {
                console.log(`ℹ️  Award ${thumbnail.awardNum} already has thumbnails, skipping`);
              }
              alreadyHasThumbnails++;
              continue;
            }

            const result = updateStmt.run(
              thumbnail.jpegSmall,
              thumbnail.jpegMedium,
              thumbnail.webpSmall,
              thumbnail.webpMedium,
              thumbnail.awardNum
            );
            
            if (result.changes > 0) {
              // Only show first 20 updates to avoid spam
              if (updated < 20) {
                console.log(`✅ Updated award ${thumbnail.awardNum} with thumbnail paths`);
              }
              updated++;
            }
          } catch (error) {
            console.error(`❌ Failed to update award ${thumbnail.awardNum}: ${error.message}`);
            errors++;
          }
        }
      });
      
      transaction();
      
      // Progress indicator
      if ((i + batchSize) % 100 === 0 || i + batchSize >= thumbnailSets.length) {
        const processed = Math.min(i + batchSize, thumbnailSets.length);
        console.log(`   📊 Progress: ${processed}/${thumbnailSets.length} processed`);
      }
    }

    console.log(`✅ Database update completed:`);
    console.log(`   Updated: ${updated} records`);
    console.log(`   Already had thumbnails: ${alreadyHasThumbnails} records`);
    console.log(`   Skipped: ${skipped} records (not found in DB)`);
    console.log(`   Errors: ${errors} records`);
    
    return { updated, errors, skipped, alreadyHasThumbnails };
  }

  /**
   * Generate a comprehensive integration report
   */
  async generateIntegrationReport(updateResult) {
    console.log('\n📊 Integration Report');
    console.log('==================');

    try {
      // Get awards with thumbnails
      const thumbnailQuery = this.db.prepare(`
        SELECT COUNT(*) as count, year 
        FROM awards 
        WHERE thumbnail_jpeg_small IS NOT NULL 
        GROUP BY year 
        ORDER BY year DESC
      `);
      const thumbnailsByYear = thumbnailQuery.all();

      console.log('\n📈 Thumbnails by Year:');
      thumbnailsByYear.forEach(row => {
        console.log(`   ${row.year}: ${row.count} awards with thumbnails`);
      });

      // Get total stats
      const totalWithThumbnails = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM awards 
        WHERE thumbnail_jpeg_small IS NOT NULL
      `).get();

      const totalAwards = this.db.prepare('SELECT COUNT(*) as count FROM awards').get();

      console.log(`\n📋 Summary Statistics:`);
      console.log(`   Total awards in database: ${totalAwards.count}`);
      console.log(`   Awards with thumbnails: ${totalWithThumbnails.count}`);
      console.log(`   Coverage: ${((totalWithThumbnails.count / totalAwards.count) * 100).toFixed(1)}%`);

      // File size estimation
      const thumbnailCount = totalWithThumbnails.count * 4; // 4 thumbnails per award
      const estimatedSize = (thumbnailCount * 25) / 1024; // ~25KB per thumbnail
      console.log(`   Estimated thumbnail storage: ${estimatedSize.toFixed(1)}MB`);

    } catch (error) {
      console.error(`⚠️  Could not generate full report: ${error.message}`);
    }
  }

  /**
   * Utility: Check thumbnail status for specific awards
   */
  checkThumbnailStatus(awardNums = []) {
    const query = awardNums.length > 0 
      ? this.db.prepare(`
          SELECT awardNum, photo, thumbnail_jpeg_small, thumbnail_webp_small
          FROM awards 
          WHERE awardNum IN (${awardNums.map(() => '?').join(',')})
        `)
      : this.db.prepare(`
          SELECT awardNum, photo, thumbnail_jpeg_small, thumbnail_webp_small
          FROM awards 
          WHERE year = 2025
          LIMIT 10
        `);

    const results = awardNums.length > 0 ? query.all(...awardNums) : query.all();
    
    console.log('\n🔍 Thumbnail Status Check:');
    results.forEach(row => {
      const hasPhoto = !!row.photo;
      const hasJpegThumb = !!row.thumbnail_jpeg_small;
      const hasWebpThumb = !!row.thumbnail_webp_small;
      
      const status = hasJpegThumb && hasWebpThumb ? '✅' : 
                     hasPhoto ? '⚠️ ' : '❌';
      
      console.log(`   ${status} Award ${row.awardNum}: Photo=${hasPhoto ? 'Yes' : 'No'}, Thumbnails=${hasJpegThumb && hasWebpThumb ? 'Yes' : 'No'}`);
    });

    return results;
  }

  /**
   * Clean up database connection
   */
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Main execution function
async function main() {
  const integration = new ThumbnailDatabaseIntegration();
  
  try {
    await integration.integrateAllThumbnails();
  } catch (error) {
    console.error('Integration failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ThumbnailDatabaseIntegration;