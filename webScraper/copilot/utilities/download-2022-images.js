const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const https = require('https');

class Awards2022ImageDownloader {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.year = '2022';
        
        // Directory paths
        this.htmlDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year, 'html');
        this.imagesDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year, 'images');
        this.thumbnailsDir = path.join(this.imagesDir, 'thumbnails');
        this.jsonDir = path.join(this.baseDir, 'savedData', this.year, 'json');
        
        // Ensure all directories exist
        fs.ensureDirSync(this.imagesDir);
        fs.ensureDirSync(this.thumbnailsDir);
        fs.ensureDirSync(this.jsonDir);
        
        // Rate limiting configuration
        this.config = {
            delayBetweenRequests: 1500, // 1.5 seconds between requests
            timeout: 15000,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        };
        
        this.results = {
            fullImages: [],
            thumbnailImages: [],
            skipped: [],
            errors: []
        };
        
        this.imageRegistry = new Set(); // Track processed images to avoid duplicates
    }

    async downloadAll2022Images() {
        console.log('🚀 Starting 2022 Awards Image Download Process\n');
        console.log('📋 This will:');
        console.log('   1. 📁 Scan all HTML files in the 2022 directory');
        console.log('   2. 🔍 Extract image references (full-size and thumbnails)');
        console.log('   3. 📥 Download full-size images to /images folder');
        console.log('   4. 🖼️  Download thumbnail images to /images/thumbnails folder');
        console.log('   5. ✅ Generate comprehensive download report\n');

        try {
            // Step 1: Get all HTML files
            console.log('📁 Step 1: Scanning HTML files...');
            const htmlFiles = await this.getHtmlFiles();
            console.log(`   Found ${htmlFiles.length} HTML files to process\n`);
            
            // Step 2: Extract images from all HTML files
            console.log('🔍 Step 2: Extracting image references...');
            const imageData = await this.extractAllImages(htmlFiles);
            console.log(`   Found ${imageData.fullImages.size} unique full images`);
            console.log(`   Found ${imageData.thumbnails.size} unique thumbnail images\n`);
            
            // Step 3: Download full-size images
            console.log('📥 Step 3: Downloading full-size images...');
            await this.downloadImageSet(imageData.fullImages, this.imagesDir, 'full-size');
            
            // Step 4: Download thumbnail images
            console.log('🖼️  Step 4: Downloading thumbnail images...');
            await this.downloadImageSet(imageData.thumbnails, this.thumbnailsDir, 'thumbnail');
            
            // Step 5: Generate report
            console.log('✅ Step 5: Generating download report...');
            this.generateImageReport();
            
        } catch (error) {
            console.error('❌ Error in image download process:', error);
            throw error;
        }
    }

    async getHtmlFiles() {
        const files = await fs.readdir(this.htmlDir);
        return files.filter(file => file.endsWith('.html') && file !== '2022-index.html')
                   .map(file => path.join(this.htmlDir, file));
    }

    async extractAllImages(htmlFiles) {
        const fullImages = new Set();
        const thumbnails = new Set();
        
        for (const [index, filePath] of htmlFiles.entries()) {
            const fileName = path.basename(filePath);
            console.log(`   📄 Processing ${index + 1}/${htmlFiles.length}: ${fileName}`);
            
            try {
                const content = await fs.readFile(filePath, 'utf8');
                const $ = cheerio.load(content);
                
                // Extract image sources
                $('img[src]').each((i, element) => {
                    const src = $(element).attr('src');
                    if (src && (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png'))) {
                        // Determine the date folder from the filename
                        const dateFolder = this.extractDateFolder(fileName, src);
                        
                        if (src.includes('thumb')) {
                            thumbnails.add({ src, dateFolder, sourceFile: fileName });
                        } else {
                            fullImages.add({ src, dateFolder, sourceFile: fileName });
                        }
                    }
                });
                
            } catch (error) {
                console.log(`      ❌ Error processing ${fileName}: ${error.message}`);
            }
        }
        
        // Convert sets to arrays with unique entries
        return {
            fullImages: Array.from(fullImages),
            thumbnails: Array.from(thumbnails)
        };
    }

    extractDateFolder(htmlFileName, imageSrc) {
        // Extract date folder from HTML filename or image path
        // Most images will be in date folders like 20220219, 20220224, etc.
        
        if (htmlFileName.match(/^(\d{8})/)) {
            return htmlFileName.match(/^(\d{8})/)[1];
        }
        
        // For award files like 20225301.html, extract the date part
        if (htmlFileName.match(/^(2022\d{4})/)) {
            const awardNum = htmlFileName.match(/^(2022\d{4})/)[1];
            // Map award numbers to their date folders based on common patterns
            // This might need adjustment based on actual file structure
            if (awardNum.startsWith('20225301') || awardNum.startsWith('20225302') || 
                awardNum.startsWith('20225303') || awardNum.startsWith('20225304') || 
                awardNum.startsWith('20225305')) {
                return '20220219';
            } else if (awardNum.startsWith('20225401')) {
                return '20220224';
            }
            // Add more mappings as needed
        }
        
        return 'unknown';
    }

    async downloadImageSet(imageArray, targetDir, imageType) {
        let downloaded = 0;
        let skipped = 0;
        let failed = 0;
        
        for (const [index, imageInfo] of imageArray.entries()) {
            const { src, dateFolder, sourceFile } = imageInfo;
            const fileName = path.basename(src);
            const localPath = path.join(targetDir, fileName);
            
            // Check if file already exists
            if (fs.existsSync(localPath)) {
                console.log(`   ⏭️  Skipping ${index + 1}/${imageArray.length}: ${fileName} (already exists)`);
                skipped++;
                this.results.skipped.push({
                    fileName,
                    type: imageType,
                    reason: 'already exists'
                });
                continue;
            }
            
            try {
                console.log(`   📷 Downloading ${index + 1}/${imageArray.length}: ${fileName} (${imageType})`);
                
                // Construct the full URL
                const imageUrl = `https://www.paccentraljc.org/${dateFolder}/${src}`;
                
                const imageBuffer = await this.downloadImageUrl(imageUrl);
                await fs.writeFile(localPath, imageBuffer);
                
                if (imageType === 'full-size') {
                    this.results.fullImages.push({
                        fileName,
                        url: imageUrl,
                        localPath,
                        dateFolder,
                        sourceFile,
                        size: imageBuffer.length
                    });
                } else {
                    this.results.thumbnailImages.push({
                        fileName,
                        url: imageUrl,
                        localPath,
                        dateFolder,
                        sourceFile,
                        size: imageBuffer.length
                    });
                }
                
                downloaded++;
                console.log(`      ✅ Saved: ${fileName} (${this.formatBytes(imageBuffer.length)})`);
                
                // Rate limiting
                await this.delay(this.config.delayBetweenRequests);
                
            } catch (error) {
                failed++;
                const errorMsg = `Failed to download ${fileName}: ${error.message}`;
                this.results.errors.push(errorMsg);
                console.log(`      ❌ ${errorMsg}`);
            }
        }
        
        console.log(`\n   📊 ${imageType} Images Summary: ${downloaded} downloaded, ${skipped} existing, ${failed} failed\n`);
    }

    async downloadImageUrl(url) {
        return new Promise((resolve, reject) => {
            const request = https.get(url, {
                headers: {
                    'User-Agent': this.config.userAgent
                },
                timeout: this.config.timeout
            }, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }
                
                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => resolve(Buffer.concat(chunks)));
            });
            
            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generateImageReport() {
        const report = {
            timestamp: new Date().toISOString(),
            year: this.year,
            summary: {
                totalFullImages: this.results.fullImages.length,
                totalThumbnails: this.results.thumbnailImages.length,
                totalSkipped: this.results.skipped.length,
                totalErrors: this.results.errors.length,
                totalSizeDownloaded: this.calculateTotalSize()
            },
            directories: {
                imagesDir: this.imagesDir,
                thumbnailsDir: this.thumbnailsDir
            },
            fullImages: this.results.fullImages,
            thumbnailImages: this.results.thumbnailImages,
            skipped: this.results.skipped,
            errors: this.results.errors
        };
        
        const reportPath = path.join(this.jsonDir, '2022-images-download-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('📋 Image Download Summary:');
        console.log(`   📷 Full-size images downloaded: ${report.summary.totalFullImages}`);
        console.log(`   🖼️  Thumbnail images downloaded: ${report.summary.totalThumbnails}`);
        console.log(`   ⏭️  Images skipped (existing): ${report.summary.totalSkipped}`);
        console.log(`   ❌ Errors encountered: ${report.summary.totalErrors}`);
        console.log(`   💾 Total download size: ${this.formatBytes(report.summary.totalSizeDownloaded)}`);
        console.log(`   📁 Images saved to: ${this.imagesDir}`);
        console.log(`   📁 Thumbnails saved to: ${this.thumbnailsDir}`);
        console.log(`   📊 Report saved to: ${reportPath}\n`);
        
        if (this.results.errors.length > 0) {
            console.log('❌ Download errors:');
            this.results.errors.slice(0, 10).forEach(error => {
                console.log(`   • ${error}`);
            });
            if (this.results.errors.length > 10) {
                console.log(`   ... and ${this.results.errors.length - 10} more errors (see report file)`);
            }
        }
        
        console.log('\n✅ 2022 Awards image download complete!');
    }

    calculateTotalSize() {
        let total = 0;
        this.results.fullImages.forEach(img => total += img.size || 0);
        this.results.thumbnailImages.forEach(img => total += img.size || 0);
        return total;
    }
}

// Main execution
async function main() {
    const downloader = new Awards2022ImageDownloader();
    
    try {
        await downloader.downloadAll2022Images();
    } catch (error) {
        console.error('❌ Image download failed:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = Awards2022ImageDownloader;