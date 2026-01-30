const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const cheerio = require('cheerio');

class Missing2024AwardsFromIndexDownloader {
    constructor(options = {}) {
        this.baseUrl = 'https://paccentraljc.org';
        this.indexPath = path.join(__dirname, '../../paccentraljc.org/awards/2024/html/2024.html');
        this.htmlOutputDir = path.join(__dirname, '../../paccentraljc.org/awards/2024/html');
        this.imagesOutputDir = path.join(__dirname, '../../paccentraljc.org/awards/2024/images');
        this.delay = options.delay || 2000; // 2 seconds between requests to be respectful
        this.userAgent = options.userAgent || 'Mozilla/5.0 (compatible; OrchidScraper/1.0)';
        this.downloadedCount = 0;
        this.failedCount = 0;
        this.skippedCount = 0;
        this.failedDownloads = [];
    }

    /**
     * Parse the 2024.html index file to find all award sessions and awards
     */
    async parseIndexFile() {
        console.log('📋 Parsing 2024.html index file...');
        
        if (!await fs.pathExists(this.indexPath)) {
            throw new Error(`Index file not found: ${this.indexPath}`);
        }
        
        const indexHtml = await fs.readFile(this.indexPath, 'utf-8');
        const $ = cheerio.load(indexHtml);
        
        const sessions = [];
        const allAwards = [];
        
        // Find all table rows containing session information
        $('tr').each((i, row) => {
            const $row = $(row);
            const cells = $row.find('td');
            
            if (cells.length >= 2) {
                const sessionCell = $(cells[0]);
                const awardsCell = $(cells[1]);
                
                // Look for session links (like "240605/240605.html")
                const sessionLink = sessionCell.find('a[href*="/"]').first();
                if (sessionLink.length > 0) {
                    const href = sessionLink.attr('href');
                    const sessionMatch = href.match(/(\d{6})\/\1\.html/); // e.g., "240605/240605.html"
                    
                    if (sessionMatch) {
                        const sessionDate = sessionMatch[1];
                        const sessionText = sessionCell.text().trim();
                        
                        // Extract award numbers from the awards cell
                        const awardLinks = awardsCell.find('a[href*=".html"]');
                        const awards = [];
                        
                        awardLinks.each((j, link) => {
                            const awardHref = $(link).attr('href');
                            const awardMatch = awardHref.match(/(\d{8})\.html/);
                            if (awardMatch) {
                                awards.push(awardMatch[1]);
                                allAwards.push(awardMatch[1]);
                            }
                        });
                        
                        if (awards.length > 0) {
                            sessions.push({
                                date: sessionDate,
                                event: sessionText,
                                awards: awards
                            });
                        }
                    }
                }
            }
        });
        
        console.log(`   Found ${sessions.length} sessions with ${allAwards.length} total awards`);
        return { sessions, allAwards };
    }

    /**
     * Check if file already exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Download a file from URL
     */
    async downloadFile(url, filePath, fileType = 'html') {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname,
                method: 'GET',
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': fileType === 'image' ? 'image/*' : 'text/html,application/xhtml+xml',
                    'Connection': 'close'
                },
                timeout: 30000
            };

            const req = client.request(options, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    return;
                }

                const fileStream = fs.createWriteStream(filePath);
                res.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });

                fileStream.on('error', (err) => {
                    fs.unlink(filePath, () => {});
                    reject(err);
                });
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.on('error', (err) => {
                reject(err);
            });

            req.end();
        });
    }

    /**
     * Sleep for rate limiting
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Download missing session files
     */
    async downloadSessionFiles(session) {
        console.log(`\n📅 Processing session: ${session.event}`);
        
        // Create session directory
        const sessionDir = path.join(this.htmlOutputDir, session.date);
        await fs.ensureDir(sessionDir);

        // Determine URL structure based on date format
        // Awards from June 5, 2024 onward use the new direct URL structure
        const isNewFormat = session.date.length === 6; // 240605 vs 20240605
        const sessionIndexUrl = isNewFormat 
            ? `${this.baseUrl}/${session.date}/${session.date}.html`
            : `${this.baseUrl}/awards/2024/html/${session.date}/${session.date}.html`;
        const sessionIndexPath = path.join(sessionDir, `${session.date}.html`);
        
        if (await this.fileExists(sessionIndexPath)) {
            console.log(`   ⏭️  Session index exists: ${session.date}.html`);
            this.skippedCount++;
        } else {
            try {
                console.log(`   📄 Downloading session index: ${session.date}.html`);
                await this.downloadFile(sessionIndexUrl, sessionIndexPath);
                this.downloadedCount++;
                console.log(`   ✅ Downloaded: ${session.date}.html`);
            } catch (error) {
                console.log(`   ❌ Failed session index: ${session.date}.html - ${error.message}`);
                this.failedCount++;
                this.failedDownloads.push({ url: sessionIndexUrl, error: error.message });
            }
            await this.sleep(this.delay);
        }

        // Download individual award files
        for (const awardNum of session.awards) {
            const awardUrl = isNewFormat
                ? `${this.baseUrl}/${session.date}/${awardNum}.html`
                : `${this.baseUrl}/awards/2024/html/${session.date}/${awardNum}.html`;
            const awardPath = path.join(sessionDir, `${awardNum}.html`);
            
            if (await this.fileExists(awardPath)) {
                console.log(`   ⏭️  Award exists: ${awardNum}.html`);
                this.skippedCount++;
            } else {
                try {
                    console.log(`   📄 Downloading award: ${awardNum}.html`);
                    await this.downloadFile(awardUrl, awardPath);
                    this.downloadedCount++;
                    console.log(`   ✅ Downloaded: ${awardNum}.html`);
                } catch (error) {
                    console.log(`   ❌ Failed award: ${awardNum}.html - ${error.message}`);
                    this.failedCount++;
                    this.failedDownloads.push({ url: awardUrl, error: error.message });
                }
                await this.sleep(this.delay);
            }
        }
    }

    /**
     * Download award images  
     */
    async downloadAwardImages(sessions) {
        console.log(`\n🖼️  Downloading award images...`);
        
        for (const session of sessions) {
            const isNewFormat = session.date.length === 6;
            
            for (const awardNum of session.awards) {
                const imageUrl = isNewFormat
                    ? `${this.baseUrl}/${session.date}/${awardNum}.jpg`
                    : `${this.baseUrl}/awards/2024/images/${awardNum}.jpg`;
                const imagePath = path.join(this.imagesOutputDir, `${awardNum}.jpg`);
            
                if (await this.fileExists(imagePath)) {
                    console.log(`   ⏭️  Image exists: ${awardNum}.jpg`);
                    this.skippedCount++;
                } else {
                    try {
                        console.log(`   🖼️  Downloading image: ${awardNum}.jpg`);
                        await this.downloadFile(imageUrl, imagePath, 'image');
                        this.downloadedCount++;
                        console.log(`   ✅ Downloaded: ${awardNum}.jpg`);
                    } catch (error) {
                        console.log(`   ❌ Failed image: ${awardNum}.jpg - ${error.message}`);
                        this.failedCount++;
                        this.failedDownloads.push({ url: imageUrl, error: error.message });
                    }
                    await this.sleep(this.delay);
                }
            }
        }
    }

    /**
     * Main download process
     */
    async downloadMissingAwards() {
        console.log('🌸 Starting download of missing 2024 orchid awards');
        console.log(`📁 HTML output: ${this.htmlOutputDir}`);
        console.log(`📁 Images output: ${this.imagesOutputDir}`);
        console.log(`⏱️  Delay between requests: ${this.delay}ms`);
        
        await fs.ensureDir(this.htmlOutputDir);
        await fs.ensureDir(this.imagesOutputDir);

        const startTime = Date.now();

        try {
            // Parse the index file to find all sessions and awards
            const { sessions, allAwards } = await this.parseIndexFile();
            
            console.log(`\n📋 Processing ${sessions.length} sessions with ${allAwards.length} awards total\n`);
            
            // Download session files
            for (const session of sessions) {
                await this.downloadSessionFiles(session);
            }
            
            // Download all award images
            await this.downloadAwardImages(sessions);
            
        } catch (error) {
            console.error('❌ Download failed:', error.message);
            throw error;
        }

        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);

        this.printSummary(duration);
    }

    /**
     * Print download summary
     */
    printSummary(durationSeconds) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 DOWNLOAD COMPLETE - SUMMARY');
        console.log('='.repeat(60));
        console.log(`⏱️  Duration: ${durationSeconds} seconds`);
        console.log(`✅ Successfully downloaded: ${this.downloadedCount} files`);
        console.log(`⏭️  Already existed (skipped): ${this.skippedCount} files`);
        console.log(`❌ Failed downloads: ${this.failedCount} files`);
        
        if (this.failedDownloads.length > 0) {
            console.log('\n❌ FAILED DOWNLOADS:');
            this.failedDownloads.forEach(item => {
                console.log(`   ${item.url} - ${item.error}`);
            });
        }
        
        console.log('\n🎯 NEXT STEPS:');
        console.log('1. Run the 2024htmlToJSONparse.js script to convert HTML to JSON');
        console.log('2. Import the new JSON data into your database');
        console.log('3. Update the website to include the new 2024 awards');
    }
}

// Run if called directly
if (require.main === module) {
    async function main() {
        try {
            const downloader = new Missing2024AwardsFromIndexDownloader();
            await downloader.downloadMissingAwards();
        } catch (error) {
            console.error('❌ Download failed:', error.message);
            process.exit(1);
        }
    }
    
    main();
}

module.exports = Missing2024AwardsFromIndexDownloader;