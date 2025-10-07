#!/usr/bin/env node

const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const https = require('https');

class Complete2020Downloader {
    constructor() {
        this.baseDir = path.join(__dirname, '..', '..');
        this.year = '2020';

        // Setup directory structure for 2020
        this.htmlDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year, 'html');
        this.imageDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year, 'images');
        
        // Ensure all directories exist
        fs.ensureDirSync(this.htmlDir);
        fs.ensureDirSync(this.imageDir);
        
        // Rate limiting configuration
        this.config = {
            delayBetweenRequests: 2000, // 2 seconds between requests
            timeout: 15000,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        };
        
        this.results = {
            htmlFiles: [],
            dateIndexFiles: [],
            images: [],
            errors: []
        };
    }

    async downloadComplete() {
        console.log('🚀 Starting COMPLETE 2020 Download Process\n');
        console.log('📋 This will:');
        console.log('   1. 📄 Download 2020 index page');
        console.log('   2. 🔍 Extract all award links AND date-specific index links');
        console.log('   3. 📥 Download individual HTML award pages');
        console.log('   4. 📅 Download date-specific index pages');
        console.log('   5. 🖼️  Download all images (thumbnails and full-size)');
        console.log('   6. ✅ Generate comprehensive summary report\n');

        try {
            // Step 1: Download and parse 2020 index
            console.log('📄 Step 1: Downloading 2020 index page...');
            const indexContent = await this.downloadIndexPage();
            
            // Step 2: Extract all links
            console.log('🔍 Step 2: Extracting award and index links...');
            const links = this.extractAllLinks(indexContent);
            
            // Step 3: Download individual award pages
            console.log(`📥 Step 3: Downloading ${links.awardLinks.length} individual award pages...`);
            await this.downloadAwardPages(links.awardLinks);
            
            // Step 4: Download date index pages
            console.log(`📅 Step 4: Downloading ${links.dateIndexLinks.length} date index pages...`);
            await this.downloadDateIndexPages(links.dateIndexLinks);
            
            // Step 5: Download images
            console.log('🖼️  Step 5: Downloading images from all pages...');
            await this.downloadAllImages();
            
            // Step 6: Generate report
            await this.generateReport();

        } catch (error) {
            console.error('❌ Fatal error in download process:', error);
            throw error;
        }
    }

    async downloadIndexPage() {
        const indexUrl = 'https://www.paccentraljc.org/2020.html';
        const indexPath = path.join(this.htmlDir, '2020-index.html');

        try {
            console.log(`   📡 Downloading: ${indexUrl}`);
            const content = await this.downloadFile(indexUrl);
            await fs.writeFile(indexPath, content, 'utf8');
            console.log(`   💾 Saved: 2020-index.html`);
            return content;
        } catch (error) {
            console.error(`   ❌ Failed to download index: ${error.message}`);
            throw error;
        }
    }

    extractAllLinks(htmlContent) {
        const $ = cheerio.load(htmlContent);
        const awardLinks = [];
        const dateIndexLinks = [];

        // Extract individual award links (like 20200220/20205301.html)
        $('a[href]').each((i, element) => {
            const href = $(element).attr('href');
            
            // Individual award pages (format: YYYYMMDD/20205XXX.html)
            if (href && href.match(/^\d{8}\/20205\d{3}\.html$/)) {
                awardLinks.push(href);
            }
            
            // Date index pages (format: YYYYMMDD/YYYYMMDD.html or similar)
            if (href && href.match(/^\d{8}\/\d{8}\.html$/)) {
                dateIndexLinks.push(href);
            }
        });

        // Remove duplicates
        const uniqueAwardLinks = [...new Set(awardLinks)];
        const uniqueDateIndexLinks = [...new Set(dateIndexLinks)];

        console.log(`   🎯 Found ${uniqueAwardLinks.length} individual award links`);
        console.log(`   📅 Found ${uniqueDateIndexLinks.length} date index links`);

        return {
            awardLinks: uniqueAwardLinks,
            dateIndexLinks: uniqueDateIndexLinks
        };
    }

    async downloadAwardPages(awardLinks) {
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < awardLinks.length; i++) {
            const awardPath = awardLinks[i]; // e.g., "20200220/20205301.html"
            const url = `https://www.paccentraljc.org/${awardPath}`;
            
            // Extract just the award number for filename
            const awardMatch = awardPath.match(/20205\d{3}/);
            const awardId = awardMatch ? awardMatch[0] : awardPath.replace(/\//g, '_');
            const filename = `${awardId}.html`;
            const filepath = path.join(this.htmlDir, filename);

            console.log(`   📄 Downloading ${i + 1}/${awardLinks.length}: ${awardId} (${awardPath})`);

            try {
                const content = await this.downloadFile(url);
                await fs.writeFile(filepath, content, 'utf8');
                this.results.htmlFiles.push(filename);
                successCount++;
                console.log(`      ✅ Saved: ${filename}`);
            } catch (error) {
                console.log(`      ❌ Failed: ${error.message}`);
                this.results.errors.push({ file: filename, error: error.message });
                errorCount++;
            }

            // Rate limiting
            if (i < awardLinks.length - 1) {
                await this.delay(this.config.delayBetweenRequests);
            }
        }

        console.log(`   📊 Award pages: ${successCount} downloaded, ${errorCount} errors`);
    }

    async downloadDateIndexPages(dateIndexLinks) {
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < dateIndexLinks.length; i++) {
            const indexPath = dateIndexLinks[i]; // e.g., "20200220/20200220.html"
            const url = `https://www.paccentraljc.org/${indexPath}`;
            
            // Create descriptive filename from the date
            const dateMatch = indexPath.match(/(\d{4})(\d{2})(\d{2})/);
            let filename;
            if (dateMatch) {
                const [, year, month, day] = dateMatch;
                filename = `${year}-${month}-${day}-index.html`;
            } else {
                filename = indexPath.replace(/\//g, '_');
            }
            
            const filepath = path.join(this.htmlDir, filename);

            console.log(`   📅 Downloading ${i + 1}/${dateIndexLinks.length}: ${indexPath} -> ${filename}`);

            try {
                const content = await this.downloadFile(url);
                await fs.writeFile(filepath, content, 'utf8');
                this.results.dateIndexFiles.push(filename);
                successCount++;
                console.log(`      ✅ Saved: ${filename}`);
            } catch (error) {
                console.log(`      ❌ Failed: ${error.message}`);
                this.results.errors.push({ file: filename, error: error.message });
                errorCount++;
            }

            // Rate limiting
            if (i < dateIndexLinks.length - 1) {
                await this.delay(this.config.delayBetweenRequests);
            }
        }

        console.log(`   📊 Date index pages: ${successCount} downloaded, ${errorCount} errors`);
    }

    async downloadAllImages() {
        // Get all HTML files to extract images from
        const htmlFiles = await fs.readdir(this.htmlDir);
        const awardHtmlFiles = htmlFiles.filter(f => f.match(/^20205\d{3}\.html$/));
        
        console.log(`   🔍 Scanning ${awardHtmlFiles.length} award pages for images...`);
        
        const imageUrls = new Set();
        
        // Extract image URLs from each HTML file
        for (const htmlFile of awardHtmlFiles) {
            try {
                const htmlPath = path.join(this.htmlDir, htmlFile);
                const content = await fs.readFile(htmlPath, 'utf8');
                const $ = cheerio.load(content);
                
                // Look for image tags and extract src attributes
                $('img').each((i, element) => {
                    const src = $(element).attr('src');
                    if (src) {
                        // Handle relative URLs
                        if (src.startsWith('http')) {
                            imageUrls.add(src);
                        } else if (!src.startsWith('data:')) {
                            // Convert relative URL to absolute
                            const baseUrl = 'https://www.paccentraljc.org/awards/';
                            const fullUrl = src.startsWith('/') ? `https://www.paccentraljc.org${src}` : `${baseUrl}${src}`;
                            imageUrls.add(fullUrl);
                        }
                    }
                });
            } catch (error) {
                console.log(`      ⚠️  Error scanning ${htmlFile}: ${error.message}`);
            }
        }
        
        const uniqueImages = Array.from(imageUrls);
        console.log(`   🖼️  Found ${uniqueImages.length} unique images to download`);
        
        // Download images
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < uniqueImages.length; i++) {
            const imageUrl = uniqueImages[i];
            const filename = path.basename(imageUrl).split('?')[0]; // Remove query parameters
            const filepath = path.join(this.imageDir, filename);
            
            console.log(`   🖼️  Downloading ${i + 1}/${uniqueImages.length}: ${filename}`);
            
            try {
                const imageData = await this.downloadBinaryFile(imageUrl);
                await fs.writeFile(filepath, imageData);
                this.results.images.push(filename);
                successCount++;
                console.log(`      ✅ Saved: ${filename}`);
            } catch (error) {
                console.log(`      ❌ Failed: ${error.message}`);
                this.results.errors.push({ file: filename, error: error.message });
                errorCount++;
            }
            
            // Rate limiting
            if (i < uniqueImages.length - 1) {
                await this.delay(1000); // Shorter delay for images
            }
        }
        
        console.log(`   📊 Images: ${successCount} downloaded, ${errorCount} errors`);
    }

    async downloadFile(url) {
        return new Promise((resolve, reject) => {
            const request = https.get(url, {
                headers: { 'User-Agent': this.config.userAgent },
                timeout: this.config.timeout
            }, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                let data = '';
                response.setEncoding('utf8');
                response.on('data', chunk => data += chunk);
                response.on('end', () => resolve(data));
            });

            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    async downloadBinaryFile(url) {
        return new Promise((resolve, reject) => {
            const request = https.get(url, {
                headers: { 'User-Agent': this.config.userAgent },
                timeout: this.config.timeout
            }, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                const chunks = [];
                response.on('data', chunk => chunks.push(chunk));
                response.on('end', () => resolve(Buffer.concat(chunks)));
            });

            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async generateReport() {
        console.log('\n📊 Download Complete - Generating Summary Report...\n');
        
        const report = {
            timestamp: new Date().toISOString(),
            year: this.year,
            summary: {
                htmlFiles: this.results.htmlFiles.length,
                dateIndexFiles: this.results.dateIndexFiles.length,
                images: this.results.images.length,
                totalErrors: this.results.errors.length
            },
            details: this.results
        };

        const reportPath = path.join(path.dirname(this.htmlDir), 'data', 'download-report.json');
        fs.ensureDirSync(path.dirname(reportPath));
        await fs.writeJSON(reportPath, report, { spaces: 2 });

        console.log('📋 DOWNLOAD SUMMARY:');
        console.log(`   📄 HTML Award Files: ${report.summary.htmlFiles}`);
        console.log(`   📅 Date Index Files: ${report.summary.dateIndexFiles}`);
        console.log(`   🖼️  Images: ${report.summary.images}`);
        console.log(`   ❌ Errors: ${report.summary.totalErrors}`);
        console.log(`\n📁 Files saved to:`);
        console.log(`   HTML: ${this.htmlDir}`);
        console.log(`   Images: ${this.imageDir}`);
        console.log(`   Report: ${reportPath}`);
        console.log('\n✅ 2020 Complete Download Process Finished!');
    }
}

// Run the complete download
const downloader = new Complete2020Downloader();
downloader.downloadComplete().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});