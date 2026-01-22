const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class WebsiteDownloader {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl;
        this.outputDir = options.outputDir || './downloaded-site';
        this.delay = options.delay || 1000; // 1 second between requests
        this.maxPages = options.maxPages || 100;
        this.visitedUrls = new Set();
        this.downloadedCount = 0;
        this.userAgent = options.userAgent || 'Mozilla/5.0 (compatible; OrchidScraper/1.0)';
    }

    async downloadSite(startUrl) {
        console.log(`🌐 Starting download of: ${startUrl}`);
        console.log(`📁 Output directory: ${this.outputDir}`);
        
        await fs.ensureDir(this.outputDir);
        
        const urlsToProcess = [startUrl];
        
        while (urlsToProcess.length > 0 && this.downloadedCount < this.maxPages) {
            const currentUrl = urlsToProcess.shift();
            
            if (this.visitedUrls.has(currentUrl)) {
                continue;
            }
            
            try {
                console.log(`📄 Downloading (${this.downloadedCount + 1}/${this.maxPages}): ${currentUrl}`);
                
                const { html, fileName } = await this.downloadPage(currentUrl);
                
                // Save the HTML file
                const filePath = path.join(this.outputDir, fileName);
                await fs.writeFile(filePath, html);
                
                // Extract links for further crawling (optional)
                const links = this.extractLinks(html, currentUrl);
                
                // Add new links to process queue
                links.forEach(link => {
                    if (!this.visitedUrls.has(link) && this.isValidUrl(link)) {
                        urlsToProcess.push(link);
                    }
                });
                
                this.visitedUrls.add(currentUrl);
                this.downloadedCount++;
                
                // Be respectful - add delay
                await this.delay > 0 ? this.sleep(this.delay) : Promise.resolve();
                
            } catch (error) {
                console.error(`❌ Error downloading ${currentUrl}:`, error.message);
            }
        }
        
        console.log(`✅ Download complete! Downloaded ${this.downloadedCount} pages to ${this.outputDir}`);
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
                        const fileName = this.generateFileName(url);
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

    generateFileName(url) {
        const urlObj = new URL(url);
        let fileName = urlObj.pathname;
        
        // Handle root path
        if (fileName === '/' || fileName === '') {
            fileName = '/index';
        }
        
        // Remove leading slash
        fileName = fileName.substring(1);
        
        // Replace slashes with underscores
        fileName = fileName.replace(/\//g, '_');
        
        // Add .html extension if not present
        if (!fileName.endsWith('.html') && !fileName.endsWith('.htm')) {
            fileName += '.html';
        }
        
        // Handle query parameters
        if (urlObj.search) {
            const queryHash = Buffer.from(urlObj.search).toString('base64').substring(0, 8);
            fileName = fileName.replace('.html', `_${queryHash}.html`);
        }
        
        return fileName;
    }

    extractLinks(html, baseUrl) {
        const links = [];
        const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
        let match;
        
        while ((match = linkRegex.exec(html)) !== null) {
            try {
                const link = new URL(match[1], baseUrl).href;
                links.push(link);
            } catch (error) {
                // Invalid URL, skip
            }
        }
        
        return links;
    }

    isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            const baseUrlObj = new URL(this.baseUrl);
            
            // Only download from same domain
            if (urlObj.hostname !== baseUrlObj.hostname) {
                return false;
            }
            
            // Skip non-HTML resources
            const path = urlObj.pathname.toLowerCase();
            if (path.match(/\.(jpg|jpeg|png|gif|css|js|pdf|zip|exe|dmg)$/)) {
                return false;
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Simple URL list downloader (if you have a list of specific URLs)
class URLListDownloader {
    constructor(options = {}) {
        this.outputDir = options.outputDir || './downloaded-pages';
        this.delay = options.delay || 1000;
        this.userAgent = options.userAgent || 'Mozilla/5.0 (compatible; OrchidScraper/1.0)';
    }

    async downloadUrls(urls) {
        console.log(`📋 Downloading ${urls.length} specific URLs`);
        await fs.ensureDir(this.outputDir);
        
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            console.log(`📄 Downloading (${i + 1}/${urls.length}): ${url}`);
            
            try {
                const downloader = new WebsiteDownloader({
                    outputDir: this.outputDir,
                    userAgent: this.userAgent
                });
                
                const { html, fileName } = await downloader.downloadPage(url);
                const filePath = path.join(this.outputDir, fileName);
                await fs.writeFile(filePath, html);
                
                console.log(`   ✅ Saved as: ${fileName}`);
                
                // Be respectful
                if (i < urls.length - 1) {
                    await this.sleep(this.delay);
                }
                
            } catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
            }
        }
        
        console.log(`✅ Finished downloading URLs to ${this.outputDir}`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { WebsiteDownloader, URLListDownloader };