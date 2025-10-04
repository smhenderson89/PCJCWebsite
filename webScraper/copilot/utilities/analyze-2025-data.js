const fs = require('fs-extra');
const path = require('path');

class Data2025Analyzer {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.year = '2025';
        this.awardsDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year);
        this.imagesDir = path.join(this.awardsDir, 'images');
        this.jsonDir = path.join(this.baseDir, 'savedData', this.year, 'json');
    }

    async analyzeCurrentState() {
        console.log('🔍 Analyzing 2025 Data State\n');
        console.log('📋 This will analyze:');
        console.log('   • Current JSON files vs available images');
        console.log('   • Missing image references in JSON');
        console.log('   • Missing genus/species data');
        console.log('   • Files that can be automatically fixed\n');

        const results = {
            totalJsonFiles: 0,
            totalImages: 0,
            missingImageRefs: [],
            nullGenus: [],
            nullSpecies: [],
            fixableImageRefs: [],
            orphanedImages: [],
            analysis: {}
        };

        // Get all JSON files
        const jsonFiles = await this.getJsonFiles();
        results.totalJsonFiles = jsonFiles.length;
        console.log(`📊 Found ${jsonFiles.length} JSON files`);

        // Get all image files
        const imageFiles = await this.getImageFiles();
        results.totalImages = imageFiles.length;
        console.log(`🖼️  Found ${imageFiles.length} image files`);

        // Analyze each JSON file
        console.log('\n🔍 Analyzing JSON files...');
        for (const awardNum of jsonFiles) {
            try {
                const jsonPath = path.join(this.jsonDir, `${awardNum}.json`);
                const jsonContent = await fs.readFile(jsonPath, 'utf8');
                const awardData = JSON.parse(jsonContent);

                // Check photo reference
                if (!awardData.photo || awardData.photo === null) {
                    // Check if corresponding image exists
                    const expectedImage = `${awardNum}.jpg`;
                    if (imageFiles.includes(expectedImage)) {
                        results.fixableImageRefs.push({
                            award: awardNum,
                            expectedImage,
                            currentPhoto: awardData.photo
                        });
                    } else {
                        results.missingImageRefs.push({
                            award: awardNum,
                            expectedImage,
                            currentPhoto: awardData.photo
                        });
                    }
                }

                // Check genus
                if (!awardData.genus || awardData.genus === null) {
                    results.nullGenus.push(awardNum);
                }

                // Check species
                if (!awardData.species || awardData.species === null) {
                    results.nullSpecies.push(awardNum);
                }

            } catch (error) {
                console.log(`   ❌ Error reading ${awardNum}.json: ${error.message}`);
            }
        }

        // Find orphaned images (images without JSON files)
        const jsonAwardNums = new Set(jsonFiles);
        results.orphanedImages = imageFiles
            .map(img => img.replace('.jpg', ''))
            .filter(awardNum => !jsonAwardNums.has(awardNum));

        // Summary
        console.log('\n📊 ANALYSIS RESULTS');
        console.log('===================');
        console.log(`📄 Total JSON files: ${results.totalJsonFiles}`);
        console.log(`🖼️  Total images: ${results.totalImages}`);
        console.log(`🔧 Fixable image refs: ${results.fixableImageRefs.length}`);
        console.log(`❌ Missing image refs: ${results.missingImageRefs.length}`);
        console.log(`🚫 Null genus: ${results.nullGenus.length}`);
        console.log(`🚫 Null species: ${results.nullSpecies.length}`);
        console.log(`🏝️  Orphaned images: ${results.orphanedImages.length}`);

        if (results.fixableImageRefs.length > 0) {
            console.log('\n🔧 FIXABLE IMAGE REFERENCES:');
            results.fixableImageRefs.forEach((fix, index) => {
                console.log(`${index + 1}. Award ${fix.award} → ${fix.expectedImage}`);
            });
        }

        if (results.orphanedImages.length > 0) {
            console.log('\n🏝️  ORPHANED IMAGES (no JSON):');
            results.orphanedImages.slice(0, 10).forEach((img, index) => {
                console.log(`${index + 1}. ${img}.jpg`);
            });
            if (results.orphanedImages.length > 10) {
                console.log(`   ... and ${results.orphanedImages.length - 10} more`);
            }
        }

        return results;
    }

    async fixImageReferences(fixableRefs) {
        console.log('\n🔧 Fixing Image References...');
        let fixed = 0;
        const errors = [];

        for (const fix of fixableRefs) {
            try {
                const jsonPath = path.join(this.jsonDir, `${fix.award}.json`);
                const jsonContent = await fs.readFile(jsonPath, 'utf8');
                const awardData = JSON.parse(jsonContent);

                // Update the photo reference
                awardData.photo = `images/${fix.expectedImage}`;

                // Write back the updated JSON
                const updatedJson = JSON.stringify(awardData, null, 2);
                await fs.writeFile(jsonPath, updatedJson, 'utf8');

                console.log(`   ✅ Fixed ${fix.award}: Added photo reference`);
                fixed++;

            } catch (error) {
                const errorMsg = `${fix.award}: ${error.message}`;
                errors.push(errorMsg);
                console.log(`   ❌ Error fixing ${errorMsg}`);
            }
        }

        console.log(`\n📊 Image Reference Fix Results:`);
        console.log(`✅ Fixed: ${fixed}`);
        console.log(`❌ Errors: ${errors.length}`);

        return { fixed, errors };
    }

    async getJsonFiles() {
        try {
            const files = await fs.readdir(this.jsonDir);
            return files
                .filter(f => f.endsWith('.json'))
                .map(f => f.replace('.json', ''))
                .sort();
        } catch (error) {
            console.error('Error reading JSON directory:', error);
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
            console.error('Error reading images directory:', error);
            return [];
        }
    }

    async generateMissingDataReport(analysisResults) {
        console.log('\n📋 GENERATING MISSING DATA REPORT...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalJsonFiles: analysisResults.totalJsonFiles,
                totalImages: analysisResults.totalImages,
                missingImageRefs: analysisResults.missingImageRefs.length,
                nullGenus: analysisResults.nullGenus.length,
                nullSpecies: analysisResults.nullSpecies.length,
                orphanedImages: analysisResults.orphanedImages.length
            },
            details: {
                missingImageReferences: analysisResults.missingImageRefs,
                nullGenusAwards: analysisResults.nullGenus,
                nullSpeciesAwards: analysisResults.nullSpecies,
                orphanedImages: analysisResults.orphanedImages
            }
        };

        const reportPath = path.join(this.baseDir, 'savedData', this.year, '2025-missing-data-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
        
        console.log(`📄 Missing data report saved: ${reportPath}`);
        return report;
    }
}

async function analyze2025Data() {
    console.log('🚀 Starting 2025 Data Analysis\n');
    
    try {
        const analyzer = new Data2025Analyzer();
        
        // Analyze current state
        const results = await analyzer.analyzeCurrentState();
        
        // Fix what can be fixed automatically
        if (results.fixableImageRefs.length > 0) {
            await analyzer.fixImageReferences(results.fixableImageRefs);
        }
        
        // Generate comprehensive report
        const report = await analyzer.generateMissingDataReport(results);
        
        console.log('\n🎉 2025 DATA ANALYSIS COMPLETE!');
        console.log('================================');
        console.log(`📊 ${results.fixableImageRefs.length} image references automatically fixed`);
        console.log(`📋 Missing data report generated`);
        console.log('📄 Review the report for remaining issues');
        
        return { results, report };
        
    } catch (error) {
        console.error('❌ Error during 2025 analysis:', error);
    }
}

if (require.main === module) {
    analyze2025Data().catch(console.error);
}

module.exports = { analyze2025Data };