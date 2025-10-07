const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const https = require('https');

class Awards2022Scraper {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.year = '2022';
        
        // Setup directory structure for 2022
        this.baseAwardsDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year);
        this.htmlDir = path.join(this.baseDir, 'savedData', this.year, 'html');
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
            errors: []
        };
    }

    async scrapeAll2022Awards() {
        console.log('🚀 Starting 2022 Awards HTML Download Process\n');
        console.log('📋 This will:');
        console.log('   1. 📄 Download 2022 index page');
        console.log('   2. 🔍 Extract all award links');
        console.log('   3. 📥 Download individual HTML award pages');
        console.log('   4. ✅ Generate summary report\n');

        try {
            // Step 1: Download and parse 2022 index
            console.log('📄 Step 1: Downloading 2022 index page...');
            const indexContent = await this.downloadIndexPage();
            
            // Step 2: Extract award links
            console.log('🔍 Step 2: Extracting award links...');
            const awardLinks = this.extractAwardLinks(indexContent);
            console.log(`   Found ${awardLinks.length} award links\n`);
            
            // Step 3: Download HTML files
            console.log('📥 Step 3: Downloading individual award HTML pages...');
            await this.downloadAwardHtmlFiles(awardLinks);
            
            // Step 4: Generate report
            console.log('✅ Step 4: Generating summary report...');
            this.generateFinalReport();
            
        } catch (error) {
            console.error('❌ Error in 2022 scraping process:', error);
            throw error;
        }
    }

    async downloadIndexPage() {
        const indexUrl = 'https://www.paccentraljc.org/2022.html';
        const indexPath = path.join(this.htmlDir, '2022-index.html');
        
        try {
            const content = await this.downloadUrl(indexUrl);
            await fs.writeFile(indexPath, content, 'utf8');
            console.log('   ✅ Downloaded 2022 index page');
            return content;
        } catch (error) {
            console.error('   ❌ Failed to download index:', error.message);
            throw error;
        }
    }

    extractAwardLinks(htmlContent) {
        const $ = cheerio.load(htmlContent);
        const links = [];
        
        // Look for 2022 award links - examine different patterns
        $('a[href]').each((index, element) => {
            const href = $(element).attr('href');
            if (href) {
                // Pattern 1: Standard format YYYYMMDD/2022XXXX.html
                if (href.match(/^\d{8}\/2022\d+\.html$/)) {
                    const match = href.match(/^\d{8}\/(2022\d+)\.html$/);
                    if (match) {
                        const awardNumber = match[1];
                        links.push({
                            awardNumber: awardNumber,
                            url: `https://www.paccentraljc.org/${href}`,
                            relativeUrl: href,
                            dateFolder: href.split('/')[0],
                            pattern: 'standard'
                        });
                    }
                }
                // Pattern 2: Just date folders that might contain separate pages
                else if (href.match(/^\d{8}\/$/)) {
                    links.push({
                        awardNumber: href.replace('/', ''),
                        url: `https://www.paccentraljc.org/${href}`,
                        relativeUrl: href,
                        dateFolder: href.replace('/', ''),
                        pattern: 'date-folder'
                    });
                }
                // Pattern 3: Any 2022 specific files
                else if (href.includes('2022') && href.endsWith('.html')) {
                    const fileName = path.basename(href, '.html');
                    links.push({
                        awardNumber: fileName,
                        url: `https://www.paccentraljc.org/${href}`,
                        relativeUrl: href,
                        dateFolder: path.dirname(href) !== '.' ? path.dirname(href) : '',
                        pattern: 'misc-2022'
                    });
                }
            }
        });
        
        console.log('   📊 Link Analysis:');
        const patterns = {};
        links.forEach(link => {
            patterns[link.pattern] = (patterns[link.pattern] || 0) + 1;
        });
        Object.entries(patterns).forEach(([pattern, count]) => {
            console.log(`      ${pattern}: ${count} links`);
        });
        
        return links;
    }

    async downloadAwardHtmlFiles(awardLinks) {
        let downloaded = 0;
        let failed = 0;
        
        for (const [index, link] of awardLinks.entries()) {
            try {
                console.log(`   📄 Downloading ${index + 1}/${awardLinks.length}: ${link.awardNumber} (${link.pattern})`);
                
                const content = await this.downloadUrl(link.url);
                const fileName = link.pattern === 'date-folder' ? `${link.awardNumber}-index.html` : `${link.awardNumber}.html`;
                const filePath = path.join(this.htmlDir, fileName);
                
                await fs.writeFile(filePath, content, 'utf8');
                
                this.results.htmlFiles.push({
                    fileName: fileName,
                    awardNumber: link.awardNumber,
                    pattern: link.pattern,
                    url: link.url
                });
                downloaded++;
                
                console.log(`      ✅ Saved: ${fileName}`);
                
                // If this is a date folder, also check for individual award files within it
                if (link.pattern === 'date-folder') {
                    await this.checkDateFolderForAwards(link, content);
                }
                
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

    async checkDateFolderForAwards(dateLink, folderContent) {
        const $ = cheerio.load(folderContent);
        const subLinks = [];
        
        // Look for individual award files within the date folder
        $('a[href]').each((index, element) => {
            const href = $(element).attr('href');
            if (href && href.endsWith('.html') && href.includes('2022')) {
                subLinks.push({
                    url: `https://www.paccentraljc.org/${dateLink.relativeUrl}${href}`,
                    fileName: href,
                    parentDate: dateLink.awardNumber
                });
            }
        });
        
        if (subLinks.length > 0) {
            console.log(`      🔍 Found ${subLinks.length} award files in ${dateLink.awardNumber} folder`);
            
            for (const subLink of subLinks) {
                try {
                    console.log(`         📄 Downloading: ${subLink.fileName}`);
                    const content = await this.downloadUrl(subLink.url);
                    const filePath = path.join(this.htmlDir, `${subLink.parentDate}-${subLink.fileName}`);
                    
                    await fs.writeFile(filePath, content, 'utf8');
                    
                    this.results.htmlFiles.push({
                        fileName: `${subLink.parentDate}-${subLink.fileName}`,
                        awardNumber: subLink.fileName.replace('.html', ''),
                        pattern: 'sub-award',
                        url: subLink.url,
                        parentDate: subLink.parentDate
                    });
                    
                    console.log(`         ✅ Saved: ${subLink.parentDate}-${subLink.fileName}`);
                    
                    await this.delay(this.config.delayBetweenRequests);
                    
                } catch (error) {
                    console.log(`         ❌ Failed to download ${subLink.fileName}: ${error.message}`);
                    this.results.errors.push(`Failed to download ${subLink.fileName}: ${error.message}`);
                }
            }
        }
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

    generateFinalReport() {
        const report = {
            timestamp: new Date().toISOString(),
            year: this.year,
            totalFiles: this.results.htmlFiles.length,
            errors: this.results.errors.length,
            files: this.results.htmlFiles,
            errorDetails: this.results.errors
        };
        
        const reportPath = path.join(this.jsonDir, '2022-download-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('📋 Final Summary:');
        console.log(`   📄 Total HTML files downloaded: ${report.totalFiles}`);
        console.log(`   ❌ Errors encountered: ${report.errors}`);
        console.log(`   📁 Files saved to: ${this.htmlDir}`);
        console.log(`   📊 Report saved to: ${reportPath}\n`);
        
        // Display file breakdown by pattern
        const patterns = {};
        this.results.htmlFiles.forEach(file => {
            patterns[file.pattern] = (patterns[file.pattern] || 0) + 1;
        });
        
        console.log('📊 File breakdown by pattern:');
        Object.entries(patterns).forEach(([pattern, count]) => {
            console.log(`   ${pattern}: ${count} files`);
        });
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.results.errors.forEach(error => {
                console.log(`   • ${error}`);
            });
        }
        
        console.log('\n✅ 2022 Awards HTML download complete!');
    }
}

// Main execution
async function main() {
    const scraper = new Awards2022Scraper();
    
    try {
        await scraper.scrapeAll2022Awards();
    } catch (error) {
        console.error('❌ Scraping failed:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = Awards2022Scraper;