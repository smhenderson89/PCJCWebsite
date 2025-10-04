const fs = require('fs-extra');
const path = require('path');

class Json2023Cleaner {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.jsonDir = path.join(this.baseDir, 'savedData', '2023', 'json');
    }

    async cleanAll2023JsonFiles() {
        console.log('🧹 Cleaning 2023 JSON Files\n');
        console.log('📋 This will:');
        console.log('   • Remove redundant "awardphoto" keys');
        console.log('   • Analyze measurement data completeness');
        console.log('   • Generate cleanup report\n');

        const results = {
            totalFiles: 0,
            cleanedFiles: 0,
            measurementAnalysis: {
                withMeasurements: 0,
                withoutMeasurements: 0,
                missingMeasurementFiles: []
            },
            errors: []
        };

        // Get all JSON files
        const jsonFiles = await this.getJsonFiles();
        results.totalFiles = jsonFiles.length;
        console.log(`📊 Found ${jsonFiles.length} JSON files to process`);

        for (const awardNum of jsonFiles) {
            try {
                console.log(`📄 Processing: ${awardNum}.json`);
                
                const jsonPath = path.join(this.jsonDir, `${awardNum}.json`);
                const jsonContent = await fs.readFile(jsonPath, 'utf8');
                const awardData = JSON.parse(jsonContent);

                // Check if cleanup is needed
                let needsCleanup = false;
                
                // Remove awardphoto key if it exists
                if (awardData.hasOwnProperty('awardphoto')) {
                    delete awardData.awardphoto;
                    needsCleanup = true;
                    console.log(`   🗑️  Removed awardphoto key`);
                }

                // Analyze measurements
                if (this.hasMeaningfulMeasurements(awardData.measurements)) {
                    results.measurementAnalysis.withMeasurements++;
                } else {
                    results.measurementAnalysis.withoutMeasurements++;
                    results.measurementAnalysis.missingMeasurementFiles.push(awardNum);
                }

                // Save cleaned JSON if needed
                if (needsCleanup) {
                    const cleanedJson = JSON.stringify(awardData, null, 2);
                    await fs.writeFile(jsonPath, cleanedJson, 'utf8');
                    results.cleanedFiles++;
                    console.log(`   ✅ Cleaned and saved`);
                } else {
                    console.log(`   ℹ️  No cleanup needed`);
                }

            } catch (error) {
                const errorMsg = `${awardNum}: ${error.message}`;
                results.errors.push(errorMsg);
                console.log(`   ❌ Error: ${errorMsg}`);
            }
        }

        // Generate report
        await this.generateCleanupReport(results);

        // Summary
        console.log('\n📊 CLEANUP RESULTS');
        console.log('==================');
        console.log(`📄 Total files: ${results.totalFiles}`);
        console.log(`🧹 Files cleaned: ${results.cleanedFiles}`);
        console.log(`📏 Files with measurements: ${results.measurementAnalysis.withMeasurements}`);
        console.log(`🚫 Files missing measurements: ${results.measurementAnalysis.withoutMeasurements}`);
        console.log(`❌ Errors: ${results.errors.length}`);

        if (results.measurementAnalysis.missingMeasurementFiles.length > 0) {
            console.log('\n📏 Files missing measurement data:');
            const missing = results.measurementAnalysis.missingMeasurementFiles;
            if (missing.length <= 20) {
                missing.forEach((file, index) => {
                    console.log(`${index + 1}. ${file}`);
                });
            } else {
                missing.slice(0, 20).forEach((file, index) => {
                    console.log(`${index + 1}. ${file}`);
                });
                console.log(`   ... and ${missing.length - 20} more`);
            }
        }

        return results;
    }

    async getJsonFiles() {
        try {
            const files = await fs.readdir(this.jsonDir);
            return files
                .filter(f => f.endsWith('.json'))
                .filter(f => f.match(/^20235\d{3}\.json$/)) // Only award files
                .map(f => f.replace('.json', ''))
                .sort();
        } catch (error) {
            console.error('Error reading JSON directory:', error);
            return [];
        }
    }

    hasMeaningfulMeasurements(measurements) {
        if (!measurements || typeof measurements !== 'object') {
            return false;
        }

        // Check if any measurement values exist (not null/undefined)
        const measurementKeys = ['NS', 'NSV', 'DSL', 'DSW', 'PETL', 'PETW', 'LSW', 'LSL', 'LIPW', 'LIPL', 'PCHW', 'SYNSL', 'SYNSW'];
        const hasNumericMeasurements = measurementKeys.some(key => 
            measurements[key] !== null && measurements[key] !== undefined && !isNaN(measurements[key])
        );

        const countKeys = ['numFlowers', 'numBuds', 'numInflorescences'];
        const hasCounts = countKeys.some(key => 
            measurements[key] !== null && measurements[key] !== undefined && !isNaN(measurements[key])
        );

        const hasDescription = measurements.description && measurements.description.trim().length > 0;

        return hasNumericMeasurements || hasCounts || hasDescription;
    }

    async generateCleanupReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: results.totalFiles,
                cleanedFiles: results.cleanedFiles,
                filesWithMeasurements: results.measurementAnalysis.withMeasurements,
                filesWithoutMeasurements: results.measurementAnalysis.withoutMeasurements,
                measurementCoverage: results.totalFiles > 0 ? 
                    (results.measurementAnalysis.withMeasurements / results.totalFiles * 100).toFixed(1) : 0
            },
            details: {
                missingMeasurementFiles: results.measurementAnalysis.missingMeasurementFiles,
                errors: results.errors
            }
        };

        const reportPath = path.join(this.baseDir, 'savedData', '2023', '2023-cleanup-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
        
        console.log(`\n📄 Cleanup report saved: ${reportPath}`);
        return report;
    }

    async verifyCleanup() {
        console.log('\n🔍 Verifying cleanup...');
        
        const jsonFiles = await this.getJsonFiles();
        let awardphotoFound = 0;
        
        for (const awardNum of jsonFiles) {
            try {
                const jsonPath = path.join(this.jsonDir, `${awardNum}.json`);
                const jsonContent = await fs.readFile(jsonPath, 'utf8');
                const awardData = JSON.parse(jsonContent);
                
                if (awardData.hasOwnProperty('awardphoto')) {
                    awardphotoFound++;
                }
            } catch (error) {
                console.log(`   ❌ Error verifying ${awardNum}: ${error.message}`);
            }
        }
        
        if (awardphotoFound === 0) {
            console.log('   ✅ All awardphoto keys successfully removed');
        } else {
            console.log(`   ⚠️  Still found ${awardphotoFound} files with awardphoto keys`);
        }
        
        return awardphotoFound;
    }
}

async function clean2023JsonFiles() {
    console.log('🚀 Starting 2023 JSON Cleanup Process\n');
    
    try {
        const cleaner = new Json2023Cleaner();
        
        // Clean all files
        const results = await cleaner.cleanAll2023JsonFiles();
        
        // Verify cleanup
        await cleaner.verifyCleanup();
        
        console.log('\n🎉 2023 JSON CLEANUP COMPLETE!');
        console.log('===============================');
        console.log(`🧹 Successfully cleaned ${results.cleanedFiles} files`);
        console.log(`📏 Measurement coverage: ${((results.measurementAnalysis.withMeasurements / results.totalFiles) * 100).toFixed(1)}%`);
        console.log('🗑️  All redundant awardphoto keys removed');
        
        return results;
        
    } catch (error) {
        console.error('❌ Error during 2023 cleanup:', error);
    }
}

if (require.main === module) {
    clean2023JsonFiles().catch(console.error);
}

module.exports = { clean2023JsonFiles };