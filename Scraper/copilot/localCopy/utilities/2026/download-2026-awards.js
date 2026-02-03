const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class Awards2026Downloader {
    constructor(options = {}) {
        this.baseUrl = 'https://www.paccentraljc.org';
        this.outputDir = path.join(__dirname, '../../paccentraljc.org/awards/2026/html');
        this.delay = options.delay || 2000; // 2 seconds between requests to be respectful
        this.userAgent = options.userAgent || 'Mozilla/5.0 (compatible; OrchidScraper/1.0)';
        this.downloadedCount = 0;
        this.failedCount = 0;
        this.failedDownloads = [];
        this.maxRetries = 3;
    }

    /**
     * Generate award URLs to download for 2026
     * Trying different numbering patterns since we're getting 404s
     */
    generateAwardUrls() {
        const awards = [];
        
        // Try multiple potential numbering patterns for 2026
        const patterns = [
            // Pattern 1: 20266xxx (most likely)
            { prefix: '20266', start: 1, end: 50 },
            // Pattern 2: 20265xxx (backup)
            { prefix: '20265', start: 1, end: 20 },
            // Pattern 3: 20260xxx (alternative)
            { prefix: '20260', start: 1, end: 20 }
        ];
        
        patterns.forEach(pattern => {
            for (let i = pattern.start; i <= pattern.end; i++) {
                const awardNum = `${pattern.prefix}${i.toString().padStart(3, '0')}`;
                awards.push({
                    num: awardNum,
                    url: `${this.baseUrl}/awards/${awardNum}.html`,
                    pattern: pattern.prefix
                });
            }
        });
        
        return awards;
    }

    /**
     * Download a single page with retries
     */
    async downloadPage(url, retries = 0) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                }
            };

            const req = client.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve({
                            html: data,
                            status: res.statusCode,
                            url: url
                        });
                    } else if (res.statusCode === 404) {
                        resolve({
                            html: null,
                            status: 404,
                            url: url
                        });
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });

            req.on('error', (error) => {
                if (retries < this.maxRetries) {
                    console.log(`⚠️  Retrying ${url} (attempt ${retries + 1}/${this.maxRetries})`);
                    setTimeout(() => {
                        this.downloadPage(url, retries + 1).then(resolve).catch(reject);
                    }, this.delay * (retries + 1));
                } else {
                    reject(error);
                }
            });

            req.setTimeout(15000, () => {
                req.destroy();
                if (retries < this.maxRetries) {
                    console.log(`⏱️  Timeout for ${url}, retrying (attempt ${retries + 1}/${this.maxRetries})`);
                    setTimeout(() => {
                        this.downloadPage(url, retries + 1).then(resolve).catch(reject);
                    }, this.delay * (retries + 1));
                } else {
                    reject(new Error('Request timeout after max retries'));
                }
            });

            req.end();
        });
    }

    /**
     * Save HTML content to file
     */
    async saveHtmlFile(awardNum, html) {
        const fileName = `${awardNum}.html`;
        const filePath = path.join(this.outputDir, fileName);
        await fs.writeFile(filePath, html);
        return fileName;
    }

    /**
     * Download all 2026 awards
     */
    async downloadAll2026Awards() {
        console.log(`🌸 Starting download of 2026 orchid awards`);
        console.log(`🌐 Base URL: ${this.baseUrl}`);
        console.log(`📁 Output directory: ${this.outputDir}`);
        console.log(`⏱️  Delay between requests: ${this.delay}ms\n`);
        
        await fs.ensureDir(this.outputDir);
        
        const awards = this.generateAwardUrls();
        console.log(`📋 Generated ${awards.length} award URLs to check\n`);
        
        for (let i = 0; i < awards.length; i++) {
            const award = awards[i];
            
            try {
                console.log(`📄 [${i + 1}/${awards.length}] Checking award ${award.num}...`);
                
                const result = await this.downloadPage(award.url);
                
                if (result.status === 200 && result.html) {
                    const fileName = await this.saveHtmlFile(award.num, result.html);
                    console.log(`   ✅ Downloaded: ${fileName}`);
                    this.downloadedCount++;
                } else if (result.status === 404) {
                    console.log(`   ⚠️  Not found (404): ${award.num}`);
                } else {
                    console.log(`   ❌ Failed: ${award.num} (Status: ${result.status})`);
                    this.failedCount++;
                    this.failedDownloads.push({ award: award.num, error: `HTTP ${result.status}` });
                }
                
            } catch (error) {
                console.log(`   ❌ Error downloading ${award.num}: ${error.message}`);
                this.failedCount++;
                this.failedDownloads.push({ award: award.num, error: error.message });
            }
            
            // Add delay between requests to be respectful
            if (i < awards.length - 1) {
                console.log(`   ⏳ Waiting ${this.delay}ms before next request...`);
                await new Promise(resolve => setTimeout(resolve, this.delay));
            }
        }
        
        // Print summary
        this.printSummary();
    }

    /**
     * Download specific award numbers
     */
    async downloadSpecificAwards(awardNumbers) {
        console.log(`🌸 Starting download of specific 2026 awards: ${awardNumbers.join(', ')}`);
        console.log(`📁 Output directory: ${this.outputDir}\n`);
        
        await fs.ensureDir(this.outputDir);
        
        for (let i = 0; i < awardNumbers.length; i++) {
            const awardNum = awardNumbers[i];
            const url = `${this.baseUrl}/awards/${awardNum}.html`;
            
            try {
                console.log(`📄 [${i + 1}/${awardNumbers.length}] Downloading award ${awardNum}...`);
                
                const result = await this.downloadPage(url);
                
                if (result.status === 200 && result.html) {
                    const fileName = await this.saveHtmlFile(awardNum, result.html);
                    console.log(`   ✅ Downloaded: ${fileName}`);
                    this.downloadedCount++;
                } else if (result.status === 404) {
                    console.log(`   ⚠️  Not found (404): ${awardNum}`);
                } else {
                    console.log(`   ❌ Failed: ${awardNum} (Status: ${result.status})`);
                    this.failedCount++;
                    this.failedDownloads.push({ award: awardNum, error: `HTTP ${result.status}` });
                }
                
            } catch (error) {
                console.log(`   ❌ Error downloading ${awardNum}: ${error.message}`);
                this.failedCount++;
                this.failedDownloads.push({ award: awardNum, error: error.message });
            }
            
            // Add delay between requests
            if (i < awardNumbers.length - 1) {
                await new Promise(resolve => setTimeout(resolve, this.delay));
            }
        }
        
        this.printSummary();
    }

    /**
     * Print download summary
     */
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 2026 AWARDS DOWNLOAD SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successfully downloaded: ${this.downloadedCount} awards`);
        console.log(`❌ Failed downloads: ${this.failedCount} awards`);
        
        if (this.failedDownloads.length > 0) {
            console.log('\n⚠️  Failed downloads:');
            this.failedDownloads.forEach(fail => {
                console.log(`   • ${fail.award}: ${fail.error}`);
            });
        }
        
        console.log(`\n📁 Files saved to: ${this.outputDir}`);
        console.log('🎉 Download process completed!');
    }
}

// Command line usage
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const downloader = new Awards2026Downloader();
    
    try {
        if (command === 'specific' && args.length > 1) {
            // Download specific award numbers
            const awardNumbers = args.slice(1);
            await downloader.downloadSpecificAwards(awardNumbers);
        } else if (command === 'range' && args.length >= 3) {
            // Download a range of award numbers
            const start = parseInt(args[1]);
            const end = parseInt(args[2]);
            const prefix = args[3] || '20266'; // Default to 20266 pattern
            const awardNumbers = [];
            
            for (let i = start; i <= end; i++) {
                const awardNum = `${prefix}${i.toString().padStart(3, '0')}`;
                awardNumbers.push(awardNum);
            }
            
            console.log(`📋 Downloading range ${start}-${end} with prefix ${prefix}`);
            await downloader.downloadSpecificAwards(awardNumbers);
        } else if (command === 'all') {
            // Download all awards (1-100)
            await downloader.downloadAll2026Awards();
        } else {
            console.log('2026 Orchid Awards Downloader');
            console.log('============================');
            console.log('Usage:');
            console.log('  node download-2026-awards.js all                           # Try multiple patterns automatically');
            console.log('  node download-2026-awards.js specific [nums...]            # Download specific award numbers');
            console.log('  node download-2026-awards.js range [start] [end] [prefix]  # Download range with prefix');
            console.log('');
            console.log('Examples:');
            console.log('  node download-2026-awards.js specific 20266001 20266002 20266003');
            console.log('  node download-2026-awards.js range 1 20 20266              # Downloads 20266001-20266020');
            console.log('  node download-2026-awards.js range 1 20 20265              # Downloads 20265001-20265020');
            console.log('  node download-2026-awards.js all');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = Awards2026Downloader;