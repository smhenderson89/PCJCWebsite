#!/usr/bin/env node

/**
 * Fix 2024 Source URLs
 * 
 * Updates the sourceUrl field in 2024 JSON files to reflect the actual source URL structure:
 * From: "https://www.paccentraljc.org/awards/[awardNum]"
 * To: "https://www.paccentraljc.org/[YYYYMMDD]/[awardNum].html"
 * 
 * Usage: node fix-2024-source-urls.js
 */

const fs = require('fs-extra');
const path = require('path');

class SourceUrlFixer2024 {
    constructor() {
        this.baseDir = path.join(__dirname, '../../localCopy/paccentraljc.org/awards/2024/data/json');
        this.backupDir = path.join(__dirname, '../../localCopy/paccentraljc.org/awards/2024/data/backups');
        this.results = {
            processed: 0,
            updated: 0,
            errors: [],
            skipped: []
        };
    }

    /**
     * Convert date string to YYYYMMDD format
     * @param {string} dateStr - Date string like "January 20, 2024"
     * @returns {string} - YYYYMMDD format like "20240120"
     */
    formatDateToYYYYMMDD(dateStr) {
        try {
            const date = new Date(dateStr);
            const year = date.getFullYear().toString(); // Get full 4-digit year
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}${month}${day}`;
        } catch (error) {
            throw new Error(`Failed to parse date: ${dateStr} - ${error.message}`);
        }
    }

    /**
     * Create backup of the original file
     * @param {string} filePath - Path to the file to backup
     */
    async createBackup(filePath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `source-url-fixes-${timestamp}`;
        const backupPath = path.join(this.backupDir, backupFileName);
        
        await fs.ensureDir(this.backupDir);
        await fs.copy(this.baseDir, backupPath);
        
        console.log(`💾 Backup created: ${backupPath}`);
        return backupPath;
    }

    /**
     * Fix the source URL for a single JSON file
     * @param {string} filePath - Path to the JSON file
     */
    async fixSourceUrl(filePath) {
        try {
            const data = await fs.readJson(filePath);
            const fileName = path.basename(filePath, '.json');
            
            this.results.processed++;

            // Check if this file needs updating
            // Need to fix if: contains '/awards/' OR has 6-digit date format (240120 instead of 20240120)
            const needsFixing = data.sourceUrl && (
                data.sourceUrl.includes('/awards/') ||
                /\/\d{6}\//.test(data.sourceUrl) // Matches /YYMMDD/ pattern
            );
            
            if (!data.sourceUrl || !needsFixing) {
                this.results.skipped.push({
                    file: fileName,
                    reason: 'No source URL or already in correct format',
                    currentUrl: data.sourceUrl || 'null'
                });
                return;
            }

            if (!data.date) {
                this.results.errors.push({
                    file: fileName,
                    error: 'No date field found'
                });
                return;
            }

            if (!data.awardNum) {
                this.results.errors.push({
                    file: fileName,
                    error: 'No awardNum field found'
                });
                return;
            }

            // Convert date to YYYYMMDD format
            const yyyymmdd = this.formatDateToYYYYMMDD(data.date);
            
            // Create the new source URL
            const newSourceUrl = `https://www.paccentraljc.org/${yyyymmdd}/${data.awardNum}.html`;
            const oldSourceUrl = data.sourceUrl;

            // Update the source URL
            data.sourceUrl = newSourceUrl;

            // Add correction entry
            if (!data.corrections) {
                data.corrections = [];
            }
            
            data.corrections.push({
                timestamp: new Date().toISOString(),
                field: 'sourceUrl',
                oldValue: oldSourceUrl,
                newValue: newSourceUrl,
                source: 'automated-source-url-correction',
                reason: 'Updated to reflect actual source page URL structure (YYYYMMDD/awardNum.html)'
            });

            // Write back to file
            await fs.writeJson(filePath, data, { spaces: 2 });
            
            console.log(`   📍 ${fileName}: "${oldSourceUrl}" → "${newSourceUrl}"`);
            
            this.results.updated++;

        } catch (error) {
            this.results.errors.push({
                file: path.basename(filePath),
                error: error.message
            });
        }
    }

    /**
     * Process all JSON files in the 2024 directory
     */
    async processAllFiles() {
        console.log('🔧 Fixing source URLs for 2024...');
        
        // Create backup first
        await this.createBackup();
        
        // Get all JSON files
        const files = await fs.readdir(this.baseDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        console.log(`📁 Found ${jsonFiles.length} JSON files to process...`);
        
        // Process each file
        for (const file of jsonFiles) {
            const filePath = path.join(this.baseDir, file);
            await this.fixSourceUrl(filePath);
        }
        
        // Generate report
        await this.generateReport();
    }

    /**
     * Generate and save a detailed report
     */
    async generateReport() {
        const report = {
            summary: {
                totalProcessed: this.results.processed,
                successfullyUpdated: this.results.updated,
                skipped: this.results.skipped.length,
                errors: this.results.errors.length
            },
            details: {
                skippedFiles: this.results.skipped,
                errors: this.results.errors
            },
            timestamp: new Date().toISOString(),
            operation: 'fix-2024-source-urls'
        };

        const reportPath = path.join(__dirname, '../../localCopy/paccentraljc.org/awards/2024/data/2024-source-url-fixes-report.json');
        await fs.writeJson(reportPath, report, { spaces: 2 });

        console.log(`✅ Source URL fixes complete. ${this.results.updated} changes made.`);
        console.log(`📋 Report saved to: ${reportPath}`);

        // Print summary
        if (this.results.errors.length > 0) {
            console.log(`⚠️  ${this.results.errors.length} errors encountered:`);
            this.results.errors.forEach(error => {
                console.log(`   ❌ ${error.file}: ${error.error}`);
            });
        }

        if (this.results.skipped.length > 0) {
            console.log(`ℹ️  ${this.results.skipped.length} files skipped (already correct or missing data)`);
        }
    }
}

// Main execution
async function main() {
    try {
        const fixer = new SourceUrlFixer2024();
        await fixer.processAllFiles();
        
        console.log(`\n🎉 Source URL correction complete for 2024!`);
        
    } catch (error) {
        console.error('❌ Error during source URL fixing:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = SourceUrlFixer2024;