const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const https = require('https');

class Awards2021FullImageDownloader {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.year = '2021';
        
        // Directory paths
        this.htmlDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year, 'html');
        this.imagesDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year, 'images');
        this.jsonDir = path.join(this.baseDir, 'savedData', this.year, 'json');
        
        // Ensure directories exist
        fs.ensureDirSync(this.imagesDir);
        fs.ensureDirSync(this.jsonDir);
        
        // Rate limiting configuration
        this.config = {
            delayBetweenRequests: 2000, // 2 seconds between requests
            timeout: 15000,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        };
        
        this.results = {
            fullImages: [],
            errors: [],
            skipped: []
        };
    }

    async downloadFullSizeImages() {
        console.log('🚀 Starting 2021 Full-Size Image Download Process\n');
        console.log('📋 This will:');
        console.log('   1. 📁 Scan all individual award HTML files');
        console.log('   2. 🔍 Extract full-size image references from each file');
        console.log('   3. 🗺️  Map images to correct date folder URLs');
        console.log('   4. 📥 Download full-size images');
        console.log('   5. ✅ Generate download report\n');

        try {
            // Step 1: Get individual award HTML files (not date index files)
            console.log('📁 Step 1: Scanning individual award HTML files...');
            const awardFiles = await this.getAwardHtmlFiles();
            console.log(`   Found ${awardFiles.length} award HTML files to process\n`);
            
            // Step 2: Extract and map images
            console.log('🔍 Step 2: Extracting full-size images with correct URLs...');
            const imageMap = await this.extractImagesWithCorrectUrls(awardFiles);
            console.log(`   Found ${imageMap.length} full-size images to download\n`);
            
            // Step 3: Download images
            console.log('📥 Step 3: Downloading full-size images...');
            await this.downloadImages(imageMap);
            
            // Step 4: Generate report
            console.log('✅ Step 4: Generating download report...');
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Error in full-size image download process:', error);
            throw error;
        }
    }

    async getAwardHtmlFiles() {
        const files = await fs.readdir(this.htmlDir);
        // Filter for individual award files (exclude index files and date files)
        return files.filter(file => {
            return file.endsWith('.html') && 
                   !file.includes('index') && 
                   file.match(/^2021\d{4}\.html$/); // Award files like 20215301.html
        }).map(file => path.join(this.htmlDir, file));
    }

    async extractImagesWithCorrectUrls(awardFiles) {
        const imageMap = [];
        
        // First, we need to build a mapping of award numbers to their date folders
        const awardToDateFolder = await this.buildAwardToDateMapping();
        
        for (const [index, filePath] of awardFiles.entries()) {
            const fileName = path.basename(filePath);
            const awardNumber = fileName.replace('.html', '');
            
            console.log(`   📄 Processing ${index + 1}/${awardFiles.length}: ${fileName}`);
            
            try {
                const content = await fs.readFile(filePath, 'utf8');
                const $ = cheerio.load(content);
                
                // Find the main image (usually the first IMG tag with a .jpg source)
                $('img[src]').each((i, element) => {
                    const src = $(element).attr('src');
                    if (src && src.endsWith('.jpg') && !src.includes('thumb')) {
                        // Get the date folder for this award
                        const dateFolder = awardToDateFolder[awardNumber];
                        if (dateFolder) {
                            const imageUrl = `https://www.paccentraljc.org/${dateFolder}/${src}`;
                            const fileName = path.basename(src);
                            
                            imageMap.push({
                                awardNumber,
                                imageSrc: src,
                                imageUrl,
                                fileName,
                                dateFolder,
                                sourceFile: fileName
                            });
                            
                            console.log(`      📸 Found image: ${fileName} -> ${dateFolder}/${src}`);
                        } else {
                            console.log(`      ⚠️  Could not determine date folder for ${awardNumber}`);
                        }
                    }
                });
                
            } catch (error) {
                console.log(`      ❌ Error processing ${fileName}: ${error.message}`);
            }
        }
        
        return imageMap;
    }

    async buildAwardToDateMapping() {
        console.log('   🗺️  Building award number to date folder mapping...');
        const mapping = {};
        
        // Read the 2021 index file to build the mapping
        const indexPath = path.join(this.htmlDir, '2021-index.html');
        if (!fs.existsSync(indexPath)) {
            throw new Error('2021 index file not found');
        }
        
        const indexContent = await fs.readFile(indexPath, 'utf8');
        const $ = cheerio.load(indexContent);
        
        // Extract links that show award files in date folders
        $('a[href]').each((index, element) => {
            const href = $(element).attr('href');
            if (href && href.match(/^(\d{8})\/(\d+)\.html$/)) {
                const match = href.match(/^(\d{8})\/(\d+)\.html$/);
                const dateFolder = match[1];
                const awardNumber = match[2];
                mapping[awardNumber] = dateFolder;
            }
        });
        
        console.log(`      📊 Mapped ${Object.keys(mapping).length} awards to date folders`);
        
        // Also check date-specific HTML files for additional mappings
        const dateFiles = await fs.readdir(this.htmlDir);
        const dateIndexFiles = dateFiles.filter(file => file.match(/^(\d{8})\.html$/));
        
        for (const dateFile of dateIndexFiles) {
            const dateFolder = dateFile.replace('.html', '');
            const datePath = path.join(this.htmlDir, dateFile);
            
            try {
                const dateContent = await fs.readFile(datePath, 'utf8');
                const date$ = cheerio.load(dateContent);
                
                date$('a[href]').each((index, element) => {
                    const href = date$(element).attr('href');
                    if (href && href.match(/^(\d+)\.html$/)) {
                        const awardNumber = href.replace('.html', '');
                        if (!mapping[awardNumber]) {
                            mapping[awardNumber] = dateFolder;
                        }
                    }
                });
            } catch (error) {
                console.log(`      ⚠️  Could not read date file ${dateFile}: ${error.message}`);
            }
        }
        
        console.log(`      📊 Final mapping: ${Object.keys(mapping).length} awards mapped\n`);
        return mapping;
    }

    async downloadImages(imageMap) {
        let downloaded = 0;
        let skipped = 0;
        let failed = 0;
        
        for (const [index, imageInfo] of imageMap.entries()) {
            const { fileName, imageUrl, awardNumber, dateFolder } = imageInfo;
            const localPath = path.join(this.imagesDir, fileName);
            
            // Check if file already exists
            if (fs.existsSync(localPath)) {
                console.log(`   ⏭️  Skipping ${index + 1}/${imageMap.length}: ${fileName} (already exists)`);
                skipped++;
                this.results.skipped.push({
                    fileName,
                    reason: 'already exists',
                    awardNumber
                });
                continue;
            }
            
            try {
                console.log(`   📷 Downloading ${index + 1}/${imageMap.length}: ${fileName} from ${dateFolder}`);
                console.log(`      🔗 URL: ${imageUrl}`);
                
                const imageBuffer = await this.downloadImageUrl(imageUrl);
                await fs.writeFile(localPath, imageBuffer);
                
                this.results.fullImages.push({
                    fileName,
                    url: imageUrl,
                    localPath,
                    dateFolder,
                    awardNumber,
                    size: imageBuffer.length
                });
                
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
        
        console.log(`\n   📊 Full-Size Images Summary: ${downloaded} downloaded, ${skipped} existing, ${failed} failed\n`);
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

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            year: this.year,
            summary: {
                totalFullImages: this.results.fullImages.length,
                totalSkipped: this.results.skipped.length,
                totalErrors: this.results.errors.length,
                totalSizeDownloaded: this.calculateTotalSize()
            },
            imagesDir: this.imagesDir,
            fullImages: this.results.fullImages,
            skipped: this.results.skipped,
            errors: this.results.errors
        };
        
        const reportPath = path.join(this.jsonDir, '2021-fullsize-images-download-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('📋 Full-Size Image Download Summary:');
        console.log(`   📷 Full-size images downloaded: ${report.summary.totalFullImages}`);
        console.log(`   ⏭️  Images skipped (existing): ${report.summary.totalSkipped}`);
        console.log(`   ❌ Errors encountered: ${report.summary.totalErrors}`);
        console.log(`   💾 Total download size: ${this.formatBytes(report.summary.totalSizeDownloaded)}`);
        console.log(`   📁 Images saved to: ${this.imagesDir}`);
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
        
        console.log('\n✅ 2021 Full-size images download complete!');
    }

    calculateTotalSize() {
        let total = 0;
        this.results.fullImages.forEach(img => total += img.size || 0);
        return total;
    }
}

// Main execution
async function main() {
    const downloader = new Awards2021FullImageDownloader();
    
    try {
        await downloader.downloadFullSizeImages();
    } catch (error) {
        console.error('❌ Full-size image download failed:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = Awards2021FullImageDownloader;