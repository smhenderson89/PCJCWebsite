const fs = require('fs-extra');
const path = require('path');

class JsonCleaner {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.years = ['2023', '2024', '2025'];
        this.results = {
            processed: 0,
            cleaned: 0,
            errors: [],
            summary: {}
        };
    }

    async cleanAllYears() {
        console.log('🧹 Starting JSON Cleanup for All Years\n');
        console.log('📋 This will:');
        console.log('   • Remove redundant "awardphoto" keys');
        console.log('   • Keep only "photo" references');
        console.log('   • Process 2023, 2024, and 2025 data');
        console.log('   • Generate cleanup summary\n');

        for (const year of this.years) {
            console.log(`📅 Processing ${year} JSON files...`);
            const yearResults = await this.cleanYearData(year);
            this.results.summary[year] = yearResults;
        }

        this.printFinalSummary();
        return this.results;
    }

    async cleanYearData(year) {
        const jsonDir = path.join(this.baseDir, 'savedData', year, 'json');
        
        const yearResults = {
            total: 0,
            cleaned: 0,
            errors: 0,
            errorDetails: []
        };

        try {
            const files = await fs.readdir(jsonDir);
            const jsonFiles = files.filter(f => f.endsWith('.json') && f.match(/^\d+\.json$/));
            
            yearResults.total = jsonFiles.length;
            console.log(`   📊 Found ${jsonFiles.length} JSON files`);

            for (const file of jsonFiles) {
                try {
                    const filePath = path.join(jsonDir, file);
                    const awardNum = file.replace('.json', '');
                    
                    const jsonContent = await fs.readFile(filePath, 'utf8');
                    const awardData = JSON.parse(jsonContent);
                    
                    let needsUpdate = false;
                    
                    // Check if we need to remove awardphoto
                    if (awardData.hasOwnProperty('awardphoto') && awardData.hasOwnProperty('photo')) {
                        delete awardData.awardphoto;
                        needsUpdate = true;
                    }
                    
                    if (needsUpdate) {
                        const cleanedJson = JSON.stringify(awardData, null, 2);
                        await fs.writeFile(filePath, cleanedJson, 'utf8');
                        yearResults.cleaned++;
                        this.results.cleaned++;
                        console.log(`      ✅ Cleaned: ${awardNum}`);
                    }
                    
                    this.results.processed++;
                    
                } catch (error) {
                    yearResults.errors++;
                    const errorMsg = `${file}: ${error.message}`;
                    yearResults.errorDetails.push(errorMsg);
                    this.results.errors.push(errorMsg);
                    console.log(`      ❌ Error: ${errorMsg}`);
                }
            }
            
            console.log(`   📊 ${year} Results: ${yearResults.cleaned} cleaned, ${yearResults.errors} errors\n`);
            
        } catch (error) {
            console.error(`   ❌ Error reading ${year} directory:`, error.message);
            yearResults.errors++;
        }

        return yearResults;
    }

    async analyzeMeasurementData() {
        console.log('🔍 Analyzing Measurement Data Across All Years\n');
        
        const measurementAnalysis = {};
        
        for (const year of this.years) {
            console.log(`📅 Checking ${year} measurement data...`);
            const analysis = await this.analyzeYearMeasurements(year);
            measurementAnalysis[year] = analysis;
        }
        
        this.printMeasurementSummary(measurementAnalysis);
        return measurementAnalysis;
    }

    async analyzeYearMeasurements(year) {
        const jsonDir = path.join(this.baseDir, 'savedData', year, 'json');
        
        const analysis = {
            total: 0,
            withMeasurements: 0,
            withoutMeasurements: 0,
            emptyMeasurements: 0,
            missingFiles: []
        };

        try {
            const files = await fs.readdir(jsonDir);
            const jsonFiles = files.filter(f => f.endsWith('.json') && f.match(/^\d+\.json$/));
            
            analysis.total = jsonFiles.length;
            
            for (const file of jsonFiles) {
                try {
                    const filePath = path.join(jsonDir, file);
                    const jsonContent = await fs.readFile(filePath, 'utf8');
                    const awardData = JSON.parse(jsonContent);
                    
                    if (!awardData.measurements) {
                        analysis.withoutMeasurements++;
                        analysis.missingFiles.push(file.replace('.json', ''));
                    } else {
                        // Check if measurements object is essentially empty
                        const measurements = awardData.measurements;
                        const hasRealData = Object.values(measurements).some(value => 
                            value !== null && value !== undefined && value !== ''
                        );
                        
                        if (hasRealData) {
                            analysis.withMeasurements++;
                        } else {
                            analysis.emptyMeasurements++;
                            analysis.missingFiles.push(file.replace('.json', ''));
                        }
                    }
                    
                } catch (error) {
                    console.log(`      ❌ Error analyzing ${file}: ${error.message}`);
                }
            }
            
            console.log(`   📊 Measurements: ${analysis.withMeasurements} complete, ${analysis.withoutMeasurements + analysis.emptyMeasurements} missing/empty`);
            
        } catch (error) {
            console.error(`   ❌ Error analyzing ${year} measurements:`, error.message);
        }

        return analysis;
    }

    printFinalSummary() {
        console.log('📊 JSON CLEANUP COMPLETE!');
        console.log('==========================');
        console.log(`📄 Total files processed: ${this.results.processed}`);
        console.log(`🧹 Files cleaned: ${this.results.cleaned}`);
        console.log(`❌ Errors: ${this.results.errors.length}`);
        console.log('');
        
        for (const year of this.years) {
            const yearData = this.results.summary[year];
            if (yearData) {
                console.log(`📅 ${year}: ${yearData.cleaned}/${yearData.total} cleaned`);
            }
        }
        
        if (this.results.errors.length > 0) {
            console.log('\n🚨 ERRORS:');
            this.results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
    }

    printMeasurementSummary(measurementAnalysis) {
        console.log('\n📏 MEASUREMENT DATA ANALYSIS');
        console.log('=============================');
        
        for (const year of this.years) {
            const data = measurementAnalysis[year];
            if (data) {
                const completeness = data.total > 0 ? 
                    (data.withMeasurements / data.total * 100).toFixed(1) : 0;
                
                console.log(`📅 ${year}:`);
                console.log(`   📊 Total awards: ${data.total}`);
                console.log(`   ✅ With measurements: ${data.withMeasurements} (${completeness}%)`);
                console.log(`   🚫 Missing/empty: ${data.withoutMeasurements + data.emptyMeasurements}`);
                
                if (data.missingFiles.length > 0 && data.missingFiles.length <= 5) {
                    console.log(`   📝 Missing: ${data.missingFiles.join(', ')}`);
                } else if (data.missingFiles.length > 5) {
                    console.log(`   📝 Missing: ${data.missingFiles.slice(0, 5).join(', ')}... and ${data.missingFiles.length - 5} more`);
                }
                console.log('');
            }
        }
    }
}

async function cleanJsonFiles() {
    console.log('🚀 Starting Comprehensive JSON Cleanup Process\n');
    
    try {
        const cleaner = new JsonCleaner();
        
        // Clean up redundant keys
        const cleanupResults = await cleaner.cleanAllYears();
        
        // Analyze measurement data
        const measurementAnalysis = await cleaner.analyzeMeasurementData();
        
        console.log('\n🎉 COMPREHENSIVE CLEANUP COMPLETE!');
        console.log('===================================');
        console.log(`🧹 ${cleanupResults.cleaned} JSON files cleaned`);
        console.log('📏 Measurement analysis completed');
        console.log('🗂️ All redundant "awardphoto" keys removed');
        
        return { cleanupResults, measurementAnalysis };
        
    } catch (error) {
        console.error('❌ Error during JSON cleanup:', error);
    }
}

if (require.main === module) {
    cleanJsonFiles().catch(console.error);
}

module.exports = { cleanJsonFiles };