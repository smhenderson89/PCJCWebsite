const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const jsonDirectory = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2024/json';
const htmlDirectory = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2024/html';
const indexHtmlPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2024/html/2024.html';
const reportPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2024/2024-missing-data-report.json';

function analyzeJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        const analysis = {
            awardNum: data.awardNum,
            plantName: `${data.genus || 'Unknown'} ${data.species || 'Unknown'}`,
            exhibitor: data.exhibitor || 'Unknown',
            hasAllCoreData: true,
            missingFields: [],
            nullFields: [],
            emptyStringFields: [],
            hasMeasurements: false,
            measurementType: null,
            location: data.location || null
        };
        
        // Check core required fields
        const coreFields = ['awardNum', 'award', 'awardpoints', 'genus', 'species', 'exhibitor', 'date'];
        
        for (const field of coreFields) {
            if (data[field] === null) {
                analysis.nullFields.push(field);
                analysis.hasAllCoreData = false;
            } else if (data[field] === '') {
                analysis.emptyStringFields.push(field);
                analysis.hasAllCoreData = false;
            } else if (data[field] === undefined) {
                analysis.missingFields.push(field);
                analysis.hasAllCoreData = false;
            }
        }
        
        // Check measurements
        if (data.measurements && typeof data.measurements === 'object') {
            analysis.hasMeasurements = true;
            analysis.measurementType = data.measurements.type;
            
            // Check for null values in measurements
            const measurementFields = ['NS', 'NSV', 'DSL', 'DSW', 'PETL', 'PETW', 'LSL', 'LSW', 'LIPL', 'LIPW'];
            for (const field of measurementFields) {
                if (data.measurements[field] === null) {
                    analysis.nullFields.push(`measurements.${field}`);
                } else if (data.measurements[field] === '') {
                    analysis.emptyStringFields.push(`measurements.${field}`);
                }
            }
            
            // Check description
            if (!data.measurements.description || data.measurements.description.trim() === '') {
                analysis.nullFields.push('measurements.description');
            }
        } else {
            analysis.nullFields.push('measurements');
        }
        
        // Check other important fields
        const optionalFields = ['clone', 'cross', 'photographer', 'photo', 'thumbnail'];
        for (const field of optionalFields) {
            if (data[field] === null) {
                analysis.nullFields.push(field);
            } else if (data[field] === '') {
                analysis.emptyStringFields.push(field);
            }
        }
        
        return analysis;
    } catch (error) {
        console.error(`Error analyzing ${filePath}:`, error);
        return null;
    }
}

function extractLocationFromIndexPage() {
    console.log('Extracting location data from index page...');
    
    try {
        const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
        const $ = cheerio.load(indexContent);
        
        const locationMap = {};
        
        // Look for award entries in the index page
        $('table tr').each((i, row) => {
            const $row = $(row);
            const cells = $row.find('td');
            
            if (cells.length >= 3) {
                // Extract award number from the link
                const link = $row.find('a').attr('href');
                if (link) {
                    const awardNumMatch = link.match(/(\d{8})/);
                    if (awardNumMatch) {
                        const awardNum = awardNumMatch[1];
                        
                        // Look for location information - it might be in different columns
                        cells.each((j, cell) => {
                            const cellText = $(cell).text().trim();
                            
                            // Common location patterns for orchid shows
                            if (cellText.includes('Monthly') || 
                                cellText.includes('Show') || 
                                cellText.includes('Exposition') || 
                                cellText.includes('Society') ||
                                cellText.includes('Filoli') ||
                                cellText.includes('Pacific') ||
                                cellText.includes('San Francisco') ||
                                cellText.includes('Peninsula')) {
                                locationMap[awardNum] = cellText;
                            }
                        });
                    }
                }
            }
        });
        
        console.log(`Found ${Object.keys(locationMap).length} location entries from index page`);
        return locationMap;
    } catch (error) {
        console.error('Error reading index page:', error);
        return {};
    }
}

function normalizeLocation(location) {
    if (!location) return '';
    
    const normalized = location.toLowerCase().trim();
    
    // Normalize common variations
    const normalizations = {
        'filoli historic house monthly': 'filoli historic house monthly',
        'filoli historic monthly': 'filoli historic house monthly',
        'filoli monthly': 'filoli historic house monthly',
        'san francisco monthly': 'san francisco monthly',
        'sf monthly': 'san francisco monthly',
        'pacific orchid exposition': 'pacific orchid exposition',
        'pacific orchid expo': 'pacific orchid exposition',
        'peninsula os/gold coast cymbidium show': 'peninsula os/gold coast cymbidium show',
        'gold coast cymbidium society outreach': 'gold coast cymbidium society outreach'
    };
    
    for (const [pattern, standard] of Object.entries(normalizations)) {
        if (normalized.includes(pattern) || pattern.includes(normalized)) {
            return standard;
        }
    }
    
    return normalized;
}

function checkLocationConflicts(jsonAnalysis, indexLocations) {
    const conflicts = [];
    
    for (const analysis of jsonAnalysis) {
        const awardNum = analysis.awardNum;
        const jsonLocation = normalizeLocation(analysis.location);
        const indexLocation = normalizeLocation(indexLocations[awardNum]);
        
        if (indexLocation && jsonLocation && jsonLocation !== indexLocation) {
            conflicts.push({
                awardNum,
                plantName: analysis.plantName,
                jsonLocation: analysis.location,
                indexLocation: indexLocations[awardNum],
                normalizedJsonLocation: jsonLocation,
                normalizedIndexLocation: indexLocation
            });
        }
    }
    
    return conflicts;
}

function populateLocationsFromIndex(jsonAnalysis, indexLocations) {
    let populatedCount = 0;
    let conflictCount = 0;
    
    for (const analysis of jsonAnalysis) {
        const awardNum = analysis.awardNum;
        const indexLocation = indexLocations[awardNum];
        
        if (indexLocation) {
            if (!analysis.location || analysis.location.trim() === '') {
                // Populate empty location
                analysis.location = indexLocation;
                populatedCount++;
            } else {
                // Check for conflicts
                const jsonNormalized = normalizeLocation(analysis.location);
                const indexNormalized = normalizeLocation(indexLocation);
                
                if (jsonNormalized !== indexNormalized) {
                    // Use index location as authoritative
                    analysis.originalLocation = analysis.location;
                    analysis.location = indexLocation;
                    analysis.locationConflictResolved = true;
                    conflictCount++;
                }
            }
        }
    }
    
    return { populatedCount, conflictCount };
}

function analyze2024Data() {
    console.log('Starting comprehensive analysis of 2024 data completeness...');
    
    // Get all JSON files
    const jsonFiles = fs.readdirSync(jsonDirectory)
        .filter(file => file.endsWith('.json'))
        .sort();
    
    console.log(`Found ${jsonFiles.length} JSON files to analyze`);
    
    // Extract location data from index page
    const indexLocations = extractLocationFromIndexPage();
    
    // Analyze each JSON file
    const jsonAnalysis = [];
    const locationStats = {};
    const measurementStats = {};
    
    for (const file of jsonFiles) {
        const filePath = path.join(jsonDirectory, file);
        const analysis = analyzeJsonFile(filePath);
        
        if (analysis) {
            jsonAnalysis.push(analysis);
            
            // Track location statistics
            if (analysis.location) {
                const normalized = normalizeLocation(analysis.location);
                locationStats[normalized] = (locationStats[normalized] || 0) + 1;
            }
            
            // Track measurement statistics
            if (analysis.measurementType) {
                measurementStats[analysis.measurementType] = (measurementStats[analysis.measurementType] || 0) + 1;
            }
        }
    }
    
    console.log('Checking for location conflicts...');
    const locationConflicts = checkLocationConflicts(jsonAnalysis, indexLocations);
    
    console.log('Populating missing locations from index page...');
    const { populatedCount, conflictCount } = populateLocationsFromIndex(jsonAnalysis, indexLocations);
    
    // Categorize issues
    const completeFiles = jsonAnalysis.filter(a => 
        a.hasAllCoreData && 
        a.nullFields.length === 0 && 
        a.emptyStringFields.length === 0 &&
        a.hasMeasurements
    );
    
    const validCoreDataFiles = jsonAnalysis.filter(a => 
        a.hasAllCoreData && 
        !a.nullFields.some(field => ['award', 'awardpoints', 'genus', 'species', 'exhibitor'].includes(field))
    );
    
    const filesWithNullValues = jsonAnalysis.filter(a => a.nullFields.length > 0);
    const filesWithEmptyStrings = jsonAnalysis.filter(a => a.emptyStringFields.length > 0);
    const filesWithMissingCoreData = jsonAnalysis.filter(a => !a.hasAllCoreData);
    const filesWithMissingMeasurements = jsonAnalysis.filter(a => !a.hasMeasurements);
    const filesWithIncompleteSpecies = jsonAnalysis.filter(a => 
        !a.genus || !a.species || 
        a.genus === 'Unknown' || a.species === 'Unknown'
    );
    
    // Find files with many null values (potential author errors)
    const authorErrorFiles = jsonAnalysis.filter(a => a.nullFields.length >= 5);
    
    // Count missing measurement fields
    const measurementFieldCounts = {};
    for (const analysis of jsonAnalysis) {
        for (const field of analysis.nullFields) {
            if (field.startsWith('measurements.')) {
                const fieldName = field.replace('measurements.', '');
                measurementFieldCounts[fieldName] = (measurementFieldCounts[fieldName] || 0) + 1;
            }
        }
    }
    
    const report = {
        timestamp: new Date().toISOString(),
        analysisVersion: "2.0",
        summary: {
            totalJsonFiles: jsonFiles.length,
            completeFiles: completeFiles.length,
            filesWithMissingCoreData: filesWithMissingCoreData.length,
            filesWithNullValues: filesWithNullValues.length,
            filesWithEmptyStrings: filesWithEmptyStrings.length,
            filesWithMissingMeasurements: filesWithMissingMeasurements.length,
            filesWithIncompleteSpecies: filesWithIncompleteSpecies.length,
            validFiles: validCoreDataFiles.length,
            authorErrorFiles: authorErrorFiles.length,
            locationConflicts: locationConflicts.length,
            locationsPopulated: populatedCount,
            conflictsResolved: conflictCount
        },
        details: {
            completeFiles: completeFiles.map(a => `${a.awardNum}.json`),
            filesWithMissingCoreData: filesWithMissingCoreData.map(a => ({
                file: `${a.awardNum}.json`,
                awardNum: a.awardNum,
                plantName: a.plantName,
                exhibitor: a.exhibitor,
                missingFields: a.missingFields,
                nullFields: a.nullFields,
                emptyStringFields: a.emptyStringFields
            })),
            filesWithNullValues: filesWithNullValues.map(a => ({
                file: `${a.awardNum}.json`,
                awardNum: a.awardNum,
                plantName: a.plantName,
                exhibitor: a.exhibitor,
                nullFields: a.nullFields,
                nullCount: a.nullFields.length
            })),
            authorErrorFiles: authorErrorFiles.map(a => ({
                file: `${a.awardNum}.json`,
                awardNum: a.awardNum,
                plantName: a.plantName,
                exhibitor: a.exhibitor,
                nullFields: a.nullFields,
                nullCount: a.nullFields.length,
                severity: a.nullFields.length >= 15 ? "Critical" : a.nullFields.length >= 10 ? "High" : "Medium"
            })),
            locationConflicts: locationConflicts,
            locationStats: Object.entries(locationStats)
                .sort(([,a], [,b]) => b - a)
                .reduce((obj, [key, value]) => {
                    obj[key] = value;
                    return obj;
                }, {}),
            measurementStats: measurementStats,
            measurementFieldCounts: Object.entries(measurementFieldCounts)
                .sort(([,a], [,b]) => b - a)
                .reduce((obj, [key, value]) => {
                    obj[key] = value;
                    return obj;
                }, {})
        }
    };
    
    // Write the report
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('Analysis complete! Report written to:', reportPath);
    
    // Console summary
    console.log('\n' + '='.repeat(70));
    console.log('2024 PCJC AWARDS DATA - COMPREHENSIVE ANALYSIS REPORT');
    console.log('='.repeat(70));
    console.log('📊 OVERVIEW:');
    console.log(`   Total files analyzed: ${jsonFiles.length}`);
    console.log(`   Complete files (100%): ${completeFiles.length}`);
    console.log(`   Valid files (core data complete): ${validCoreDataFiles.length}`);
    console.log('');
    console.log('🔍 DATA QUALITY ISSUES:');
    console.log(`   Files with missing core data: ${filesWithMissingCoreData.length}`);
    console.log(`   Files with null values: ${filesWithNullValues.length}`);
    console.log(`   Files with empty strings: ${filesWithEmptyStrings.length}`);
    console.log(`   Files with missing measurements: ${filesWithMissingMeasurements.length}`);
    console.log(`   Files with incomplete genus/species: ${filesWithIncompleteSpecies.length}`);
    console.log(`   Author error files (5+ nulls): ${authorErrorFiles.length}`);
    console.log('');
    console.log('📍 LOCATION DATA:');
    console.log(`   Unique locations found: ${Object.keys(locationStats).length}`);
    
    // Show top locations
    const topLocations = Object.entries(locationStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    for (const [location, count] of topLocations) {
        console.log(`   "${location}": ${count} awards`);
    }
    
    console.log(`   Location conflicts found: ${locationConflicts.length}`);
    console.log(`   Locations populated from index: ${populatedCount}`);
    console.log(`   Conflicts resolved: ${conflictCount}`);
    console.log('');
    console.log('🔬 MEASUREMENT DATA:');
    console.log(`   Measurement types found: ${Object.keys(measurementStats).length}`);
    
    for (const [type, count] of Object.entries(measurementStats)) {
        console.log(`   "${type}": ${count} records`);
    }
    
    if (Object.keys(measurementFieldCounts).length > 0) {
        console.log('');
        console.log('   Most commonly missing measurement fields:');
        const topMissing = Object.entries(measurementFieldCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        for (const [field, count] of topMissing) {
            console.log(`     ${field}: missing in ${count} files`);
        }
    }
    
    console.log('');
    console.log('📈 COMPLETION RATE:');
    const completionRate = (completeFiles.length / jsonFiles.length * 100).toFixed(1);
    const validityRate = (validCoreDataFiles.length / jsonFiles.length * 100).toFixed(1);
    console.log(`   Fully complete: ${completionRate}%`);
    console.log(`   Core data valid: ${validityRate}%`);
    console.log('='.repeat(70));
    
    return report;
}

// Run the analysis
analyze2024Data();