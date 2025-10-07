#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const https = require('https');

class Download2021Images {
    constructor() {
        this.baseDir = path.join(__dirname, '..', '..');
        this.htmlDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', '2021', 'html');
        this.imageDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', '2021', 'images');
        
        // Ensure image directory exists
        fs.ensureDirSync(this.imageDir);
        
        this.config = {
            delayBetweenRequests: 1000,
            timeout: 15000,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        };
        
        this.results = {
            images: [],
            thumbnails: [],
            errors: []
        };
        
        // Map award numbers to their date folders based on the original structure
        this.awardToDateMap = {
            '20215301': '20210417', '20215302': '20210417', '20215303': '20210417', '20215304': '20210417',
            '20215305': '20210417', '20215306': '20210417', '20215307': '20210417', '20215308': '20210417',
            '20215309': '20210417', '20215310': '20210417', '20215311': '20210417', '20215312': '20210417',
            '20215313': '20210417',
            '20215314': '20210515', '20215315': '20210515', '20215316': '20210515', '20215317': '20210515',
            '20215318': '20210515', '20215319': '20210515',
            '20215320': '20210619', '20215321': '20210619', '20215322': '20210619',
            '20215323': '20210717', '20215324': '20210717', '20215325': '20210717', '20215326': '20210717',
            '20215327': '20210717', '20215328': '20210717',
            '20215329': '20210808', '20215330': '20210808', '20215331': '20210808',
            '20215332': '20210821', '20215333': '20210821',
            '20215250': '20210907', '20215251': '20210907',
            '20215334': '20210918', '20215335': '20210918', '20215336': '20210918',
            '20215253': '20211005', '20215254': '20211005',
            '20215337': '20211016', '20215338': '20211016',
            '20215255': '20211102', '20215256': '20211102', '20215257': '20211102',
            '20215339': '20211120', '20215340': '20211120',
            '20215258': '20211207',
            '20215341': '20211218', '20215342': '20211218'
        };
    }

    async downloadImages() {
        console.log('🖼️  Starting 2021 Image Download\n');
        
        const awardNumbers = Object.keys(this.awardToDateMap);
        console.log(`📋 Attempting to download images for ${awardNumbers.length} awards...\n`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < awardNumbers.length; i++) {
            const awardNum = awardNumbers[i];
            const dateFolder = this.awardToDateMap[awardNum];
            
            console.log(`🖼️  Processing ${i + 1}/${awardNumbers.length}: ${awardNum}`);
            
            // Download full-size image
            const fullImageUrl = `https://www.paccentraljc.org/${dateFolder}/${awardNum}.jpg`;
            const fullImagePath = path.join(this.imageDir, `${awardNum}.jpg`);
            
            try {
                console.log(`   📥 Downloading full-size: ${fullImageUrl}`);
                const imageData = await this.downloadBinaryFile(fullImageUrl);
                await fs.writeFile(fullImagePath, imageData);
                this.results.images.push(`${awardNum}.jpg`);
                console.log(`      ✅ Saved: ${awardNum}.jpg`);
                successCount++;
            } catch (error) {
                console.log(`      ❌ Failed full-size: ${error.message}`);
                this.results.errors.push({ file: `${awardNum}.jpg`, error: error.message });
                errorCount++;
            }
            
            // Download thumbnail
            const thumbUrl = `https://www.paccentraljc.org/${dateFolder}/${awardNum}thumb.jpg`;
            const thumbPath = path.join(this.imageDir, `${awardNum}thumb.jpg`);
            
            try {
                console.log(`   📥 Downloading thumbnail: ${thumbUrl}`);
                const thumbData = await this.downloadBinaryFile(thumbUrl);
                await fs.writeFile(thumbPath, thumbData);
                this.results.thumbnails.push(`${awardNum}thumb.jpg`);
                console.log(`      ✅ Saved: ${awardNum}thumb.jpg`);
                successCount++;
            } catch (error) {
                console.log(`      ❌ Failed thumbnail: ${error.message}`);
                this.results.errors.push({ file: `${awardNum}thumb.jpg`, error: error.message });
                errorCount++;
            }
            
            // Rate limiting
            if (i < awardNumbers.length - 1) {
                await this.delay(this.config.delayBetweenRequests);
            }
        }
        
        console.log('\n📊 Image Download Summary:');
        console.log(`   🖼️  Full-size images: ${this.results.images.length}`);
        console.log(`   🖼️  Thumbnails: ${this.results.thumbnails.length}`);
        console.log(`   ✅ Total successful: ${successCount}`);
        console.log(`   ❌ Total errors: ${errorCount}`);
        
        // Save report
        const reportPath = path.join(path.dirname(this.imageDir), 'data', 'image-download-report.json');
        fs.ensureDirSync(path.dirname(reportPath));
        const report = {
            timestamp: new Date().toISOString(),
            year: '2021',
            summary: {
                fullSizeImages: this.results.images.length,
                thumbnails: this.results.thumbnails.length,
                totalSuccess: successCount,
                totalErrors: errorCount
            },
            details: this.results
        };
        await fs.writeJSON(reportPath, report, { spaces: 2 });
        
        console.log(`\n📄 Report saved to: ${reportPath}`);
        console.log(`📁 Images saved to: ${this.imageDir}`);
        console.log('\n✅ 2021 Image download complete!');
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
}

// Run the image download
const downloader = new Download2021Images();
downloader.downloadImages().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});