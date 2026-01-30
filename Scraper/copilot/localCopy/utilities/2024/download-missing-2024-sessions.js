#!/usr/bin/env node

/**
 * Download Missing 2024 Award Sessions
 * Downloads missing 2024 award sessions that use the new 240XXX naming format
 * Starting from June 5, 2024 (240605) through December 2024
 * 
 * Usage: node download-missing-2024-sessions.js
 */

const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class Missing2024SessionsDownloader {
    constructor(options = {}) {
        this.baseUrl = 'https://paccentraljc.org';
        this.htmlDir = path.join(__dirname, '../../paccentraljc.org/awards/2024/html');
        this.imagesDir = path.join(__dirname, '../../paccentraljc.org/awards/2024/images');
        this.delay = options.delay || 2000; // 2 seconds between requests
        this.userAgent = 'Mozilla/5.0 (compatible; OrchidScraper/1.0)';
        this.downloadedCount = 0;
        this.failedCount = 0;
        this.failedDownloads = [];
        this.skippedCount = 0;
        
        // Missing sessions identified from the 2024.html index analysis
        this.missingSessions = [
            // June 2024
            { date: '240605', awards: ['20245377', '20245378'], event: 'Jun 5 - San Francisco Monthly' },
            { date: '240615', awards: ['20245286', '20245287', '20245288', '20245289'], event: 'Jun 15 - Filoli Historic House Monthly' },
            
            // July 2024  
            { date: '240702', awards: ['20245379', '20245380', '20245381'], event: 'Jul 2 - San Francisco Monthly' },
            { date: '240720', awards: ['20245290', '20245291', '20245292'], event: 'Jul 20 - Filoli Historic House Monthly' },
            
            // August 2024
            { date: '240817', awards: ['20245293', '20245294', '20245295', '20245296', '20245297'], event: 'Aug 17 - Filoli Historic House Monthly' },
            
            // September 2024
            { date: '240903', awards: ['20245382'], event: 'Sep 3 - San Francisco Monthly' },
            { date: '240921', awards: ['20245298', '20245299', '20245300'], event: 'Sep 21 - Filoli Historic House Monthly' },
            
            // October 2024
            { date: '241001', awards: ['20245383', '20245384'], event: 'Oct 1 - San Francisco Monthly' },
            
            // November 2024
            { date: '241105', awards: ['20245385', '20245386', '20245387', '20245388', '20245389', '20245390', '20245391', '20245392', '20245393', '20245394', '20245395', '20245396', '20245397', '20245398', '20245399', '20245400', '20245401', '20245402', '20245403', '20245404', '20245405'], event: 'Nov 5 - National Cheng Kung University Fall Orchid Show, Taiwan' },
            { date: '241116', awards: ['20245301', '20245302', '20245303'], event: 'Nov 16 - Filoli Historic House Monthly' },
            
            // December 2024
            { date: '241203', awards: ['20245310'], event: 'Dec 3 - San Francisco Monthly' },
            { date: '241221', awards: ['20245304', '20245305', '20245306', '20245307', '20245308'], event: 'Dec 21 - Filoli Historic House Monthly' }
        ];
    }

    /**
     * Check if a file already exists locally
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
     * Download a file from URL to local path
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
                timeout: 30000 // 30 second timeout
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
                    fs.unlink(filePath, () => {}); // Clean up partial file
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
     * Delay execution for rate limiting
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Download session index file and individual award pages
     */
    async downloadSessionFiles(session) {
        console.log(`\n📅 Processing session: ${session.event}`);
        
        // Create session folder in HTML directory
        const sessionHtmlDir = path.join(this.htmlDir, session.date);
        await fs.ensureDir(sessionHtmlDir);

        // Download session index file (e.g., 240605.html)
        const sessionIndexUrl = `${this.baseUrl}/awards/2024/html/${session.date}/${session.date}.html`;
        const sessionIndexPath = path.join(sessionHtmlDir, `${session.date}.html`);
        
        if (await this.fileExists(sessionIndexPath)) {
            console.log(`   ⏭️  Session index already exists: ${session.date}.html`);
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
            const awardUrl = `${this.baseUrl}/awards/2024/html/${session.date}/${awardNum}.html`;
            const awardPath = path.join(sessionHtmlDir, `${awardNum}.html`);
            
            if (await this.fileExists(awardPath)) {
                console.log(`   ⏭️  Award already exists: ${awardNum}.html`);
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
    async downloadSessionImages(session) {
        console.log(`\n🖼️  Downloading images for session: ${session.event}`);
        
        for (const awardNum of session.awards) {
            const imageUrl = `${this.baseUrl}/awards/2024/images/${awardNum}.jpg`;
            const imagePath = path.join(this.imagesDir, `${awardNum}.jpg`);
            
            if (await this.fileExists(imagePath)) {
                console.log(`   ⏭️  Image already exists: ${awardNum}.jpg`);
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

    /**
     * Main download process
     */
    async downloadMissingSessions() {
        console.log('🌸 Starting download of missing 2024 award sessions');
        console.log(`📁 HTML output: ${this.htmlDir}`);
        console.log(`📁 Images output: ${this.imagesDir}`);
        console.log(`⏱️  Delay between requests: ${this.delay}ms`);
        console.log(`📋 Sessions to process: ${this.missingSessions.length}`);
        
        const totalAwards = this.missingSessions.reduce((sum, session) => sum + session.awards.length, 0);
        console.log(`🏆 Total individual awards: ${totalAwards}`);
        
        await fs.ensureDir(this.htmlDir);
        await fs.ensureDir(this.imagesDir);

        const startTime = Date.now();

        for (const session of this.missingSessions) {
            await this.downloadSessionFiles(session);
            await this.downloadSessionImages(session);
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
            const downloader = new Missing2024SessionsDownloader();
            await downloader.downloadMissingSessions();
        } catch (error) {
            console.error('❌ Download failed:', error.message);
            process.exit(1);
        }
    }
    
    main();
}

module.exports = Missing2024SessionsDownloader;