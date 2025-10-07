const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const https = require('https');

class Awards2024Scraper {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.year = '2024';
        
        // Setup directory structure for 2024
        this.baseAwardsDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year);
        this.htmlDir = path.join(this.baseAwardsDir, 'html');
        this.imagesDir = path.join(this.baseAwardsDir, 'images');
        this.thumbnailsDir = path.join(this.baseAwardsDir, 'images', 'thumbnail');
        this.jsonDir = path.join(this.baseDir, 'savedData', this.year, 'json');
        
        // Ensure all directories exist
        fs.ensureDirSync(this.htmlDir);
        fs.ensureDirSync(this.imagesDir);
        fs.ensureDirSync(this.thumbnailsDir);
        fs.ensureDirSync(this.jsonDir);
        
        // Rate limiting configuration
        this.config = {
            delayBetweenRequests: 2000, // 2 seconds between requests
            timeout: 10000,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        };
        
        this.results = {
            htmlFiles: [],
            images: [],
            errors: []
        };
    }

    async scrapeAll2024Awards() {
        console.log('🚀 Starting 2024 Awards Complete Scraping Process\n');
        console.log('📋 This will:');
        console.log('   1. 📄 Download 2024 index page');
        console.log('   2. 🔍 Extract all award links');
        console.log('   3. 📥 Download individual HTML award pages');
        console.log('   4. 🖼️  Download corresponding images');
        console.log('   5. ✅ Verify coverage and create missing list\n');

        try {
            // Step 1: Download and parse 2024 index
            console.log('📄 Step 1: Downloading 2024 index page...');
            const indexContent = await this.downloadIndexPage();
            
            // Step 2: Extract award links
            console.log('🔍 Step 2: Extracting award links...');
            const awardLinks = this.extractAwardLinks(indexContent);
            console.log(`   Found ${awardLinks.length} award links\n`);
            
            // Step 3: Download HTML files
            console.log('📥 Step 3: Downloading individual award HTML pages...');
            await this.downloadAwardHtmlFiles(awardLinks);
            
            // Step 4: Download images
            console.log('🖼️  Step 4: Downloading award images...');
            await this.downloadAwardImages();
            
            // Step 5: Check coverage
            console.log('✅ Step 5: Verifying coverage...');
            const coverage = await this.checkCoverage();
            
            // Final report
            this.generateFinalReport(coverage);
            
        } catch (error) {
            console.error('❌ Error in 2024 scraping process:', error);
            throw error;
        }
    }

    async downloadIndexPage() {
        const indexUrl = 'https://www.paccentraljc.org/2024.html';
        const indexPath = path.join(this.baseAwardsDir, '2024.html');
        
        try {
            const content = await this.downloadUrl(indexUrl);
            await fs.writeFile(indexPath, content, 'utf8');
            console.log('   ✅ Downloaded 2024 index page');
            return content;
        } catch (error) {
            console.error('   ❌ Failed to download index:', error.message);
            throw error;
        }
    }

    extractAwardLinks(htmlContent) {
        const $ = cheerio.load(htmlContent);
        const links = [];
        
        // Look for 2024 award links in format: YYYYMMDD/2024XXXX.html
        $('a[href]').each((index, element) => {
            const href = $(element).attr('href');
            if (href && href.match(/^\d{8}\/\d+\.html$/)) {
                // Extract award number from the filename
                const match = href.match(/^\d{8}\/(\d+)\.html$/);
                if (match) {
                    const awardNumber = match[1];
                    links.push({
                        awardNumber: awardNumber,
                        url: `https://www.paccentraljc.org/${href}`,
                        relativeUrl: href,
                        dateFolder: href.split('/')[0] // Extract date folder for image URLs
                    });
                }
            }
        });
        
        return links;
    }

    async downloadAwardHtmlFiles(awardLinks) {
        let downloaded = 0;
        let failed = 0;
        
        // Store the award links with date folders for later image download
        this.awardLinksWithDates = awardLinks;
        
        for (const [index, link] of awardLinks.entries()) {
            try {
                console.log(`   📄 Downloading ${index + 1}/${awardLinks.length}: Award ${link.awardNumber}`);
                
                const content = await this.downloadUrl(link.url);
                const filePath = path.join(this.htmlDir, `${link.awardNumber}.html`);
                
                await fs.writeFile(filePath, content, 'utf8');
                
                this.results.htmlFiles.push(link.awardNumber);
                downloaded++;
                
                console.log(`      ✅ Saved: ${link.awardNumber}.html`);
                
                // Rate limiting
                await this.delay(this.config.delayBetweenRequests);
                
            } catch (error) {
                failed++;
                const errorMsg = `Failed to download ${link.awardNumber}: ${error.message}`;
                this.results.errors.push(errorMsg);
                console.log(`      ❌ ${errorMsg}`);
            }
        }
        
        console.log(`\n   📊 HTML Download Summary: ${downloaded} successful, ${failed} failed\n`);
    }

    async downloadAwardImages() {
        const htmlFiles = await this.getHtmlFiles();
        let downloaded = 0;
        let skipped = 0;
        let failed = 0;
        
        console.log(`   🔍 Processing ${htmlFiles.length} HTML files for images\n`);
        
        // Create a lookup map for date folders
        const dateFolderMap = new Map();
        if (this.awardLinksWithDates) {
            this.awardLinksWithDates.forEach(link => {
                dateFolderMap.set(link.awardNumber, link.dateFolder);
            });
        }
        
        for (const [index, awardNumber] of htmlFiles.entries()) {
            try {
                console.log(`   🖼️  Processing ${index + 1}/${htmlFiles.length}: Award ${awardNumber}`);
                
                // Check if image already exists
                const imagePath = path.join(this.imagesDir, `${awardNumber}.jpg`);
                if (await fs.pathExists(imagePath)) {
                    console.log(`      ⏭️  Image already exists: ${awardNumber}.jpg`);
                    skipped++;
                    continue;
                }
                
                // Use date folder from award links, fallback to HTML extraction
                let dateFolder = dateFolderMap.get(awardNumber);
                if (!dateFolder) {
                    const htmlPath = path.join(this.htmlDir, `${awardNumber}.html`);
                    dateFolder = await this.extractDateFromHtml(htmlPath);
                }
                
                if (dateFolder) {
                    const imageUrl = `https://www.paccentraljc.org/${dateFolder}/${awardNumber}.jpg`;
                    console.log(`      🔍 Trying: ${imageUrl}`);
                    
                    const success = await this.downloadImage(imageUrl, imagePath);
                    if (success) {
                        console.log(`      ✅ Downloaded: ${awardNumber}.jpg`);
                        this.results.images.push(awardNumber);
                        downloaded++;
                    } else {
                        console.log(`      ❌ Failed to download: ${awardNumber}.jpg`);
                        failed++;
                    }
                } else {
                    console.log(`      ❌ Could not determine date folder: ${awardNumber}`);
                    failed++;
                }
                
                // Rate limiting
                await this.delay(1500);
                
            } catch (error) {
                failed++;
                const errorMsg = `Error processing ${awardNumber}: ${error.message}`;
                this.results.errors.push(errorMsg);
                console.log(`      ❌ ${errorMsg}`);
            }
        }
        
        console.log(`\n   📊 Image Download Summary: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed\n`);
    }

    async extractDateFromHtml(htmlPath) {
        try {
            const content = await fs.readFile(htmlPath, 'utf8');
            const $ = cheerio.load(content);
            const text = $('body').text();
            
            // Look for date patterns and convert to folder format
            const datePatterns = [
                /(\w+)\s+(\d{1,2}),\s+2024/i,  // "January 7, 2024"
                /(\d{1,2})\/(\d{1,2})\/2024/,   // "1/7/2024"  
            ];
            
            for (const pattern of datePatterns) {
                const match = text.match(pattern);
                if (match) {
                    return this.convertToDateFolder(match[0]);
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    convertToDateFolder(dateString) {
        const monthMap = {
            'january': '01', 'jan': '01', 'february': '02', 'feb': '02',
            'march': '03', 'mar': '03', 'april': '04', 'apr': '04',
            'may': '05', 'june': '06', 'jun': '06', 'july': '07', 'jul': '07',
            'august': '08', 'aug': '08', 'september': '09', 'sep': '09', 'sept': '09',
            'october': '10', 'oct': '10', 'november': '11', 'nov': '11',
            'december': '12', 'dec': '12'
        };
        
        try {
            // Handle "Month Day, 2024" format
            const monthDayMatch = dateString.match(/(\w+)\s+(\d{1,2}),\s+2024/i);
            if (monthDayMatch) {
                const monthName = monthDayMatch[1].toLowerCase();
                const day = monthDayMatch[2].padStart(2, '0');
                const month = monthMap[monthName];
                
                if (month) {
                    return `24${month}${day}`;
                }
            }
            
            // Handle "M/D/2024" format
            const slashMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/2024/);
            if (slashMatch) {
                const month = slashMatch[1].padStart(2, '0');
                const day = slashMatch[2].padStart(2, '0');
                return `24${month}${day}`;
            }
            
            return null;
        } catch (error) {
            return null;
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
                    
                    fileStream.on('error', () => {
                        resolve(false);
                    });
                } else {
                    resolve(false);
                }
            });
            
            request.on('error', () => resolve(false));
            request.on('timeout', () => {
                request.destroy();
                resolve(false);
            });
        });
    }

    async downloadUrl(url) {
        return new Promise((resolve, reject) => {
            const request = https.get(url, {
                headers: { 'User-Agent': this.config.userAgent },
                timeout: this.config.timeout
            }, (response) => {
                let data = '';
                
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    if (response.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${response.statusCode}`));
                    }
                });
            });
            
            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    async getHtmlFiles() {
        try {
            const files = await fs.readdir(this.htmlDir);
            return files
                .filter(f => f.endsWith('.html') && f.match(/^\d+\.html$/))
                .map(f => f.replace('.html', ''))
                .filter(f => f !== '2024') // Exclude index
                .sort();
        } catch (error) {
            return [];
        }
    }

    async checkCoverage() {
        const htmlFiles = await this.getHtmlFiles();
        
        const imageFiles = [];
        try {
            const files = await fs.readdir(this.imagesDir);
            imageFiles.push(...files
                .filter(f => f.endsWith('.jpg') && f.match(/^\d+\.jpg$/))
                .map(f => f.replace('.jpg', ''))
            );
        } catch (error) {
            // Directory might not exist
        }
        
        const imageSet = new Set(imageFiles);
        const missingImages = htmlFiles.filter(html => !imageSet.has(html));
        
        return {
            totalHtml: htmlFiles.length,
            totalImages: imageFiles.length,
            missingCount: missingImages.length,
            missingList: missingImages,
            coverage: htmlFiles.length > 0 ? ((htmlFiles.length - missingImages.length) / htmlFiles.length * 100).toFixed(1) : 0
        };
    }

    generateFinalReport(coverage) {
        console.log('\n🎉 2024 AWARDS SCRAPING COMPLETE!');
        console.log('=====================================');
        console.log(`📄 HTML files downloaded: ${this.results.htmlFiles.length}`);
        console.log(`🖼️  Images downloaded: ${this.results.images.length}`);
        console.log(`❌ Errors encountered: ${this.results.errors.length}`);
        console.log(`\n📊 COVERAGE ANALYSIS:`);
        console.log(`📄 Total HTML files: ${coverage.totalHtml}`);
        console.log(`🖼️  Total images: ${coverage.totalImages}`);
        console.log(`📈 Image coverage: ${coverage.coverage}%`);
        
        if (coverage.missingCount > 0) {
            console.log(`\n🚨 MISSING IMAGES (${coverage.missingCount}):`);
            coverage.missingList.forEach((awardNumber, index) => {
                console.log(`${index + 1}. Award ${awardNumber}`);
            });
        } else {
            console.log(`\n✅ Perfect coverage! All awards have images.`);
        }
        
        if (this.results.errors.length > 0) {
            console.log(`\n⚠️  ERRORS ENCOUNTERED:`);
            this.results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        return {
            htmlCount: this.results.htmlFiles.length,
            imageCount: this.results.images.length,
            errorCount: this.results.errors.length,
            coverage: coverage
        };
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function scrape2024Awards() {
    console.log('🚀 Starting Complete 2024 Awards Scraping\n');
    
    try {
        const scraper = new Awards2024Scraper();
        await scraper.scrapeAll2024Awards();
        
        console.log('\n✨ 2024 scraping process complete!');
        
    } catch (error) {
        console.error('❌ Error in 2024 scraping:', error);
    }
}

if (require.main === module) {
    scrape2024Awards().catch(console.error);
}

module.exports = { scrape2024Awards };