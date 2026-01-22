#!/usr/bin/env node

/**
 * PCJC Awards Data Repair Toolkit
 * Consolidated utility functions for fixing and repairing award data across all years
 * Usage: Can be imported as module or run directly with year parameter
 */

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

class PCJCDataRepairToolkit {
    constructor(year) {
        this.year = year;
        this.baseDir = path.join(__dirname, '..', 'localCopy', 'paccentraljc.org', 'awards', year);
        this.jsonDir = path.join(this.baseDir, 'data', 'json');
        this.htmlDir = path.join(this.baseDir, 'html');
        this.dataDir = path.join(this.baseDir, 'data');
        this.backupDir = path.join(this.dataDir, 'backups');
    }

    /**
     * Create backup of JSON files before making changes
     */
    async createBackup(operation = 'repair') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `${operation}-${timestamp}`);
        
        await fs.ensureDir(backupPath);
        await fs.copy(this.jsonDir, path.join(backupPath, 'json'));
        
        console.log(`💾 Backup created: ${backupPath}`);
        return backupPath;
    }

    /**
     * Fix recoverable issues by re-extracting data from HTML
     */
    async fixRecoverableIssues() {
        console.log(`🔧 Fixing recoverable issues for ${this.year}...`);
        
        // Create backup first
        await this.createBackup('recoverable-fixes');
        
        const categorizedPath = path.join(this.dataDir, `${this.year}-categorized-issues.json`);
        
        if (!await fs.pathExists(categorizedPath)) {
            throw new Error(`Categorized issues file not found: ${categorizedPath}. Run analysis first.`);
        }

        const categorizedData = await fs.readJSON(categorizedPath);
        const recoverableIssues = categorizedData.categories.recoverable || [];
        
        const fixResults = {
            timestamp: new Date().toISOString(),
            year: this.year,
            totalAttempts: recoverableIssues.length,
            successful: 0,
            failed: 0,
            fixes: [],
            errors: []
        };

        for (const issue of recoverableIssues) {
            try {
                console.log(`   🔍 Fixing ${issue.awardNum}...`);
                
                const fixResult = await this.fixSingleAward(issue.awardNum);
                
                if (fixResult.success) {
                    fixResults.successful++;
                    fixResults.fixes.push({
                        awardNum: issue.awardNum,
                        fieldsFixed: fixResult.fieldsFixed,
                        originalIssues: issue.issues.length,
                        fixedIssues: fixResult.fieldsFixed.length
                    });
                    console.log(`     ✅ Fixed ${fixResult.fieldsFixed.length} field(s)`);
                } else {
                    fixResults.failed++;
                    fixResults.errors.push({
                        awardNum: issue.awardNum,
                        error: fixResult.error
                    });
                    console.log(`     ❌ Failed: ${fixResult.error}`);
                }
            } catch (error) {
                fixResults.failed++;
                fixResults.errors.push({
                    awardNum: issue.awardNum,
                    error: error.message
                });
                console.log(`     ❌ Error: ${error.message}`);
            }
        }

        const reportPath = path.join(this.dataDir, `${this.year}-fix-recoverable-report.json`);
        await fs.writeJSON(reportPath, fixResults, { spaces: 2 });
        
        console.log(`✅ Recoverable fixes complete. ${fixResults.successful}/${fixResults.totalAttempts} successful.`);
        console.log(`📋 Report saved to: ${reportPath}`);
        
        return fixResults;
    }

    /**
     * Fix a single award by re-extracting from HTML
     */
    async fixSingleAward(awardNum) {
        const htmlPath = path.join(this.htmlDir, `${awardNum}.html`);
        const jsonPath = path.join(this.jsonDir, `${awardNum}.json`);
        const displayJsonPath = path.join(this.jsonDir, `${awardNum}-display.json`);
        
        // Determine which JSON file exists
        const actualJsonPath = await fs.pathExists(displayJsonPath) ? displayJsonPath : jsonPath;
        
        if (!await fs.pathExists(htmlPath)) {
            return { success: false, error: 'HTML file not found' };
        }

        if (!await fs.pathExists(actualJsonPath)) {
            return { success: false, error: 'JSON file not found' };
        }

        try {
            const currentData = await fs.readJSON(actualJsonPath);
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const extractedData = await this.extractDataFromHtml(htmlContent, awardNum);
            
            const fieldsFixed = [];
            
            // Compare and update fields that were null/empty in original but found in HTML
            Object.keys(extractedData).forEach(field => {
                if ((!currentData[field] || currentData[field] === '') && extractedData[field] && extractedData[field] !== '') {
                    currentData[field] = extractedData[field];
                    fieldsFixed.push(field);
                }
            });

            // Special handling for measurements
            if (extractedData.measurements && Object.keys(extractedData.measurements).length > 0) {
                if (!currentData.measurements || Object.keys(currentData.measurements).length < 2) {
                    currentData.measurements = extractedData.measurements;
                    fieldsFixed.push('measurements');
                }
            }

            // Save updated data
            await fs.writeJSON(actualJsonPath, currentData, { spaces: 2 });
            
            return {
                success: true,
                fieldsFixed,
                extractedData,
                updatedData: currentData
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Extract data from HTML (simplified version of extraction logic)
     */
    async extractDataFromHtml(htmlContent, awardNum) {
        const $ = cheerio.load(htmlContent);
        
        const extractedData = {
            awardNum: awardNum,
            award: '',
            awardpoints: null,
            location: '',
            date: '',
            genus: '',
            species: '',
            clone: '',
            cross: '',
            exhibitor: '',
            photographer: '',
            measurements: {}
        };

        // Extract from main content area
        const mainFont = $('table').first().find('font[size="+1"]').first();
        
        if (mainFont.length > 0) {
            const htmlText = mainFont.html();
            const lines = htmlText
                .split(/<br[^>]*>/i)
                .map(line => cheerio.load(line).text().trim())
                .filter(line => line && !line.includes('Award '));

            // Process each line
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Date and location (first line)
                if (i === 0 && line.includes(' - ')) {
                    const parts = line.split(' - ');
                    extractedData.date = parts[0].trim();
                    extractedData.location = parts.slice(1).join(' - ').trim();
                    continue;
                }

                // Plant name with clone
                const plantMatch = line.match(/^([A-Z][a-z]+)\s+(.+?)\s+'([^']+)'$/);
                if (plantMatch) {
                    extractedData.genus = plantMatch[1];
                    extractedData.species = plantMatch[2].trim();
                    extractedData.clone = plantMatch[3];
                    continue;
                }

                // Plant name without clone
                const plantMatch2 = line.match(/^([A-Z][a-z]+)\s+([a-z][a-zA-Z\s]+)$/);
                if (plantMatch2 && !line.includes('by:')) {
                    extractedData.genus = plantMatch2[1];
                    extractedData.species = plantMatch2[2].trim();
                    continue;
                }

                // Cross/parentage
                const crossMatch = line.match(/^\((.+)\)$/);
                if (crossMatch) {
                    extractedData.cross = crossMatch[1].trim();
                    continue;
                }

                // Award and points
                const awardMatch = line.match(/^(AM|HCC|CCM|FCC|AQ|CBR|JC|AD|CHM)\s+(\d+)$/i);
                if (awardMatch) {
                    extractedData.award = awardMatch[1].toUpperCase();
                    extractedData.awardpoints = parseInt(awardMatch[2]);
                    continue;
                }

                // Exhibitor
                const exhibitorMatch = line.match(/^Exhibited by:\s*(.+)$/i);
                if (exhibitorMatch) {
                    extractedData.exhibitor = exhibitorMatch[1].trim();
                    continue;
                }

                // Photographer
                const photographerMatch = line.match(/^Photographer:\s*(.+)$/i);
                if (photographerMatch) {
                    extractedData.photographer = photographerMatch[1].trim();
                    continue;
                }
            }
        }

        // Extract measurements
        const measurementTable = $('table').eq(1).find('table').first();
        if (measurementTable.length > 0) {
            measurementTable.find('tr').each((i, row) => {
                const $row = $(row);
                const cells = $row.find('td');
                
                if (cells.length >= 2) {
                    const label = $(cells[0]).text().trim();
                    const value = $(cells[1]).text().trim();
                    const numValue = parseFloat(value);
                    
                    if (!isNaN(numValue) && ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'LIPL'].includes(label)) {
                        extractedData.measurements[label] = numValue;
                    }
                }
            });
        }

        return extractedData;
    }

    /**
     * Clean JSON files (remove invalid/corrupted files)
     */
    async cleanJsonFiles() {
        console.log(`🧹 Cleaning JSON files for ${this.year}...`);
        
        const files = await fs.readdir(this.jsonDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const cleanResults = {
            timestamp: new Date().toISOString(),
            year: this.year,
            totalFiles: jsonFiles.length,
            validFiles: 0,
            invalidFiles: 0,
            removedFiles: [],
            errors: []
        };

        for (const file of jsonFiles) {
            const filePath = path.join(this.jsonDir, file);
            
            try {
                const data = await fs.readJSON(filePath);
                
                // Basic validation
                if (!data.awardNum || typeof data !== 'object') {
                    throw new Error('Invalid structure');
                }
                
                cleanResults.validFiles++;
                console.log(`   ✅ Valid: ${file}`);
            } catch (error) {
                cleanResults.invalidFiles++;
                cleanResults.removedFiles.push(file);
                cleanResults.errors.push({
                    file,
                    error: error.message
                });
                
                // Move to backup instead of deleting
                const backupPath = path.join(this.dataDir, 'invalid');
                await fs.ensureDir(backupPath);
                await fs.move(filePath, path.join(backupPath, file));
                
                console.log(`   ❌ Invalid (moved to backup): ${file} - ${error.message}`);
            }
        }

        const reportPath = path.join(this.dataDir, `${this.year}-clean-files-report.json`);
        await fs.writeJSON(reportPath, cleanResults, { spaces: 2 });
        
        console.log(`✅ File cleaning complete. ${cleanResults.validFiles} valid, ${cleanResults.invalidFiles} invalid.`);
        console.log(`📋 Report saved to: ${reportPath}`);
        
        return cleanResults;
    }

    /**
     * Fix location conflicts and standardize location names
     */
    async fixLocationConflicts() {
        console.log(`📍 Fixing location conflicts for ${this.year}...`);
        
        await this.createBackup('location-fixes');
        
        const files = await fs.readdir(this.jsonDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        // Common location mappings/corrections
        const locationMappings = {
            'Filoli Historic House': 'Filoli Historic House & Garden',
            'Filoli': 'Filoli Historic House & Garden',
            'Filoli Gardens': 'Filoli Historic House & Garden',
            'San Francisco Orchid Society Show': 'San Francisco Orchid Society',
            'SFOS': 'San Francisco Orchid Society',
            'Pacific Orchid Exposition': 'Pacific Orchid & Garden Exposition',
            'POGE': 'Pacific Orchid & Garden Exposition'
        };

        const fixResults = {
            timestamp: new Date().toISOString(),
            year: this.year,
            totalFiles: jsonFiles.length,
            locationChanges: 0,
            changedFiles: [],
            locationStats: {}
        };

        for (const file of jsonFiles) {
            const filePath = path.join(this.jsonDir, file);
            const data = await fs.readJSON(filePath);
            
            if (data.location && locationMappings[data.location]) {
                const oldLocation = data.location;
                data.location = locationMappings[data.location];
                
                await fs.writeJSON(filePath, data, { spaces: 2 });
                
                fixResults.locationChanges++;
                fixResults.changedFiles.push({
                    file,
                    oldLocation,
                    newLocation: data.location
                });
                
                console.log(`   📍 ${file}: "${oldLocation}" → "${data.location}"`);
            }

            // Track location frequency
            if (data.location) {
                if (!fixResults.locationStats[data.location]) {
                    fixResults.locationStats[data.location] = 0;
                }
                fixResults.locationStats[data.location]++;
            }
        }

        const reportPath = path.join(this.dataDir, `${this.year}-location-fixes-report.json`);
        await fs.writeJSON(reportPath, fixResults, { spaces: 2 });
        
        console.log(`✅ Location fixes complete. ${fixResults.locationChanges} changes made.`);
        console.log(`📋 Report saved to: ${reportPath}`);
        
        return fixResults;
    }

    /**
     * Run comprehensive repair (all repair functions)
     */
    async runComprehensiveRepair() {
        console.log(`🚀 Running comprehensive data repair for ${this.year}...`);
        
        const results = {
            timestamp: new Date().toISOString(),
            year: this.year,
            repairs: {}
        };

        try {
            results.repairs.cleanFiles = await this.cleanJsonFiles();
            results.repairs.locationFixes = await this.fixLocationConflicts();
            results.repairs.recoverableIssues = await this.fixRecoverableIssues();

            const summaryPath = path.join(this.dataDir, `${this.year}-comprehensive-repair.json`);
            await fs.writeJSON(summaryPath, results, { spaces: 2 });
            
            console.log(`\n🎉 Comprehensive repair complete for ${this.year}!`);
            console.log(`📋 Summary report saved to: ${summaryPath}`);
            
            return results;
        } catch (error) {
            console.error(`❌ Error during repair: ${error.message}`);
            throw error;
        }
    }
}

// Export for module use
module.exports = PCJCDataRepairToolkit;

// CLI usage
if (require.main === module) {
    const year = process.argv[2];
    
    if (!year) {
        console.log('Usage: node data-repair-toolkit.js <year> [operation]');
        console.log('Operations: clean, locations, recoverable, all (default)');
        console.log('Example: node data-repair-toolkit.js 2022 clean');
        process.exit(1);
    }
    
    const toolkit = new PCJCDataRepairToolkit(year);
    const operation = process.argv[3] || 'all';
    
    if (operation === 'clean') {
        toolkit.cleanJsonFiles().catch(console.error);
    } else if (operation === 'locations') {
        toolkit.fixLocationConflicts().catch(console.error);
    } else if (operation === 'recoverable') {
        toolkit.fixRecoverableIssues().catch(console.error);
    } else {
        toolkit.runComprehensiveRepair().catch(console.error);
    }
}