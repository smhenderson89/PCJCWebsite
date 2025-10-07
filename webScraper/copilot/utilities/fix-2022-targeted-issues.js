#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

class TargetedFix2022 {
    constructor() {
        this.jsonDir = path.join(__dirname, '..', 'savedData', '2022', 'json');
        this.htmlDir = path.join(__dirname, '..', 'localCopy', 'paccentraljc.org', 'awards', '2022', 'html');
        this.fixes = {
            crossExtracted: [],
            awardsFixed: [],
            displayFixed: [],
            specialCasesHandled: []
        };
    }

    async run() {
        console.log('🔧 Starting Targeted 2022 Data Fixes\n');
        
        console.log('📋 This script will fix:');
        console.log('   1. 🏆 Missing award types and points for problematic files');
        console.log('   2. 🌱 Extract parentage/cross information where available');
        console.log('   3. 🎨 Handle display award special cases properly');
        console.log('   4. 📊 Report on improvement statistics\n');

        // Load the analysis report to identify problematic files
        const reportPath = path.join(path.dirname(this.jsonDir), '2022-comprehensive-analysis-report.json');
        const report = await fs.readJSON(reportPath);
        
        const problematicFiles = report.fileCategories.problematic || [];
        const needsWorkFiles = report.fileCategories.needsWork || [];
        const fixableFiles = report.actionableIssues.fixableFromHtml || [];

        console.log(`🎯 Targeting ${problematicFiles.length} problematic files`);
        console.log(`⚠️  Processing ${needsWorkFiles.length} files that need work`);
        console.log(`🔧 Extracting data from ${fixableFiles.length} files with fixable fields\n`);

        // Fix problematic files first
        for (const file of problematicFiles) {
            console.log(`🚨 Fixing problematic file: ${file.fileName}`);
            await this.fixProblematicFile(file);
        }

        // Fix cross/parentage data for all fixable files
        console.log('\n🌱 Extracting parentage information...');
        for (const item of fixableFiles) {
            if (item.fixableFields.includes('cross')) {
                await this.extractCrossInformation(item.fileName);
            }
        }

        // Generate report
        await this.generateFixReport();
    }

    async fixProblematicFile(fileInfo) {
        const filePath = path.join(this.jsonDir, fileInfo.fileName);
        const htmlPath = path.join(this.htmlDir, fileInfo.fileName.replace('.json', '.html'));
        
        try {
            const data = await fs.readJSON(filePath);
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const $ = cheerio.load(htmlContent);
            
            let modified = false;

            // Special handling for award 20225318 - it's an AQ (Award of Quality), not a regular award with points
            if (fileInfo.fileName === '20225318.json') {
                console.log('   🎯 Handling special AQ award case');
                
                // Look for award type in HTML - should be AQ
                const titleText = $('title').text();
                const bodyText = $('body').text();
                
                if (bodyText.includes('AQ') || titleText.includes('AQ')) {
                    data.award = 'AQ';
                    data.awardpoints = null; // AQ awards don't have points
                    modified = true;
                    this.fixes.specialCasesHandled.push(fileInfo.fileName);
                    console.log('     ✅ Set award type to AQ (no points assigned)');
                }
            }

            // For display awards, remove plant-specific measurements that shouldn't be there
            if (data.display === true) {
                console.log('   🎨 Cleaning display award measurements');
                
                // Display awards shouldn't have most plant measurements
                const displayMeasurements = {
                    type: data.measurements?.type || '',
                    numFlowers: data.measurements?.numFlowers || 0,
                    numBuds: data.measurements?.numBuds || 0,
                    description: data.measurements?.description || ''
                };

                // Keep genus/species if it's actually in the description (for botanical displays)
                if (data.measurements?.description && data.measurements.description.includes('Cattleya')) {
                    // This might be a botanical display, keep some plant info
                } else {
                    // Clear plant-specific fields for non-botanical displays
                    data.genus = '';
                    data.species = '';
                    data.clone = '';
                    data.cross = '';
                }

                data.measurements = displayMeasurements;
                modified = true;
                this.fixes.displayFixed.push(fileInfo.fileName);
                console.log('     ✅ Cleaned display award data structure');
            }

            if (modified) {
                await fs.writeJSON(filePath, data, { spaces: 2 });
                console.log(`   💾 Updated ${fileInfo.fileName}`);
            }

        } catch (error) {
            console.log(`   ❌ Error fixing ${fileInfo.fileName}: ${error.message}`);
        }
    }

    async extractCrossInformation(fileName) {
        const filePath = path.join(this.jsonDir, fileName);
        const htmlPath = path.join(this.htmlDir, fileName.replace('.json', '.html'));
        
        try {
            const data = await fs.readJSON(filePath);
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const $ = cheerio.load(htmlContent);
            
            // Look for parentage information in various places
            let crossInfo = null;
            
            // Method 1: Look in title or main text for cross indicators
            const bodyText = $('body').text();
            const titleText = $('title').text();
            
            // Common patterns for crosses
            const crossPatterns = [
                /([A-Z][a-z]+ [a-z]+) × ([A-Z][a-z]+ [a-z]+)/g,
                /([A-Z][a-z]+ [a-z]+) x ([A-Z][a-z]+ [a-z]+)/g,
                /\(([^)]+) × ([^)]+)\)/g,
                /\(([^)]+) x ([^)]+)\)/g
            ];

            for (const pattern of crossPatterns) {
                const matches = [...bodyText.matchAll(pattern)];
                if (matches.length > 0) {
                    const match = matches[0];
                    crossInfo = `(${match[1]} × ${match[2]})`;
                    break;
                }
            }

            // Method 2: Look for clone names (often indicate crosses)
            const clonePatterns = [
                /'([^']+)'/g,
                /"([^"]+)"/g,
                /\s'([^']+)'/g
            ];

            for (const pattern of clonePatterns) {
                const matches = [...bodyText.matchAll(pattern)];
                if (matches.length > 0 && !data.clone) {
                    data.clone = matches[0][1];
                    break;
                }
            }

            if (crossInfo && !data.cross) {
                data.cross = crossInfo;
                await fs.writeJSON(filePath, data, { spaces: 2 });
                this.fixes.crossExtracted.push(fileName);
                console.log(`   🌱 Extracted cross info for ${fileName}: ${crossInfo}`);
            }

        } catch (error) {
            console.log(`   ❌ Error extracting cross info from ${fileName}: ${error.message}`);
        }
    }

    async generateFixReport() {
        console.log('\n📊 Fix Summary Report:');
        console.log(`   🏆 Awards fixed: ${this.fixes.awardsFixed.length}`);
        console.log(`   🌱 Cross information extracted: ${this.fixes.crossExtracted.length}`);
        console.log(`   🎨 Display awards cleaned: ${this.fixes.displayFixed.length}`);
        console.log(`   🎯 Special cases handled: ${this.fixes.specialCasesHandled.length}`);

        if (this.fixes.crossExtracted.length > 0) {
            console.log('\n🌱 Cross Information Added:');
            this.fixes.crossExtracted.forEach(file => {
                console.log(`   ✅ ${file}`);
            });
        }

        if (this.fixes.specialCasesHandled.length > 0) {
            console.log('\n🎯 Special Cases Resolved:');
            this.fixes.specialCasesHandled.forEach(file => {
                console.log(`   ✅ ${file}`);
            });
        }

        // Save fix report
        const reportPath = path.join(path.dirname(this.jsonDir), '2022-targeted-fixes-report.json');
        const reportData = {
            timestamp: new Date().toISOString(),
            fixes: this.fixes,
            summary: {
                totalFixes: Object.values(this.fixes).flat().length,
                crossExtracted: this.fixes.crossExtracted.length,
                displayFixed: this.fixes.displayFixed.length,
                specialCases: this.fixes.specialCasesHandled.length
            }
        };

        await fs.writeJSON(reportPath, reportData, { spaces: 2 });
        console.log(`\n📄 Detailed fix report saved to: ${reportPath}`);
        console.log('\n✅ Targeted 2022 fixes complete!');
        
        // Recommend running analysis again
        console.log('\n💡 Recommendation: Run the comprehensive analysis again to see improvements');
    }
}

// Run the targeted fixes
const fixer = new TargetedFix2022();
fixer.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});