const fs = require('fs-extra');
const path = require('path');

class Data2025Cleaner {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.jsonDir = path.join(this.baseDir, 'savedData', '2025', 'json');
        
        // Processing artifacts that should be removed or moved
        this.processingArtifacts = [
            '2025',
            'all-awards',
            'all-awards-respectful', 
            'all-awards-with-images',
            'award-statistics',
            'date-based-download-results',
            'missing-images-report',
            'processing-summary',
            'scraped-data'
        ];
    }

    async cleanProcessingArtifacts() {
        console.log('🧹 Cleaning 2025 Processing Artifacts\n');
        console.log('📋 This will:');
        console.log('   • Remove processing/summary files from award data');
        console.log('   • Keep only actual orchid award JSON files');
        console.log('   • Generate accurate data quality metrics\n');

        const results = {
            removed: [],
            kept: [],
            errors: []
        };

        // Check which artifacts exist and remove them
        for (const artifact of this.processingArtifacts) {
            const jsonPath = path.join(this.jsonDir, `${artifact}.json`);
            
            try {
                if (await fs.pathExists(jsonPath)) {
                    await fs.remove(jsonPath);
                    results.removed.push(artifact);
                    console.log(`   🗑️  Removed: ${artifact}.json`);
                } else {
                    console.log(`   ℹ️  Not found: ${artifact}.json`);
                }
            } catch (error) {
                results.errors.push(`${artifact}: ${error.message}`);
                console.log(`   ❌ Error removing ${artifact}.json: ${error.message}`);
            }
        }

        // Get remaining award files
        const remainingFiles = await this.getRealAwardFiles();
        results.kept = remainingFiles;

        console.log('\n📊 CLEANUP RESULTS');
        console.log('==================');
        console.log(`🗑️  Removed artifacts: ${results.removed.length}`);
        console.log(`📄 Remaining awards: ${results.kept.length}`);
        console.log(`❌ Errors: ${results.errors.length}`);

        if (results.removed.length > 0) {
            console.log('\n🗑️  Removed Files:');
            results.removed.forEach((file, index) => {
                console.log(`${index + 1}. ${file}.json`);
            });
        }

        return results;
    }

    async getRealAwardFiles() {
        try {
            const files = await fs.readdir(this.jsonDir);
            return files
                .filter(f => f.endsWith('.json'))
                .map(f => f.replace('.json', ''))
                .filter(f => f.match(/^20255\d{3}$/)) // Only actual award numbers
                .sort();
        } catch (error) {
            console.error('Error reading JSON directory:', error);
            return [];
        }
    }

    async generateCleanReport() {
        console.log('\n📋 GENERATING CLEAN DATA REPORT...');

        const awardFiles = await this.getRealAwardFiles();
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalAwardFiles: awardFiles.length,
                missingGenus: 0,
                missingSpecies: 0,
                missingImages: 0,
                completeRecords: 0
            },
            issues: {
                nullGenus: [],
                nullSpecies: [],
                missingImages: []
            }
        };

        // Analyze each real award file
        for (const awardNum of awardFiles) {
            try {
                const jsonPath = path.join(this.jsonDir, `${awardNum}.json`);
                const jsonContent = await fs.readFile(jsonPath, 'utf8');
                const awardData = JSON.parse(jsonContent);

                // Check for missing data
                if (!awardData.genus || awardData.genus === null) {
                    report.summary.missingGenus++;
                    report.issues.nullGenus.push(awardNum);
                }

                if (!awardData.species || awardData.species === null) {
                    report.summary.missingSpecies++;
                    report.issues.nullSpecies.push(awardNum);
                }

                if (!awardData.photo || awardData.photo === null) {
                    report.summary.missingImages++;
                    report.issues.missingImages.push(awardNum);
                }

                // Count complete records
                if (awardData.genus && awardData.species && awardData.photo) {
                    report.summary.completeRecords++;
                }

            } catch (error) {
                console.log(`   ❌ Error analyzing ${awardNum}: ${error.message}`);
            }
        }

        // Calculate percentages
        const total = report.summary.totalAwardFiles;
        const completeness = total > 0 ? (report.summary.completeRecords / total * 100).toFixed(1) : 0;

        console.log('\n📊 CLEAN DATA QUALITY REPORT');
        console.log('==============================');
        console.log(`📄 Total Award Files: ${report.summary.totalAwardFiles}`);
        console.log(`✅ Complete Records: ${report.summary.completeRecords} (${completeness}%)`);
        console.log(`🚫 Missing Genus: ${report.summary.missingGenus}`);
        console.log(`🚫 Missing Species: ${report.summary.missingSpecies}`);
        console.log(`🖼️ Missing Images: ${report.summary.missingImages}`);

        if (report.issues.nullGenus.length > 0) {
            console.log(`\n🚫 Awards with missing genus: ${report.issues.nullGenus.join(', ')}`);
        }

        if (report.issues.nullSpecies.length > 0) {
            console.log(`\n🚫 Awards with missing species: ${report.issues.nullSpecies.join(', ')}`);
        }

        if (report.issues.missingImages.length > 0) {
            console.log(`\n🖼️ Awards with missing images: ${report.issues.missingImages.join(', ')}`);
        }

        // Save clean report
        const reportPath = path.join(this.baseDir, 'savedData', '2025', '2025-clean-data-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
        console.log(`\n📄 Clean report saved: ${reportPath}`);

        return report;
    }
}

async function clean2025Data() {
    console.log('🚀 Starting 2025 Data Cleanup Process\n');
    
    try {
        const cleaner = new Data2025Cleaner();
        
        // Remove processing artifacts
        const cleanupResults = await cleaner.cleanProcessingArtifacts();
        
        // Generate accurate report
        const report = await cleaner.generateCleanReport();
        
        console.log('\n🎉 2025 DATA CLEANUP COMPLETE!');
        console.log('===============================');
        console.log(`🗑️  Removed ${cleanupResults.removed.length} processing artifacts`);
        console.log(`📊 ${report.summary.totalAwardFiles} clean award records remain`);
        console.log(`✅ ${report.summary.completeRecords} records have complete data`);
        console.log('📋 Accurate data quality report generated');
        
        return { cleanupResults, report };
        
    } catch (error) {
        console.error('❌ Error during 2025 cleanup:', error);
    }
}

if (require.main === module) {
    clean2025Data().catch(console.error);
}

module.exports = { clean2025Data };