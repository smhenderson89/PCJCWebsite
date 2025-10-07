#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

class PhotographerFixer2022 {
    constructor() {
        this.htmlDir = path.join(__dirname, '..', 'localCopy', 'paccentraljc.org', 'awards', '2022', 'html');
        this.jsonDir = path.join(__dirname, '..', 'savedData', '2022', 'json');
        this.results = {
            updated: [],
            alreadyHad: [],
            notFound: [],
            errors: []
        };
    }

    async run() {
        console.log('🔧 Starting 2022 Photographer Information Fix\n');
        
        console.log('📋 This will:');
        console.log('   1. 📁 Scan all 2022 JSON files');
        console.log('   2. 🔍 Extract photographer from corresponding HTML files');
        console.log('   3. 📝 Update JSON files with photographer information');
        console.log('   4. ✅ Generate fix report\n');

        // Get all JSON files (both regular and display)
        const allFiles = await fs.readdir(this.jsonDir);
        const jsonFiles = allFiles.filter(f => f.endsWith('.json') && f.match(/^20225\d{3}/));

        console.log(`📁 Found ${jsonFiles.length} JSON files to check\n`);
        console.log('🔍 Extracting photographer information...');

        for (let i = 0; i < jsonFiles.length; i++) {
            const jsonFile = jsonFiles[i];
            const awardNumber = jsonFile.replace(/(-display)?\.json$/, '');
            
            console.log(`   📄 Processing ${i + 1}/${jsonFiles.length}: ${jsonFile}`);
            
            try {
                await this.fixPhotographerForFile(jsonFile, awardNumber);
            } catch (error) {
                console.log(`      ❌ Error: ${error.message}`);
                this.results.errors.push({
                    file: jsonFile,
                    error: error.message
                });
            }
        }

        await this.generateReport();
    }

    async fixPhotographerForFile(jsonFile, awardNumber) {
        const jsonPath = path.join(this.jsonDir, jsonFile);
        const htmlPath = path.join(this.htmlDir, `${awardNumber}.html`);

        // Read current JSON data
        const jsonData = await fs.readJSON(jsonPath);

        // Check if photographer already exists
        if (jsonData.photographer && jsonData.photographer.trim() !== '') {
            console.log(`      ✅ Already has photographer: ${jsonData.photographer}`);
            this.results.alreadyHad.push({
                file: jsonFile,
                photographer: jsonData.photographer
            });
            return;
        }

        // Check if HTML file exists
        if (!await fs.pathExists(htmlPath)) {
            console.log(`      ⚠️  HTML file not found: ${awardNumber}.html`);
            this.results.notFound.push({
                file: jsonFile,
                reason: 'HTML file not found'
            });
            return;
        }

        // Extract photographer from HTML
        const photographer = await this.extractPhotographerFromHTML(htmlPath);

        if (photographer) {
            // Update JSON file
            jsonData.photographer = photographer;
            await fs.writeJSON(jsonPath, jsonData, { spaces: 2 });
            
            console.log(`      ✅ Updated photographer: ${photographer}`);
            this.results.updated.push({
                file: jsonFile,
                photographer: photographer
            });
        } else {
            console.log(`      ⚠️  Photographer not found in HTML`);
            this.results.notFound.push({
                file: jsonFile,
                reason: 'Photographer not found in HTML'
            });
        }
    }

    async extractPhotographerFromHTML(htmlPath) {
        const content = await fs.readFile(htmlPath, 'utf8');
        const $ = cheerio.load(content);

        // Method 1: Look for the exact pattern you showed
        // <BR CLEAR="ALL">Photographer: Ken Jacobsen
        const mainContent = $('body').html();
        
        // Pattern 1: Direct BR tag with photographer
        const brPattern = /<br[^>]*>\s*photographer:\s*([^<\n]+)/i;
        const brMatch = mainContent.match(brPattern);
        if (brMatch) {
            return brMatch[1].trim();
        }

        // Method 2: Look in text content for photographer line
        const bodyText = $('body').text();
        const lines = bodyText.split('\n').map(line => line.trim());
        
        for (const line of lines) {
            const photographerMatch = line.match(/photographer:\s*(.+)$/i);
            if (photographerMatch) {
                return photographerMatch[1].trim();
            }
        }

        // Method 3: More specific HTML traversal
        const mainFont = $('table').first().find('font[size="+1"]').first();
        if (mainFont.length > 0) {
            const htmlContent = mainFont.html();
            const htmlLines = htmlContent.split(/<br[^>]*>/i);
            
            for (const htmlLine of htmlLines) {
                const cleanLine = cheerio.load(htmlLine).text().trim();
                const photographerMatch = cleanLine.match(/photographer:\s*(.+)$/i);
                if (photographerMatch) {
                    return photographerMatch[1].trim();
                }
            }
        }

        // Method 4: Search all text nodes
        $('*').each((i, elem) => {
            const text = $(elem).text();
            if (text.toLowerCase().includes('photographer:')) {
                const photographerMatch = text.match(/photographer:\s*([^\n\r]+)/i);
                if (photographerMatch) {
                    return photographerMatch[1].trim();
                }
            }
        });

        return null;
    }

    async generateReport() {
        console.log('\n✅ Generating photographer fix report...');

        console.log('\n📋 Photographer Fix Summary:');
        console.log(`   ✅ Updated files: ${this.results.updated.length}`);
        console.log(`   ✨ Already had photographer: ${this.results.alreadyHad.length}`);
        console.log(`   ⚠️  Not found: ${this.results.notFound.length}`);
        console.log(`   ❌ Errors: ${this.results.errors.length}`);

        if (this.results.updated.length > 0) {
            console.log('\n📝 Updated Files:');
            this.results.updated.forEach(item => {
                console.log(`   ✅ ${item.file}: ${item.photographer}`);
            });
        }

        if (this.results.notFound.length > 0) {
            console.log('\n⚠️  Files where photographer was not found:');
            this.results.notFound.forEach(item => {
                console.log(`   ⚠️  ${item.file}: ${item.reason}`);
            });
        }

        if (this.results.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.results.errors.forEach(item => {
                console.log(`   ❌ ${item.file}: ${item.error}`);
            });
        }

        // Save report
        const reportPath = path.join(path.dirname(this.jsonDir), '2022-photographer-fix-report.json');
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: this.results.updated.length + this.results.alreadyHad.length + this.results.notFound.length + this.results.errors.length,
                updated: this.results.updated.length,
                alreadyHad: this.results.alreadyHad.length,
                notFound: this.results.notFound.length,
                errors: this.results.errors.length
            },
            results: this.results
        };

        await fs.writeJSON(reportPath, reportData, { spaces: 2 });
        console.log(`\n📊 Report saved to: ${reportPath}`);

        const totalFixed = this.results.updated.length + this.results.alreadyHad.length;
        const totalFiles = this.results.updated.length + this.results.alreadyHad.length + this.results.notFound.length + this.results.errors.length;
        
        console.log('\n✅ 2022 Photographer fix complete!');
        console.log(`📸 Photographer completion rate: ${totalFixed}/${totalFiles} (${Math.round(totalFixed/totalFiles*100)}%)`);
    }
}

// Run the photographer fixer
const fixer = new PhotographerFixer2022();
fixer.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});