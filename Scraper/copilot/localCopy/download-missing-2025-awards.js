const fs = require('.pnpm/fs-extra@11.3.2/node_modules/fs-extra');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class Missing2025AwardsDownloader {
    constructor(options = {}) {
        this.baseUrl = 'https://www.paccentraljc.org';
        this.outputDir = path.join(__dirname, 'paccentraljc.org/awards/2025/html');
        this.delay = options.delay || 2000; // 2 seconds between requests to be respectful
        this.userAgent = options.userAgent || 'Mozilla/5.0 (compatible; OrchidScraper/1.0)';
        this.downloadedCount = 0;
        this.failedCount = 0;
        this.failedDownloads = [];
    }

    async downloadMissingAwards() {
        console.log(`🌸 Starting download of missing 2025 orchid awards`);
        console.log(`📁 Output directory: ${this.outputDir}`);
        
        await fs.ensureDir(this.outputDir);
        
        // Missing award numbers identified from analysis
        const missingAwards = [
            // September 20, 2025 - Filoli Historic House Monthly
            { num: '20255324', date: '250920' },
            { num: '20255325', date: '250920' },
            
            // November 15, 2025 - Filoli Historic House Monthly  
            { num: '20255326', date: '251115' },
            { num: '20255327', date: '251115' },
            { num: '20255328', date: '251115' },
            { num: '20255329', date: '251115' },
            
            // December 20, 2025 - Filoli Historic House Monthly
            { num: '20255330', date: '251220' },
            { num: '20255331', date: '251220' },
            { num: '20255332', date: '251220' },
            { num: '20255333', date: '251220' },
            { num: '20255334', date: '251220' },
            { num: '20255335', date: '251220' },
            { num: '20255336', date: '251220' },
            { num: '20255337', date: '251220' },
            { num: '20255338', date: '251220' },
            { num: '20255339', date: '251220' },
            { num: '20255340', date: '251220' },
            { num: '20255341', date: '251220' },
            
            // October 4, 2025 - Peninsula Orchid Society Show
            { num: '20255375', date: '251004' },
            { num: '20255376', date: '251004' },
            { num: '20255377', date: '251004' },
            { num: '20255378', date: '251004' },
            { num: '20255379', date: '251004' },
            { num: '20255380', date: '251004' },
            { num: '20255381', date: '251004' },
            { num: '20255382', date: '251004' }
        ];

        console.log(`📋 Found ${missingAwards.length} missing awards to download\n`);
        
        for (let i = 0; i < missingAwards.length; i++) {
            const award = missingAwards[i];
            const url = `${this.baseUrl}/${award.date}/${award.num}.html`;
            const imageUrl = `${this.baseUrl}/${award.date}/${award.num}.jpg`;
            
            console.log(`📄 Downloading (${i + 1}/${missingAwards.length}): ${award.num}`);
            console.log(`   🌐 HTML URL: ${url}`);
            console.log(`   🖼️  Image URL: ${imageUrl}`);
            
            try {
                // Download HTML file
                const { html, fileName } = await this.downloadPage(url);
                const htmlFilePath = path.join(this.outputDir, `${award.num}.html`);
                await fs.writeFile(htmlFilePath, html);
                console.log(`   ✅ HTML saved: ${award.num}.html`);
                
                // Download image file
                try {
                    await this.downloadImage(imageUrl, path.join(this.outputDir, `${award.num}.jpg`));
                    console.log(`   ✅ Image saved: ${award.num}.jpg`);
                } catch (imageError) {
                    console.warn(`   ⚠️  Image failed: ${imageError.message}`);
                }
                
                this.downloadedCount++;
                
            } catch (error) {
                console.error(`   ❌ Error downloading ${award.num}: ${error.message}`);
                this.failedCount++;
                this.failedDownloads.push({
                    awardNum: award.num,
                    url: url,
                    error: error.message
                });
            }
            
            // Be respectful - add delay between requests
            if (i < missingAwards.length - 1) {
                console.log(`   ⏳ Waiting ${this.delay}ms before next download...\n`);
                await this.sleep(this.delay);
            }
        }
        
        this.printSummary();
    }

    downloadPage(url) {
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
                    'Accept-Encoding': 'identity',
                    'Connection': 'close'
                }
            };
            
            const req = client.request(options, (res) => {
                let html = '';
                
                res.on('data', (chunk) => {
                    html += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const fileName = path.basename(urlObj.pathname);
                        resolve({ html, fileName });
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.setTimeout(30000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }

    downloadImage(url, filePath) {
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
                    'Accept': 'image/*',
                    'Connection': 'close'
                }
            };
            
            const req = client.request(options, (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const fileStream = fs.createWriteStream(filePath);
                    res.pipe(fileStream);
                    
                    fileStream.on('finish', () => {
                        resolve();
                    });
                    
                    fileStream.on('error', (error) => {
                        reject(error);
                    });
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                }
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.setTimeout(30000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }

    printSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 DOWNLOAD SUMMARY');
        console.log('='.repeat(80));
        console.log(`✅ Successfully downloaded: ${this.downloadedCount} awards`);
        console.log(`❌ Failed downloads: ${this.failedCount} awards`);
        
        if (this.failedDownloads.length > 0) {
            console.log('\n❌ Failed Downloads:');
            this.failedDownloads.forEach(failed => {
                console.log(`   • ${failed.awardNum}: ${failed.error}`);
            });
            
            console.log('\n🔄 You can retry failed downloads by checking these URLs manually:');
            this.failedDownloads.forEach(failed => {
                console.log(`   • ${failed.url}`);
            });
        }
        
        console.log(`\n📁 Files saved to: ${this.outputDir}`);
        console.log('='.repeat(80));
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the downloader if called directly
if (require.main === module) {
    const downloader = new Missing2025AwardsDownloader({
        delay: 2000 // 2 seconds between requests
    });
    
    downloader.downloadMissingAwards().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { Missing2025AwardsDownloader };