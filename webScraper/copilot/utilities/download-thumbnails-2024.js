const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const https = require('https');

class ThumbnailDownloader2024 {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.htmlDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', '2024', 'html');
        this.imagesDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', '2024', 'images');
        this.thumbnailsDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', '2024', 'images', 'thumbnail');
        
        // Ensure directories exist
        fs.ensureDirSync(this.imagesDir);
        fs.ensureDirSync(this.thumbnailsDir);
        
        // Configuration
        this.config = {
            delayBetweenRequests: 1000, // 1 second delay
            timeout: 10000,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        };
        
        this.results = {
            thumbnails: [],
            errors: [],
            skipped: []
        };
    }

    async downloadAllThumbnails() {
        console.log('🚀 Starting 2024 Thumbnail Images Download\n');
        console.log('📋 This will:');
        console.log('   1. 🔍 Scan index pages for thumbnail references');
        console.log('   2. 📥 Download all thumbnail images'); 
        console.log('   3. 💾 Save to images folder\n');

        // Get all index pages (event pages that might contain thumbnails)
        const indexPages = await this.getIndexPages();
        console.log(`📄 Found ${indexPages.length} index pages to scan\n`);

        let totalThumbnails = 0;
        let downloaded = 0;
        let skipped = 0;
        let failed = 0;

        // Process each index page
        for (const [pageIndex, indexPage] of indexPages.entries()) {
            try {
                console.log(`📄 Processing ${pageIndex + 1}/${indexPages.length}: ${indexPage}`);
                
                const thumbnails = await this.extractThumbnailsFromPage(indexPage);
                console.log(`   🔍 Found ${thumbnails.length} thumbnail references`);
                
                totalThumbnails += thumbnails.length;
                
                // Download each thumbnail
                for (const thumbnail of thumbnails) {
                    const result = await this.downloadThumbnail(indexPage, thumbnail);
                    
                    if (result === 'downloaded') {
                        downloaded++;
                        console.log(`      ✅ Downloaded: ${thumbnail.filename}`);
                    } else if (result === 'skipped') {
                        skipped++;
                        console.log(`      ⏭️  Already exists: ${thumbnail.filename}`);
                    } else {
                        failed++;
                        console.log(`      ❌ Failed: ${thumbnail.filename}`);
                    }
                    
                    // Rate limiting
                    await this.delay(this.config.delayBetweenRequests);
                }
                
                console.log(''); // Empty line for readability
                
            } catch (error) {
                console.error(`   ❌ Error processing ${indexPage}: ${error.message}`);
                this.results.errors.push(`${indexPage}: ${error.message}`);
            }
        }

        // Final summary
        this.generateSummary(totalThumbnails, downloaded, skipped, failed);
    }

    async getIndexPages() {
        try {
            const files = await fs.readdir(this.htmlDir);
            // Get event index pages (date-based like 20240120, 20240215, etc.)
            return files
                .filter(f => f.endsWith('.html'))
                .map(f => f.replace('.html', ''))
                .filter(f => f.match(/^20240\d{3}$/) && f !== '2024') // Event pages, exclude main index
                .sort();
        } catch (error) {
            console.error('Error reading HTML directory:', error);
            return [];
        }
    }

    async extractThumbnailsFromPage(pageName) {
        const htmlPath = path.join(this.htmlDir, `${pageName}.html`);
        const thumbnails = [];
        
        try {
            const htmlContent = await fs.readFile(htmlPath, 'utf8');
            const $ = cheerio.load(htmlContent);
            
            // Look for thumbnail image references
            $('img[src]').each((index, element) => {
                const src = $(element).attr('src');
                
                // Check if it's a thumbnail (ends with 'thumb.jpg')
                if (src && src.endsWith('thumb.jpg')) {
                    thumbnails.push({
                        src: src,
                        filename: src,
                        awardNumber: src.replace('thumb.jpg', ''),
                        fullUrl: `https://www.paccentraljc.org/${pageName}/${src}`
                    });
                }
            });
            
        } catch (error) {
            console.error(`Error reading ${pageName}.html:`, error.message);
        }
        
        return thumbnails;
    }

    async downloadThumbnail(indexPage, thumbnail) {
        const outputPath = path.join(this.thumbnailsDir, thumbnail.filename);
        
        // Check if file already exists
        if (await fs.pathExists(outputPath)) {
            this.results.skipped.push(thumbnail.filename);
            return 'skipped';
        }
        
        try {
            const success = await this.downloadImage(thumbnail.fullUrl, outputPath);
            
            if (success) {
                this.results.thumbnails.push({
                    filename: thumbnail.filename,
                    awardNumber: thumbnail.awardNumber,
                    sourceUrl: thumbnail.fullUrl,
                    indexPage: indexPage
                });
                return 'downloaded';
            } else {
                this.results.errors.push(`Failed to download: ${thumbnail.fullUrl}`);
                return 'failed';
            }
            
        } catch (error) {
            this.results.errors.push(`Error downloading ${thumbnail.filename}: ${error.message}`);
            return 'failed';
        }
    }

    async downloadImage(url, filePath) {
        return new Promise((resolve) => {
            const request = https.get(url, {
                headers: { 'User-Agent': this.config.userAgent },
                timeout: this.config.timeout
            }, (response) => {
                if (response.statusCode === 200) {
                    const fileStream = fs.createWriteStream(filePath);
                    response.pipe(fileStream);
                    
                    fileStream.on('finish', () => {
                        fileStream.close();
                        resolve(true);
                    });
                    
                    fileStream.on('error', (error) => {
                        console.error(`Stream error for ${filePath}:`, error);
                        resolve(false);
                    });
                } else {
                    resolve(false);
                }
            });
            
            request.on('error', (error) => {
                console.error(`Request error for ${url}:`, error);
                resolve(false);
            });
            
            request.on('timeout', () => {
                request.destroy();
                resolve(false);
            });
        });
    }

    generateSummary(totalThumbnails, downloaded, skipped, failed) {
        console.log('\n📊 THUMBNAIL DOWNLOAD COMPLETE!');
        console.log('=================================');
        console.log(`🔍 Total thumbnails found: ${totalThumbnails}`);
        console.log(`✅ Successfully downloaded: ${downloaded}`);
        console.log(`⏭️  Already existed: ${skipped}`);
        console.log(`❌ Failed downloads: ${failed}`);
        
        if (this.results.errors.length > 0) {
            console.log('\n⚠️  ERRORS:');
            this.results.errors.slice(0, 10).forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
            
            if (this.results.errors.length > 10) {
                console.log(`... and ${this.results.errors.length - 10} more errors`);
            }
        }
        
        console.log('\n📁 All thumbnails saved to:');
        console.log(`   ${this.thumbnailsDir}`);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Test method for single page
    async testSinglePage(pageName = '20240120') {
        console.log(`🧪 Testing thumbnail extraction for ${pageName}\n`);
        
        try {
            const thumbnails = await this.extractThumbnailsFromPage(pageName);
            console.log(`📄 Page: ${pageName}`);
            console.log(`🔍 Thumbnails found: ${thumbnails.length}\n`);
            
            thumbnails.forEach((thumb, index) => {
                console.log(`${index + 1}. ${thumb.filename}`);
                console.log(`   Award: ${thumb.awardNumber}`);
                console.log(`   URL: ${thumb.fullUrl}\n`);
            });
            
            if (thumbnails.length > 0) {
                console.log('🚀 Downloading first thumbnail as test...');
                const result = await this.downloadThumbnail(pageName, thumbnails[0]);
                console.log(`📊 Test result: ${result}`);
            }
            
        } catch (error) {
            console.error('❌ Test error:', error);
        }
    }
}

async function downloadThumbnails() {
    console.log('🚀 Starting 2024 Thumbnail Download Process\n');
    
    try {
        const downloader = new ThumbnailDownloader2024();
        await downloader.downloadAllThumbnails();
        
        console.log('\n✨ Thumbnail download process complete!');
        
    } catch (error) {
        console.error('❌ Error in thumbnail download:', error);
    }
}

async function testThumbnails() {
    console.log('🧪 Running Thumbnail Test\n');
    
    try {
        const downloader = new ThumbnailDownloader2024();
        await downloader.testSinglePage('20240120');
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

if (require.main === module) {
    // Check command line arguments
    const args = process.argv.slice(2);
    if (args.includes('--test')) {
        testThumbnails().catch(console.error);
    } else {
        downloadThumbnails().catch(console.error);
    }
}

module.exports = { downloadThumbnails, testThumbnails };