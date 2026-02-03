/**
 * Orchid Awards Thumbnail Generator
 * Generates optimized thumbnails for award images
 * Target: 15-30KB per thumbnail, process 10 files from 2025
 */

const sharp = require('sharp');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs').promises;

class ThumbnailGenerator {
  constructor() {
    // Database connection
    this.dbPath = path.join(__dirname, '..', 'orchid_awards.sqlite');
    this.db = new Database(this.dbPath);
    
    // Paths
    this.imagesPath = path.join(__dirname, '..', 'images');
    this.thumbnailsPath = path.join(__dirname, '..', 'thumbnails');
    this.jpegPath = path.join(this.thumbnailsPath, 'jpeg');
    this.webpPath = path.join(this.thumbnailsPath, 'webp');
    this.jpegSmallPath = path.join(this.jpegPath, 'small');
    this.jpegMediumPath = path.join(this.jpegPath, 'medium');
    this.webpSmallPath = path.join(this.webpPath, 'small');
    this.webpMediumPath = path.join(this.webpPath, 'medium');
    
    // Thumbnail specifications
    this.sizes = {
      small: { width: 300, height: 400, targetSize: 20000 }, // ~20KB target
      medium: { width: 500, height: 667, targetSize: 25000 } // ~25KB target
    };
  }

  /**
   * Get all awards from 2025 for processing (excluding low-quality thumbs)
   */
  getAllAwards2025() {
    const stmt = this.db.prepare(`
      SELECT awardNum, photo 
      FROM awards 
      WHERE year = 2025 
      AND photo IS NOT NULL 
      AND photo != ''
      AND photo NOT LIKE '%thumb.jpg%'
      ORDER BY awardNum ASC
    `);
    return stmt.all();
  }

  /**
   * Get all awards from 2024 for processing (excluding low-quality thumbs)
   */
  getAllAwards2024() {
    const stmt = this.db.prepare(`
      SELECT awardNum, photo 
      FROM awards 
      WHERE year = 2024 
      AND photo IS NOT NULL 
      AND photo != ''
      AND photo NOT LIKE '%thumb.jpg%'
      ORDER BY awardNum ASC
    `);
    return stmt.all();
  }

  /**
   * Get all awards from specified year for processing (excluding low-quality thumbs)
   */
  getAllAwardsByYear(year) {
    const stmt = this.db.prepare(`
      SELECT awardNum, photo 
      FROM awards 
      WHERE year = ? 
      AND photo IS NOT NULL 
      AND photo != ''
      AND photo NOT LIKE '%thumb.jpg%'
      ORDER BY awardNum ASC
    `);
    return stmt.all(year);
  }

  /**
   * Scan images directory directly for files matching the year pattern
   * Returns array in same format as database query: {awardNum, photo}
   */
  async getImageFilesForYear(year) {
    try {
      const files = await fs.readdir(this.imagesPath);
      
      // Filter for files that start with the year and are image files
      const yearPattern = new RegExp(`^${year}\\d+\\.(jpg|jpeg|png|webp)$`, 'i');
      const imageFiles = files.filter(file => {
        return yearPattern.test(file) && !file.includes('thumb.jpg');
      });
      
      // Convert to same format as database results
      return imageFiles.map(filename => {
        const awardNum = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
        return {
          awardNum: awardNum,
          photo: `images/${filename}`
        };
      }).sort((a, b) => a.awardNum.localeCompare(b.awardNum));
      
    } catch (error) {
      console.error('Error reading images directory:', error);
      return [];
    }
  }

  /**
   * Check if original image file exists
   */
  async imageExists(photoPath) {
    try {
      // Handle path: database/images/file.jpg → ../images/file.jpg
      const cleanPath = photoPath.replace('database/images/', 'images/');
      const fullPath = path.join(__dirname, '..', cleanPath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate optimized WebP thumbnail with target file size
   */
  async generateWebPThumbnail(inputPath, outputPath, width, height, targetSize) {
    let quality = 85; // Start with good WebP quality
    let fileSize = 0;
    let attempts = 0;
    const maxAttempts = 8;

    while (attempts < maxAttempts) {
      try {
        await sharp(inputPath)
          .resize(width, height, {
            fit: 'cover',
            position: 'center'
          })
          .webp({
            quality: quality,
            effort: 6 // Higher effort for better compression
          })
          .toFile(outputPath);

        // Check file size
        const stats = await fs.stat(outputPath);
        fileSize = stats.size;

        // If within target range (10KB - 25KB for WebP), we're done
        if (fileSize >= 10000 && fileSize <= 25000) {
          break;
        }

        // Adjust quality based on file size
        if (fileSize > targetSize) {
          quality -= 8; // Reduce quality if too large
        } else if (fileSize < 10000) {
          quality += 5; // Increase quality if too small
        } else {
          break; // Good enough
        }

        attempts++;
        
        // Ensure quality stays in reasonable range
        quality = Math.max(20, Math.min(95, quality));
        
      } catch (error) {
        console.error(`Error generating WebP thumbnail: ${error.message}`);
        throw error;
      }
    }

    return { fileSize, quality, attempts };
  }

  /**
   * Generate optimized thumbnail with target file size
   */
  async generateThumbnail(inputPath, outputPath, width, height, targetSize) {
    let quality = 90; // Start with high quality
    let fileSize = 0;
    let attempts = 0;
    const maxAttempts = 8;

    while (attempts < maxAttempts) {
      try {
        await sharp(inputPath)
          .resize(width, height, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({
            quality: quality,
            progressive: true,
            mozjpeg: true
          })
          .toFile(outputPath);

        // Check file size
        const stats = await fs.stat(outputPath);
        fileSize = stats.size;

        // If within target range (15KB - 35KB), we're done
        if (fileSize >= 15000 && fileSize <= 35000) {
          break;
        }

        // Adjust quality based on file size
        if (fileSize > targetSize) {
          quality -= 10; // Reduce quality if too large
        } else if (fileSize < 15000) {
          quality += 5; // Increase quality if too small
        } else {
          break; // Good enough
        }

        attempts++;
        
        // Ensure quality stays in reasonable range
        quality = Math.max(30, Math.min(95, quality));
        
      } catch (error) {
        console.error(`Error generating thumbnail: ${error.message}`);
        throw error;
      }
    }

    return { fileSize, quality, attempts };
  }

  /**
   * Process a single award image with error recovery
   */
  async processAward(award, index, total) {
    const { awardNum, photo } = award;
    
    // Progress indicator
    const progress = `[${index + 1}/${total}]`;
    
    if (!photo) {
      console.log(`${progress} ⚠️  Award ${awardNum}: No photo path`);
      return { awardNum, status: 'no_photo' };
    }

    // Check if thumbnails already exist (skip if they do)
    const jpegFilename = `${awardNum}.jpg`;
    const webpFilename = `${awardNum}.webp`;
    const smallJpegPath = path.join(this.jpegSmallPath, jpegFilename);
    const webpSmallPath = path.join(this.webpSmallPath, webpFilename);
    
    try {
      await fs.access(smallJpegPath);
      await fs.access(webpSmallPath);
      console.log(`${progress} ⏭️  Award ${awardNum}: Thumbnails already exist, skipping`);
      return { awardNum, status: 'skipped' };
    } catch {
      // Thumbnails don't exist, continue processing
    }

    // Check if original image exists
    const cleanPath = photo.replace('database/images/', 'images/');
    const originalPath = path.join(__dirname, '..', cleanPath);
    if (!(await this.imageExists(photo))) {
      console.log(`${progress} ⚠️  Award ${awardNum}: Image not found at ${photo}`);
      return { awardNum, status: 'not_found', photo };
    }

    try {
      const jpegFilename = `${awardNum}.jpg`;
      const webpFilename = `${awardNum}.webp`;
      
      const smallOutput = path.join(this.jpegSmallPath, jpegFilename);
      const mediumOutput = path.join(this.jpegMediumPath, jpegFilename);
      const webpSmallOutput = path.join(this.webpSmallPath, webpFilename);
      const webpMediumOutput = path.join(this.webpMediumPath, webpFilename);

      console.log(`${progress} 🔄 Processing Award ${awardNum}...`);

      // Generate JPEG thumbnails
      const smallResult = await this.generateThumbnail(
        originalPath,
        smallOutput,
        this.sizes.small.width,
        this.sizes.small.height,
        this.sizes.small.targetSize
      );

      const mediumResult = await this.generateThumbnail(
        originalPath,
        mediumOutput,
        this.sizes.medium.width,
        this.sizes.medium.height,
        this.sizes.medium.targetSize
      );

      // Generate WebP thumbnails
      const webpSmallResult = await this.generateWebPThumbnail(
        originalPath,
        webpSmallOutput,
        this.sizes.small.width,
        this.sizes.small.height,
        this.sizes.small.targetSize * 0.7 // Target 30% smaller for WebP
      );

      const webpMediumResult = await this.generateWebPThumbnail(
        originalPath,
        webpMediumOutput,
        this.sizes.medium.width,
        this.sizes.medium.height,
        this.sizes.medium.targetSize * 0.7 // Target 30% smaller for WebP
      );

      // Get original file size for comparison
      const originalStats = await fs.stat(originalPath);
      const originalSize = originalStats.size;

      // Calculate total sizes
      const totalJpegSize = smallResult.fileSize + mediumResult.fileSize;
      const totalWebpSize = webpSmallResult.fileSize + webpMediumResult.fileSize;

      console.log(`${progress} ✅ Award ${awardNum} completed - JPEG: ${(totalJpegSize / 1024).toFixed(1)}KB, WebP: ${(totalWebpSize / 1024).toFixed(1)}KB (${((totalJpegSize - totalWebpSize) / totalJpegSize * 100).toFixed(1)}% smaller)`);

      // Brief pause to prevent overwhelming the system
      if (index % 10 === 9) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms pause every 10 images
      }

      return {
        awardNum,
        status: 'success',
        original: {
          size: originalSize,
          path: photo
        },
        jpeg: {
          small: {
            size: smallResult.fileSize,
            quality: smallResult.quality,
            path: `thumbnails/jpeg/small/${jpegFilename}`
          },
          medium: {
            size: mediumResult.fileSize,
            quality: mediumResult.quality,
            path: `thumbnails/jpeg/medium/${jpegFilename}`
          }
        },
        webp: {
          small: {
            size: webpSmallResult.fileSize,
            quality: webpSmallResult.quality,
            path: `thumbnails/webp/small/${webpFilename}`
          },
          medium: {
            size: webpMediumResult.fileSize,
            quality: webpMediumResult.quality,
            path: `thumbnails/webp/medium/${webpFilename}`
          }
        }
      };

    } catch (error) {
      console.error(`${progress} ❌ Error processing Award ${awardNum}: ${error.message}`);
      return { awardNum, status: 'error', error: error.message };
    }
  }

  /**
   * Update database with thumbnail paths (for future implementation)
   */
  updateDatabase(results) {
    console.log('\n📊 Final Processing Summary:');
    
    let successful = 0;
    let skipped = 0;
    let notFound = 0;
    let errors = 0;
    let totalOriginalSize = 0;
    let totalJpegSize = 0;
    let totalWebpSize = 0;

    results.forEach(result => {
      switch(result.status) {
        case 'success':
          successful++;
          totalOriginalSize += result.original.size;
          totalJpegSize += result.jpeg.small.size + result.jpeg.medium.size;
          totalWebpSize += result.webp.small.size + result.webp.medium.size;
          break;
        case 'skipped':
          skipped++;
          break;
        case 'not_found':
          notFound++;
          break;
        case 'error':
          errors++;
          break;
      }
    });

    console.log(`✅ Successfully processed: ${successful} awards`);
    console.log(`⏭️ Skipped (already exist): ${skipped} awards`);
    console.log(`⚠️ Images not found: ${notFound} awards`);
    console.log(`❌ Processing errors: ${errors} awards`);
    console.log(`📏 Total original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📏 Total JPEG thumbnails: ${(totalJpegSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📏 Total WebP thumbnails: ${(totalWebpSize / 1024 / 1024).toFixed(2)}MB`);
    
    if (totalOriginalSize > 0) {
      console.log(`💾 JPEG vs Original: ${((totalOriginalSize - totalJpegSize) / totalOriginalSize * 100).toFixed(1)}% smaller`);
      console.log(`💾 WebP vs Original: ${((totalOriginalSize - totalWebpSize) / totalOriginalSize * 100).toFixed(1)}% smaller`);
      console.log(`💾 WebP vs JPEG: ${((totalJpegSize - totalWebpSize) / totalJpegSize * 100).toFixed(1)}% smaller`);
    }
    
    // Note: Database integration is handled by a separate module
    console.log('\n💡 For database integration, use:');
    console.log('   node functions/thumbnail-database-integration.js');
    console.log('   or');
    console.log('   node functions/thumbnail-utils.js integrate');
  }

  /**
   * Main processing function
   */
  async run(year = 2024) {
    try {
      console.log('🚀 Starting Thumbnail Generation Pipeline');
      console.log(`📂 Images path: ${this.imagesPath}`);
      console.log(`📂 Output path: ${this.thumbnailsPath}`);
      console.log('🎯 Target: 15-30KB per thumbnail');
      console.log('🚫 Excluding low-quality thumb.jpg files\n');

      // Get all image files for the specified year (scan filesystem directly)
      const awards = await this.getImageFilesForYear(year);
      console.log(`📋 Found ${awards.length} image files from ${year} to process\n`);

      // Process each award with progress tracking
      const results = [];
      for (let i = 0; i < awards.length; i++) {
        const award = awards[i];
        const result = await this.processAward(award, i, awards.length);
        results.push(result);
        
        // Show progress summary every 20 items
        if ((i + 1) % 20 === 0) {
          const successful = results.filter(r => r.status === 'success').length;
          const skipped = results.filter(r => r.status === 'skipped').length;
          const errors = results.filter(r => r.status === 'error').length;
          console.log(`📊 Progress: ${i + 1}/${awards.length} - ✅ ${successful} success, ⏭️ ${skipped} skipped, ❌ ${errors} errors\n`);
        }
      }

      // Update database and show summary
      this.updateDatabase(results);

    } catch (error) {
      console.error(`💥 Pipeline error: ${error.message}`);
    } finally {
      this.db.close();
    }
  }
}

// Check if Sharp is available
async function checkDependencies() {
  try {
    await sharp();
    return true;
  } catch (error) {
    console.error('❌ Sharp not installed. Install with: npm install sharp');
    return false;
  }
}

// Run the thumbnail generator
async function main() {
  if (await checkDependencies()) {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let year = 2024; // default year
    
    if (args.length > 0) {
      const yearArg = parseInt(args[0], 10);
      if (isNaN(yearArg) || yearArg < 2000 || yearArg > new Date().getFullYear()) {
        console.error(`❌ Invalid year: ${args[0]}. Please provide a year between 2000 and ${new Date().getFullYear()}`);
        console.log('Usage: node thumbnail-generator.js [year]');
        console.log('Example: node thumbnail-generator.js 2025');
        process.exit(1);
      }
      year = yearArg;
    }
    
    console.log(`🎯 Processing thumbnails for year: ${year}\n`);
    
    const generator = new ThumbnailGenerator();
    await generator.run(year);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ThumbnailGenerator;