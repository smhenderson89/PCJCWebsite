const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const https = require('https');

class Awards2022CompleteScraper {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.year = '2021';

        // Setup directory structure for 2021
        this.htmlDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year, 'html');
        this.jsonDir = path.join(this.baseDir, 'savedData', this.year, 'json');
        
        // Ensure all directories exist
        fs.ensureDirSync(this.htmlDir);
        fs.ensureDirSync(this.jsonDir);
        
        // Rate limiting configuration
        this.config = {
            delayBetweenRequests: 2000, // 2 seconds between requests
            timeout: 10000,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        };
        
        this.results = {
            htmlFiles: [],
            dateIndexFiles: [],
            errors: []
        };
    }

    async scrapeComplete2021Awards() {
        console.log('🚀 Starting COMPLETE 2021 Awards HTML Download Process\n');
        console.log('📋 This will:');
        console.log('   1. 📄 Download 2021 index page');
        console.log('   2. 🔍 Extract all award links AND date-specific index links');
        console.log('   3. 📥 Download individual HTML award pages');
        console.log('   4. 📅 Download date-specific index pages (like 20210219.html)');
        console.log('   5. ✅ Generate comprehensive summary report\n');

        try {
            // Step 1: Download and parse 2021 index if not already done
            console.log('📄 Step 1: Checking 2021 index page...');
            let indexContent;
            const indexPath = path.join(this.htmlDir, '2021-index.html');

            if (fs.existsSync(indexPath)) {
                console.log('   ✅ Using existing 2021 index page');
                indexContent = await fs.readFile(indexPath, 'utf8');
            } else {
                console.log('   📥 Downloading 2021 index page...');
                indexContent = await this.downloadIndexPage();
            }
            
            // Step 2: Extract all types of links
            console.log('🔍 Step 2: Extracting all award and date-index links...');
            const { awardLinks, dateIndexLinks } = this.extractAllLinks(indexContent);
            console.log(`   Found ${awardLinks.length} award links`);
            console.log(`   Found ${dateIndexLinks.length} date-index links\n`);
            
            // Step 3: Download missing award HTML files
            console.log('📥 Step 3: Checking and downloading missing award HTML pages...');
            await this.downloadMissingAwardFiles(awardLinks);
            
            // Step 4: Download date-specific index pages
            console.log('📅 Step 4: Downloading date-specific index pages...');
            await this.downloadDateIndexPages(dateIndexLinks);
            
            // Step 5: Generate report
            console.log('✅ Step 5: Generating comprehensive summary report...');
            this.generateCompleteReport();
            
        } catch (error) {
            console.error('❌ Error in complete 2021 scraping process:', error);
            throw error;
        }
    }

    async downloadIndexPage() {
        const indexUrl = 'https://www.paccentraljc.org/2021.html';
        const indexPath = path.join(this.htmlDir, '2021-index.html');

        try {
            const content = await this.downloadUrl(indexUrl);
            await fs.writeFile(indexPath, content, 'utf8');
            console.log('   ✅ Downloaded 2021 index page');
            return content;
        } catch (error) {
            console.error('   ❌ Failed to download index:', error.message);
            throw error;
        }
    }

    extractAllLinks(htmlContent) {
        const $ = cheerio.load(htmlContent);
        const awardLinks = [];
        const dateIndexLinks = [];
        
        // Extract all href links
        $('a[href]').each((index, element) => {
            const href = $(element).attr('href');
            if (href) {
                // Pattern 1: Individual award files YYYYMMDD/2022XXXX.html
                if (href.match(/^\d{8}\/2022\d+\.html$/)) {
                    const match = href.match(/^\d{8}\/(2022\d+)\.html$/);
                    if (match) {
                        const awardNumber = match[1];
                        awardLinks.push({
                            awardNumber: awardNumber,
                            url: `https://www.paccentraljc.org/${href}`,
                            relativeUrl: href,
                            dateFolder: href.split('/')[0],
                            pattern: 'standard-award'
                        });
                    }
                }
                // Pattern 2: Date-specific index pages YYYYMMDD/YYYYMMDD.html where YYYY=2021
                else if (href.match(/^(2021\d{4})\/(2021\d{4})\.html$/)) {
                    const match = href.match(/^(2021\d{4})\/(2021\d{4})\.html$/);
                    if (match) {
                        const dateFolder = match[1];
                        const dateFile = match[2];
                        dateIndexLinks.push({
                            dateFolder: dateFolder,
                            dateFile: dateFile,
                            url: `https://www.paccentraljc.org/${href}`,
                            relativeUrl: href,
                            pattern: 'date-index'
                        });
                    }
                }
                // Pattern 3: Catch any other 2021 related HTML files
                else if (href.includes('2021') && href.endsWith('.html')) {
                    const fileName = path.basename(href, '.html');
                    if (fileName.startsWith('2021')) {
                        // Check if it's a date index or award file
                        if (href.match(/^2021\d{4}\/2021\d{4}\.html$/)) {
                            // Already caught above
                        } else {
                            awardLinks.push({
                                awardNumber: fileName,
                                url: `https://www.paccentraljc.org/${href}`,
                                relativeUrl: href,
                                dateFolder: path.dirname(href) !== '.' ? path.dirname(href) : '',
                                pattern: 'misc-2021'
                            });
                        }
                    }
                }
            }
        });
        
        console.log('   📊 Link Analysis:');
        const awardPatterns = {};
        awardLinks.forEach(link => {
            awardPatterns[link.pattern] = (awardPatterns[link.pattern] || 0) + 1;
        });
        Object.entries(awardPatterns).forEach(([pattern, count]) => {
            console.log(`      Award ${pattern}: ${count} links`);
        });
        
        if (dateIndexLinks.length > 0) {
            console.log(`      Date-index pages: ${dateIndexLinks.length} links`);
            dateIndexLinks.forEach(link => {
                console.log(`        • ${link.dateFolder}/${link.dateFile}.html`);
            });
        }
        
        return { awardLinks, dateIndexLinks };
    }

    async downloadMissingAwardFiles(awardLinks) {
        let downloaded = 0;
        let skipped = 0;
        let failed = 0;
        
        for (const [index, link] of awardLinks.entries()) {
            const fileName = `${link.awardNumber}.html`;
            const filePath = path.join(this.htmlDir, fileName);
            
            // Check if file already exists
            if (fs.existsSync(filePath)) {
                console.log(`   ⏭️  Skipping ${index + 1}/${awardLinks.length}: ${link.awardNumber} (already exists)`);
                skipped++;
                this.results.htmlFiles.push({
                    fileName: fileName,
                    awardNumber: link.awardNumber,
                    pattern: link.pattern,
                    url: link.url,
                    status: 'existing'
                });
                continue;
            }
            
            try {
                console.log(`   📄 Downloading ${index + 1}/${awardLinks.length}: ${link.awardNumber} (${link.pattern})`);
                
                const content = await this.downloadUrl(link.url);
                await fs.writeFile(filePath, content, 'utf8');
                
                this.results.htmlFiles.push({
                    fileName: fileName,
                    awardNumber: link.awardNumber,
                    pattern: link.pattern,
                    url: link.url,
                    status: 'downloaded'
                });
                downloaded++;
                
                console.log(`      ✅ Saved: ${fileName}`);
                
                // Rate limiting
                await this.delay(this.config.delayBetweenRequests);
                
            } catch (error) {
                failed++;
                const errorMsg = `Failed to download ${link.awardNumber}: ${error.message}`;
                this.results.errors.push(errorMsg);
                console.log(`      ❌ ${errorMsg}`);
            }
        }
        
        console.log(`\n   📊 Award Files Summary: ${downloaded} downloaded, ${skipped} existing, ${failed} failed\n`);
    }

    async downloadDateIndexPages(dateIndexLinks) {
        let downloaded = 0;
        let skipped = 0;
        let failed = 0;
        
        for (const [index, link] of dateIndexLinks.entries()) {
            const fileName = `${link.dateFile}-index.html`;
            const filePath = path.join(this.htmlDir, fileName);
            
            // Check if file already exists
            if (fs.existsSync(filePath)) {
                console.log(`   ⏭️  Skipping ${index + 1}/${dateIndexLinks.length}: ${link.dateFile} index (already exists)`);
                skipped++;
                this.results.dateIndexFiles.push({
                    fileName: fileName,
                    dateFolder: link.dateFolder,
                    url: link.url,
                    status: 'existing'
                });
                continue;
            }
            
            try {
                console.log(`   📅 Downloading ${index + 1}/${dateIndexLinks.length}: ${link.dateFile} date index`);
                
                const content = await this.downloadUrl(link.url);
                await fs.writeFile(filePath, content, 'utf8');
                
                this.results.dateIndexFiles.push({
                    fileName: fileName,
                    dateFolder: link.dateFolder,
                    url: link.url,
                    status: 'downloaded'
                });
                downloaded++;
                
                console.log(`      ✅ Saved: ${fileName}`);
                
                // Rate limiting
                await this.delay(this.config.delayBetweenRequests);
                
            } catch (error) {
                failed++;
                const errorMsg = `Failed to download ${link.dateFile} index: ${error.message}`;
                this.results.errors.push(errorMsg);
                console.log(`      ❌ ${errorMsg}`);
            }
        }
        
        console.log(`\n   📊 Date Index Files Summary: ${downloaded} downloaded, ${skipped} existing, ${failed} failed\n`);
    }

    async downloadUrl(url) {
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
                
                let data = '';
                response.setEncoding('utf8');
                response.on('data', (chunk) => data += chunk);
                response.on('end', () => resolve(data));
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

    generateCompleteReport() {
        const report = {
            timestamp: new Date().toISOString(),
            year: this.year,
            summary: {
                totalAwardFiles: this.results.htmlFiles.length,
                totalDateIndexFiles: this.results.dateIndexFiles.length,
                totalErrors: this.results.errors.length
            },
            awardFiles: this.results.htmlFiles,
            dateIndexFiles: this.results.dateIndexFiles,
            errorDetails: this.results.errors
        };
        
        const reportPath = path.join(this.jsonDir, '2021-complete-download-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('📋 Complete Summary:');
        console.log(`   📄 Total award HTML files: ${report.summary.totalAwardFiles}`);
        console.log(`   📅 Total date-index HTML files: ${report.summary.totalDateIndexFiles}`);
        console.log(`   ❌ Total errors: ${report.summary.totalErrors}`);
        console.log(`   📁 Files saved to: ${this.htmlDir}`);
        console.log(`   📊 Report saved to: ${reportPath}\n`);
        
        // Display detailed breakdown
        const awardPatterns = {};
        const awardStatuses = {};
        this.results.htmlFiles.forEach(file => {
            awardPatterns[file.pattern] = (awardPatterns[file.pattern] || 0) + 1;
            awardStatuses[file.status] = (awardStatuses[file.status] || 0) + 1;
        });
        
        console.log('📊 Award files breakdown:');
        Object.entries(awardPatterns).forEach(([pattern, count]) => {
            console.log(`   ${pattern}: ${count} files`);
        });
        
        console.log('📊 Download status breakdown:');
        Object.entries(awardStatuses).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} files`);
        });
        
        if (this.results.dateIndexFiles.length > 0) {
            const dateStatuses = {};
            this.results.dateIndexFiles.forEach(file => {
                dateStatuses[file.status] = (dateStatuses[file.status] || 0) + 1;
            });
            
            console.log('📊 Date-index files status:');
            Object.entries(dateStatuses).forEach(([status, count]) => {
                console.log(`   ${status}: ${count} files`);
            });
        }
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.results.errors.forEach(error => {
                console.log(`   • ${error}`);
            });
        }
        
        console.log('\n✅ Complete 2021 Awards HTML download finished!');
    }
}

// Main execution
async function main() {
    const scraper = new Awards2021CompleteScraper();
    
    try {
        await scraper.scrapeComplete2021Awards();
    } catch (error) {
        console.error('❌ Complete scraping failed:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = Awards2021CompleteScraper;