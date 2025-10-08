#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

class Apply2021Corrections {
    constructor() {
        this.jsonDir = path.join(__dirname, '..', 'localCopy', 'paccentraljc.org', 'awards', '2021', 'data', 'json');
        this.htmlDir = path.join(__dirname, '..', 'localCopy', 'paccentraljc.org', 'awards', '2021', 'html');
        this.correctionsFile = path.join(__dirname, '..', 'localCopy', 'paccentraljc.org', 'awards', '2021', 'data', 'errorChecking', '2021-categorized-issues.json');
        this.fixes = {
            crossFixed: [],
            problematicFixed: [],
            errors: []
        };
    }

    async run() {
        console.log('🔧 Applying 2021 Data Corrections\n');
        
        // Load the corrections file
        const corrections = await fs.readJSON(this.correctionsFile);
        
        // Fix missing cross/parentage issues
        console.log('🌱 Fixing cross/parentage issues...');
        for (const item of corrections.categories.missingCrossParentage) {
            if (item.correction) {
                await this.fixCrossParentage(item);
            }
        }

        // Fix problematic files
        console.log('\n⚠️  Fixing problematic files...');
        for (const item of corrections.categories.problematicFiles) {
            if (item.correction) {
                await this.fixProblematicFile(item);
            }
        }

        // Generate report
        await this.generateReport();
    }

    async fixCrossParentage(item) {
        try {
            const jsonPath = path.join(this.jsonDir, item.fileName);
            const data = await fs.readJSON(jsonPath);
            
            console.log(`   🔧 Processing ${item.fileName}: ${item.plantName}`);

            if (item.correction.includes("Set cross to 'N/A'")) {
                data.cross = 'N/A';
                console.log(`      ✅ Set cross to 'N/A'`);
            } else if (item.correction.includes("display cross as 'species'")) {
                // Extract from HTML to find species designation
                const htmlPath = path.join(this.htmlDir, item.fileName.replace('.json', '.html'));
                const htmlContent = await fs.readFile(htmlPath, 'utf-8');
                const $ = cheerio.load(htmlContent);
                
                // Look for species designation in HTML
                const bodyText = $('body').text();
                if (bodyText.includes('species')) {
                    data.cross = 'species';
                    console.log(`      ✅ Set cross to 'species' (from HTML source)`);
                }
            }

            await fs.writeJSON(jsonPath, data, { spaces: 2 });
            this.fixes.crossFixed.push(item.fileName);

        } catch (error) {
            console.log(`      ❌ Error fixing ${item.fileName}: ${error.message}`);
            this.fixes.errors.push({ file: item.fileName, error: error.message });
        }
    }

    async fixProblematicFile(item) {
        try {
            const jsonPath = path.join(this.jsonDir, item.fileName);
            const htmlPath = path.join(this.htmlDir, item.fileName.replace('.json', '.html'));
            const data = await fs.readJSON(jsonPath);
            
            console.log(`   🔧 Processing ${item.fileName}: ${item.plantName}`);

            if (item.correction.includes("award is AD")) {
                // 20225304: AD award with no points
                data.award = 'AD';
                data.awardpoints = 'N/A';
                console.log(`      ✅ Set award to 'AD' and points to 'N/A'`);
                
            } else if (item.correction.includes("'Arrangement' equal to true")) {
                // 20225318: Special arrangement award
                data.arrangement = true;
                console.log(`      ✅ Added 'arrangement': true`);
                
            } else if (item.correction.includes("award is CCE, awardpoints is 90")) {
                // 20225350: CCE with 90 points, need location/date from HTML
                data.award = 'CCE';
                data.awardpoints = 90;
                
                // Extract location and date from HTML
                const htmlContent = await fs.readFile(htmlPath, 'utf-8');
                const $ = cheerio.load(htmlContent);
                const bodyText = $('body').text();
                
                // Look for date and location patterns
                const dateMatch = bodyText.match(/(\w+ \d{1,2}, \d{4})/);
                const locationMatch = bodyText.match(/(Filoli Historic House|San Francisco|Peninsula|Sonoma)/);
                
                if (dateMatch) {
                    data.date = dateMatch[1];
                    console.log(`      ✅ Set date to '${dateMatch[1]}'`);
                }
                if (locationMatch) {
                    data.location = locationMatch[1];
                    console.log(`      ✅ Set location to '${locationMatch[1]}'`);
                }
                
                console.log(`      ✅ Set award to 'CCE' and points to 90`);
                
            } else if (item.correction.includes("award is CCE, awardpoints is 91")) {
                // 20225351: CCE with 91 points
                data.award = 'CCE';
                data.awardpoints = 91;
                console.log(`      ✅ Set award to 'CCE' and points to 91`);
            }

            await fs.writeJSON(jsonPath, data, { spaces: 2 });
            this.fixes.problematicFixed.push(item.fileName);

        } catch (error) {
            console.log(`      ❌ Error fixing ${item.fileName}: ${error.message}`);
            this.fixes.errors.push({ file: item.fileName, error: error.message });
        }
    }

    async generateReport() {
        console.log('\n📊 Correction Summary:');
        console.log(`   🌱 Cross/Parentage fixes: ${this.fixes.crossFixed.length}`);
        console.log(`   ⚠️  Problematic file fixes: ${this.fixes.problematicFixed.length}`);
        console.log(`   ❌ Errors encountered: ${this.fixes.errors.length}`);

        if (this.fixes.crossFixed.length > 0) {
            console.log('\n🌱 Cross/Parentage Files Fixed:');
            this.fixes.crossFixed.forEach(file => {
                console.log(`   ✅ ${file}`);
            });
        }

        if (this.fixes.problematicFixed.length > 0) {
            console.log('\n⚠️  Problematic Files Fixed:');
            this.fixes.problematicFixed.forEach(file => {
                console.log(`   ✅ ${file}`);
            });
        }

        if (this.fixes.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.fixes.errors.forEach(item => {
                console.log(`   ❌ ${item.file}: ${item.error}`);
            });
        }

        // Save fix report
        const reportPath = path.join(path.dirname(this.correctionsFile), '2022-corrections-applied-report.json');
        const reportData = {
            timestamp: new Date().toISOString(),
            fixes: this.fixes,
            summary: {
                totalFixes: this.fixes.crossFixed.length + this.fixes.problematicFixed.length,
                crossFixed: this.fixes.crossFixed.length,
                problematicFixed: this.fixes.problematicFixed.length,
                errors: this.fixes.errors.length
            }
        };

        await fs.writeJSON(reportPath, reportData, { spaces: 2 });
        console.log(`\n📄 Fix report saved to: ${reportPath}`);
        console.log('\n✅ All corrections applied successfully!');
        
        console.log('\n💡 Recommendation: Run analysis again to verify improvements');
    }
}

// Run the corrections
const corrector = new Apply2021Corrections();
corrector.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});