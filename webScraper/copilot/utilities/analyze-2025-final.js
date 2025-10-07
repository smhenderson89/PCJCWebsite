const fs = require('fs');
const path = require('path');

const jsonDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2025/json';
const htmlDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2025/html';
const indexPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2025/html/2025.html';
const reportPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2025/2025-missing-data-report.json';

// Define the required fields for a complete record
const requiredFields = [
    'awardNum', 'award', 'awardpoints', 'location', 'date', 
    'genus', 'species', 'clone', 'cross', 'exhibitor', 
    'photographer', 'photo', 'measurements'
];

const requiredMeasurementFields = [
    'type', 'NS', 'NSV', 'DSL', 'DSW', 'PETL', 'PETW', 
    'numFlowers', 'numBuds', 'numInflorescences', 'description',
    'LSW', 'LSL', 'LIPW', 'LIPL'
];

// Additional optional measurement fields that might exist
const optionalMeasurementFields = [
    'PCHW', 'SYNSL', 'SYNSW' // For certain orchid types
];

function analyzeDataCompleteness() {
    console.log('Starting fresh comprehensive analysis of 2025 data completeness...');
    
    let files = [];
    try {
        files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
    } catch (error) {
        console.error('Error reading directory:', error);
        return;
    }

    console.log(`Found ${files.length} JSON files to analyze`);

    const report = {
        timestamp: new Date().toISOString(),
        analysisVersion: "2.0",
        summary: {
            totalJsonFiles: files.length,
            completeFiles: 0,
            filesWithMissingCoreData: 0,
            filesWithNullValues: 0,
            filesWithEmptyStrings: 0,
            filesWithMissingMeasurements: 0,
            filesWithIncompleteSpecies: 0,
            validFiles: 0
        },
        details: {
            completeFiles: [],
            filesWithMissingCoreData: [],
            filesWithNullValues: [],
            filesWithEmptyStrings: [],
            filesWithMissingMeasurements: [],
            filesWithIncompleteSpecies: [],
            missingFieldsBreakdown: {},
            measurementFieldsAnalysis: {
                commonMissing: {},
                byMeasurementType: {}
            },
            locationAnalysis: {
                uniqueLocations: new Set(),
                locationCounts: {}
            },
            genusSpeciesAnalysis: {
                incompleteRecords: []
            }
        }
    };

    files.forEach(file => {
        const filePath = path.join(jsonDir, file);
        
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8').trim();
            
            // Check for empty files
            if (!fileContent || fileContent === '{}' || fileContent === '') {
                console.error(`Empty file detected: ${file}`);
                return;
            }

            let data;
            try {
                data = JSON.parse(fileContent);
            } catch (parseError) {
                console.error(`Invalid JSON in ${file}:`, parseError.message);
                return;
            }

            // Initialize flags for this file
            let hasMissingCoreData = false;
            let hasNullValues = false;
            let hasEmptyStrings = false;
            let hasMissingMeasurements = false;
            let hasIncompleteSpecies = false;
            const missingFields = [];
            const emptyFields = [];

            // Check required core fields
            requiredFields.forEach(field => {
                if (!(field in data)) {
                    missingFields.push(field);
                    hasMissingCoreData = true;
                } else if (data[field] === null || data[field] === undefined) {
                    hasNullValues = true;
                } else if (typeof data[field] === 'string' && data[field].trim() === '') {
                    emptyFields.push(field);
                    hasEmptyStrings = true;
                }
            });

            // Special analysis for genus/species completeness
            const genus = data.genus;
            const species = data.species;
            if (!genus || genus.trim() === '' || !species || species.trim() === '') {
                hasIncompleteSpecies = true;
                report.details.genusSpeciesAnalysis.incompleteRecords.push({
                    file: file,
                    genus: genus || 'MISSING',
                    species: species || 'MISSING'
                });
            }

            // Location analysis
            if (data.location && data.location.trim() !== '') {
                report.details.locationAnalysis.uniqueLocations.add(data.location);
                if (!report.details.locationAnalysis.locationCounts[data.location]) {
                    report.details.locationAnalysis.locationCounts[data.location] = 0;
                }
                report.details.locationAnalysis.locationCounts[data.location]++;
            }

            // Detailed measurements analysis
            if (data.measurements && typeof data.measurements === 'object') {
                const measurementType = data.measurements.type || 'Unknown';
                
                if (!report.details.measurementFieldsAnalysis.byMeasurementType[measurementType]) {
                    report.details.measurementFieldsAnalysis.byMeasurementType[measurementType] = {
                        count: 0,
                        missingFields: {}
                    };
                }
                report.details.measurementFieldsAnalysis.byMeasurementType[measurementType].count++;

                const missingMeasurementFields = [];
                requiredMeasurementFields.forEach(field => {
                    if (!(field in data.measurements)) {
                        missingMeasurementFields.push(field);
                        hasMissingMeasurements = true;
                        
                        // Track missing fields globally
                        if (!report.details.measurementFieldsAnalysis.commonMissing[field]) {
                            report.details.measurementFieldsAnalysis.commonMissing[field] = 0;
                        }
                        report.details.measurementFieldsAnalysis.commonMissing[field]++;
                        
                        // Track by measurement type
                        const typeAnalysis = report.details.measurementFieldsAnalysis.byMeasurementType[measurementType];
                        if (!typeAnalysis.missingFields[field]) {
                            typeAnalysis.missingFields[field] = 0;
                        }
                        typeAnalysis.missingFields[field]++;
                    } else if (data.measurements[field] === null || data.measurements[field] === undefined) {
                        hasMissingMeasurements = true;
                    }
                });
                
                if (missingMeasurementFields.length > 0) {
                    missingFields.push(`measurements: ${missingMeasurementFields.join(', ')}`);
                }
            } else if ('measurements' in data) {
                hasMissingMeasurements = true;
                missingFields.push('measurements object is invalid');
            } else {
                hasMissingMeasurements = true;
                missingFields.push('measurements field missing');
            }

            // Record findings for this file
            if (hasMissingCoreData) {
                report.details.filesWithMissingCoreData.push({
                    file: file,
                    missingFields: missingFields
                });
                report.summary.filesWithMissingCoreData++;
                
                // Track which fields are most commonly missing
                missingFields.forEach(field => {
                    if (!report.details.missingFieldsBreakdown[field]) {
                        report.details.missingFieldsBreakdown[field] = 0;
                    }
                    report.details.missingFieldsBreakdown[field]++;
                });
            }

            if (hasNullValues) {
                report.details.filesWithNullValues.push(file);
                report.summary.filesWithNullValues++;
            }

            if (hasEmptyStrings) {
                report.details.filesWithEmptyStrings.push({
                    file: file,
                    emptyFields: emptyFields
                });
                report.summary.filesWithEmptyStrings++;
            }

            if (hasMissingMeasurements) {
                report.details.filesWithMissingMeasurements.push(file);
                report.summary.filesWithMissingMeasurements++;
            }

            if (hasIncompleteSpecies) {
                report.details.filesWithIncompleteSpecies.push(file);
                report.summary.filesWithIncompleteSpecies++;
            }

            // A file is considered complete if it has:
            // - All required fields present
            // - No null values
            // - No empty strings  
            // - Complete measurements
            // - Complete genus/species
            if (!hasMissingCoreData && !hasNullValues && !hasEmptyStrings && !hasMissingMeasurements && !hasIncompleteSpecies) {
                report.details.completeFiles.push(file);
                report.summary.completeFiles++;
            }

            // A file is considered valid if it has core data complete (measurements can be incomplete)
            if (!hasMissingCoreData && !hasNullValues && !hasEmptyStrings && !hasIncompleteSpecies) {
                report.summary.validFiles++;
            }

        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
        }
    });

    // Convert Set to Array for JSON serialization
    report.details.locationAnalysis.uniqueLocations = Array.from(report.details.locationAnalysis.uniqueLocations);

    // Write the comprehensive report
    try {
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log('Fresh analysis complete! Report written to:', reportPath);
        
        // Print comprehensive summary
        console.log('\n' + '='.repeat(70));
        console.log('2025 PCJC AWARDS DATA - COMPREHENSIVE ANALYSIS REPORT');
        console.log('='.repeat(70));
        console.log(`📊 OVERVIEW:`);
        console.log(`   Total files analyzed: ${report.summary.totalJsonFiles}`);
        console.log(`   Complete files (100%): ${report.summary.completeFiles}`);
        console.log(`   Valid files (core data complete): ${report.summary.validFiles}`);
        console.log('');
        
        console.log(`🔍 DATA QUALITY ISSUES:`);
        console.log(`   Files with missing core data: ${report.summary.filesWithMissingCoreData}`);
        console.log(`   Files with null values: ${report.summary.filesWithNullValues}`);
        console.log(`   Files with empty strings: ${report.summary.filesWithEmptyStrings}`);
        console.log(`   Files with missing measurements: ${report.summary.filesWithMissingMeasurements}`);
        console.log(`   Files with incomplete genus/species: ${report.summary.filesWithIncompleteSpecies}`);
        console.log('');
        
        console.log(`📍 LOCATION DATA:`);
        console.log(`   Unique locations found: ${report.details.locationAnalysis.uniqueLocations.length}`);
        const topLocations = Object.entries(report.details.locationAnalysis.locationCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        topLocations.forEach(([location, count]) => {
            console.log(`   "${location}": ${count} awards`);
        });
        console.log('');
        
        console.log(`🔬 MEASUREMENT DATA:`);
        const measurementTypes = Object.keys(report.details.measurementFieldsAnalysis.byMeasurementType);
        console.log(`   Measurement types found: ${measurementTypes.length}`);
        measurementTypes.forEach(type => {
            const typeData = report.details.measurementFieldsAnalysis.byMeasurementType[type];
            console.log(`   "${type}": ${typeData.count} records`);
        });
        
        if (Object.keys(report.details.measurementFieldsAnalysis.commonMissing).length > 0) {
            console.log(`\n   Most commonly missing measurement fields:`);
            Object.entries(report.details.measurementFieldsAnalysis.commonMissing)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .forEach(([field, count]) => {
                    console.log(`     ${field}: missing in ${count} files`);
                });
        }
        console.log('');
        
        if (report.details.genusSpeciesAnalysis.incompleteRecords.length > 0) {
            console.log(`🌿 GENUS/SPECIES ISSUES:`);
            console.log(`   Files with incomplete genus/species: ${report.details.genusSpeciesAnalysis.incompleteRecords.length}`);
            // Show first few examples
            const examples = report.details.genusSpeciesAnalysis.incompleteRecords.slice(0, 3);
            examples.forEach(record => {
                console.log(`     ${record.file}: genus="${record.genus}", species="${record.species}"`);
            });
            if (report.details.genusSpeciesAnalysis.incompleteRecords.length > 3) {
                console.log(`     ... and ${report.details.genusSpeciesAnalysis.incompleteRecords.length - 3} more`);
            }
            console.log('');
        }
        
        console.log(`📈 COMPLETION RATE:`);
        const completionRate = ((report.summary.completeFiles / report.summary.totalJsonFiles) * 100).toFixed(1);
        const validRate = ((report.summary.validFiles / report.summary.totalJsonFiles) * 100).toFixed(1);
        console.log(`   Fully complete: ${completionRate}%`);
        console.log(`   Core data valid: ${validRate}%`);
        console.log('='.repeat(70));
        
    } catch (error) {
        console.error('Error writing report:', error);
    }
}

analyzeDataCompleteness();