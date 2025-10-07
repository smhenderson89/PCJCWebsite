const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

class Awards2023Scraper {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.year = '2023';
        this.awardsDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year);
        this.htmlDir = path.join(this.awardsDir, 'html');
        this.imagesDir = path.join(this.awardsDir, 'images');
        this.jsonDir = path.join(this.baseDir, 'savedData', this.year, 'json');
        
        // Create directories
        fs.ensureDirSync(this.htmlDir);
        fs.ensureDirSync(this.imagesDir);
        fs.ensureDirSync(this.jsonDir);
        
        this.baseUrl = 'https://www.paccentraljc.org';
        this.indexUrl = `${this.baseUrl}/2023.html`;
        this.delay = 1000; // 1 second delay between requests
    }

    async scrapeAll2023Awards() {
        console.log('🚀 Starting 2023 Award Scraping Process\n');
        console.log('📋 This will:');
        console.log('   • Download the 2023 index page');
        console.log('   • Extract all award links');
        console.log('   • Download individual award HTML pages');
        console.log('   • Download corresponding images');
        console.log('   • Verify data completeness\n');

        try {
            // Step 1: Download and parse index page
            console.log('📥 Step 1: Downloading 2023 index page...');
            const indexHtml = await this.downloadIndexPage();
            
            // Step 2: Extract award links
            console.log('🔍 Step 2: Extracting award links...');
            const awardLinks = await this.extractAwardLinks(indexHtml);
            console.log(`   Found ${awardLinks.length} award links`);
            
            // Step 3: Download award pages
            console.log('📄 Step 3: Downloading award HTML pages...');
            const htmlResults = await this.downloadAwardPages(awardLinks);
            
            // Step 4: Download images
            console.log('🖼️ Step 4: Downloading award images...');
            const imageResults = await this.downloadAwardImages(awardLinks);
            
            // Step 5: Verify completeness
            console.log('✅ Step 5: Verifying completeness...');
            const verification = await this.verifyCompleteness();
            
            // Final summary
            this.printFinalSummary(htmlResults, imageResults, verification);
            
            return {
                htmlResults,
                imageResults,
                verification,
                totalAwards: awardLinks.length
            };
            
        } catch (error) {
            console.error('❌ Error in 2023 scraping process:', error);
            throw error;
        }
    }

    async downloadIndexPage() {
        const indexPath = path.join(this.awardsDir, 'index.html');
        
        try {
            const response = await fetch(this.indexUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            await fs.writeFile(indexPath, html, 'utf8');
            
            console.log('   ✅ Index page downloaded successfully');
            return html;
            
        } catch (error) {
            console.error(`   ❌ Failed to download index page: ${error.message}`);
            throw error;
        }
    }

    async extractAwardLinks(html) {
        const $ = cheerio.load(html);
        const links = [];
        
        // 2023 has a specific structure: date folders with award files
        // Pattern: 20230120/20235250.html
        $('a[href]').each((index, element) => {
            const href = $(element).attr('href');
            if (href) {
                // Look for pattern: YYYYMMDD/20235XXX.html
                const match = href.match(/(\d{8})\/(\d{8})\.html/);
                if (match) {
                    const dateFolder = match[1];
                    const awardNumber = match[2];
                    
                    // Only include actual award numbers (20235XXX)
                    if (awardNumber.match(/^20235\d{3}$/)) {
                        links.push({
                            awardNumber: awardNumber,
                            dateFolder: dateFolder,
                            relativePath: href,
                            url: href.startsWith('http') ? href : `${this.baseUrl}/${href}`
                        });
                    }
                }
            }
        });

        // Remove duplicates based on award number
        const uniqueLinks = [];
        const seen = new Set();
        
        for (const link of links) {
            if (!seen.has(link.awardNumber)) {
                seen.add(link.awardNumber);
                uniqueLinks.push(link);
            }
        }

        return uniqueLinks.sort((a, b) => a.awardNumber.localeCompare(b.awardNumber));
    }

    async downloadAwardPages(awardLinks) {
        console.log(`   📄 Downloading ${awardLinks.length} award pages...`);
        
        const results = {
            successful: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < awardLinks.length; i++) {
            const award = awardLinks[i];
            
            try {
                console.log(`   📄 ${i + 1}/${awardLinks.length}: ${award.awardNumber} (from ${award.dateFolder})`);
                
                const response = await fetch(award.url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const html = await response.text();
                // Save with just the award number, not the full path
                const htmlPath = path.join(this.htmlDir, `${award.awardNumber}.html`);
                await fs.writeFile(htmlPath, html, 'utf8');
                
                results.successful++;
                
                // Respectful delay
                await this.sleep(this.delay);
                
            } catch (error) {
                results.failed++;
                const errorMsg = `${award.awardNumber}: ${error.message}`;
                results.errors.push(errorMsg);
                console.log(`      ❌ Failed: ${errorMsg}`);
                
                // Still delay on errors to be respectful
                await this.sleep(this.delay);
            }
        }

        console.log(`   📊 HTML Results: ${results.successful} successful, ${results.failed} failed`);
        return results;
    }

    async downloadAwardImages(awardLinks) {
        console.log(`   🖼️ Downloading ${awardLinks.length} award images...`);
        
        const results = {
            successful: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < awardLinks.length; i++) {
            const award = awardLinks[i];
            
            try {
                console.log(`   🖼️ ${i + 1}/${awardLinks.length}: ${award.awardNumber}.jpg`);
                
                // 2023 images are in date folders - try multiple patterns
                const imageUrls = [
                    `${this.baseUrl}/${award.dateFolder}/${award.awardNumber}.jpg`, // Most likely pattern
                    `${this.baseUrl}/awards/2023/${award.dateFolder}/${award.awardNumber}.jpg`,
                    `${this.baseUrl}/2023/${award.dateFolder}/${award.awardNumber}.jpg`,
                    `${this.baseUrl}/awards/${this.year}/${award.awardNumber}.jpg`, // Fallback
                    `${this.baseUrl}/${award.awardNumber}.jpg` // Simple fallback
                ];
                
                let imageDownloaded = false;
                
                for (const imageUrl of imageUrls) {
                    try {
                        const response = await fetch(imageUrl);
                        if (response.ok) {
                            const imageBuffer = await response.arrayBuffer();
                            const imagePath = path.join(this.imagesDir, `${award.awardNumber}.jpg`);
                            await fs.writeFile(imagePath, Buffer.from(imageBuffer));
                            
                            results.successful++;
                            imageDownloaded = true;
                            break;
                        }
                    } catch (imageError) {
                        // Try next URL pattern
                        continue;
                    }
                }
                
                if (!imageDownloaded) {
                    throw new Error('No image found at any URL pattern');
                }
                
                // Respectful delay
                await this.sleep(this.delay);
                
            } catch (error) {
                results.failed++;
                const errorMsg = `${award.awardNumber}: ${error.message}`;
                results.errors.push(errorMsg);
                console.log(`      ❌ Failed: ${errorMsg}`);
                
                // Still delay on errors
                await this.sleep(this.delay);
            }
        }

        console.log(`   📊 Image Results: ${results.successful} successful, ${results.failed} failed`);
        return results;
    }

    async verifyCompleteness() {
        console.log('   🔍 Verifying data completeness...');
        
        const htmlFiles = await this.getHtmlFiles();
        const imageFiles = await this.getImageFiles();
        
        const verification = {
            htmlCount: htmlFiles.length,
            imageCount: imageFiles.length,
            missingImages: [],
            coverage: 0
        };
        
        // Check which HTML files have corresponding images
        for (const awardNum of htmlFiles) {
            const hasImage = imageFiles.includes(`${awardNum}.jpg`);
            if (!hasImage) {
                verification.missingImages.push(awardNum);
            }
        }
        
        verification.coverage = htmlFiles.length > 0 ? 
            ((htmlFiles.length - verification.missingImages.length) / htmlFiles.length * 100).toFixed(1) : 0;
        
        console.log(`   📄 HTML files: ${verification.htmlCount}`);
        console.log(`   🖼️ Images: ${verification.imageCount}`);
        console.log(`   📊 Image coverage: ${verification.coverage}%`);
        
        if (verification.missingImages.length > 0) {
            console.log(`   ⚠️  Missing images: ${verification.missingImages.length}`);
        }
        
        return verification;
    }

    async getHtmlFiles() {
        try {
            const files = await fs.readdir(this.htmlDir);
            return files
                .filter(f => f.endsWith('.html'))
                .filter(f => f.match(/^20235\d{3}\.html$/))
                .map(f => f.replace('.html', ''))
                .sort();
        } catch (error) {
            return [];
        }
    }

    async getImageFiles() {
        try {
            const files = await fs.readdir(this.imagesDir);
            return files
                .filter(f => f.endsWith('.jpg'))
                .sort();
        } catch (error) {
            return [];
        }
    }

    printFinalSummary(htmlResults, imageResults, verification) {
        console.log('\n🎉 2023 AWARD SCRAPING COMPLETE!');
        console.log('=================================');
        console.log(`📄 HTML Pages: ${htmlResults.successful}/${htmlResults.successful + htmlResults.failed} downloaded`);
        console.log(`🖼️ Images: ${imageResults.successful}/${imageResults.successful + imageResults.failed} downloaded`);
        console.log(`📊 Image Coverage: ${verification.coverage}%`);
        console.log(`📁 Files saved to: localCopy/paccentraljc.org/awards/${this.year}/`);
        
        if (verification.missingImages.length > 0) {
            console.log(`\n⚠️  Awards missing images: ${verification.missingImages.length}`);
            if (verification.missingImages.length <= 10) {
                console.log(`   ${verification.missingImages.join(', ')}`);
            } else {
                console.log(`   ${verification.missingImages.slice(0, 10).join(', ')}... and ${verification.missingImages.length - 10} more`);
            }
        }
        
        if (htmlResults.errors.length > 0) {
            console.log(`\n❌ HTML Errors: ${htmlResults.errors.length}`);
        }
        
        if (imageResults.errors.length > 0) {
            console.log(`❌ Image Errors: ${imageResults.errors.length}`);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function scrape2023Awards() {
    console.log('🚀 Starting 2023 Award Scraping Process\n');
    
    try {
        const scraper = new Awards2023Scraper();
        const results = await scraper.scrapeAll2023Awards();
        
        console.log('\n✨ 2023 scraping process completed!');
        return results;
        
    } catch (error) {
        console.error('❌ Error in 2023 scraping:', error);
    }
}

if (require.main === module) {
    scrape2023Awards().catch(console.error);
}

module.exports = { scrape2023Awards };