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

function extractLocationFromHtml(awardNum) {
    const htmlFilePath = path.join(htmlDir, `${awardNum}.html`);
    
    try {
        if (!fs.existsSync(htmlFilePath)) {
            return null;
        }
        
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        
        // Look for the pattern: Date - Location
        // Example: "January 7, 2025 - San Francisco"
        const dateLocationMatch = htmlContent.match(/([A-Za-z]+ \d+, \d{4}) - ([^<\n\r]+)/);
        
        if (dateLocationMatch && dateLocationMatch[2]) {
            return {
                date: dateLocationMatch[1].trim(),
                location: dateLocationMatch[2].trim()
            };
        }
        
        return null;
    } catch (error) {
        console.error(`Error reading HTML file for ${awardNum}:`, error.message);
        return null;
    }
}

function extractLocationFromIndex() {
    try {
        if (!fs.existsSync(indexPath)) {
            console.error('Index file not found:', indexPath);
            return {};
        }
        
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        const awardLocationMap = {};
        
        // Split content by table rows
        const rows = indexContent.split(/<TR[^>]*>/i);
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            
            // Look for location pattern in the first TD
            const locationMatch = row.match(/<TD[^>]*>.*?([A-Za-z]+ \d+ - [^<]+)/i);
            if (locationMatch) {
                const locationInfo = locationMatch[1].trim();
                
                // Extract all award links in this row
                const awardLinks = row.match(/HREF="[^"]*\/(\d+)\.html"/g);
                
                if (awardLinks) {
                    awardLinks.forEach(link => {
                        const awardNumMatch = link.match(/(\d+)\.html/);
                        if (awardNumMatch) {
                            const awardNum = awardNumMatch[1];
                            awardLocationMap[awardNum] = locationInfo;
                        }
                    });
                }
            }
        }
        
        return awardLocationMap;
    } catch (error) {
        console.error('Error reading index file:', error);
        return {};
    }
}

function analyzeJsonFiles() {
    console.log('Starting comprehensive analysis with conflict detection...');
    
    let files = [];
    try {
        files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
    } catch (error) {
        console.error('Error reading directory:', error);
        return;
    }

    // Get index location data
    console.log('Extracting location data from index page...');
    const indexLocationMap = extractLocationFromIndex();
    console.log(`Found ${Object.keys(indexLocationMap).length} awards in index page`);

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalJsonFiles: files.length,
            filesWithMissingData: 0,
            emptyFiles: 0,
            filesWithNullValues: 0,
            filesWithMissingMeasurements: 0,
            filesWithMissingLocation: 0,
            filesWithExtractableLocation: 0,
            filesWithConflicts: 0,
            validFiles: 0
        },
        details: {
            emptyFiles: [],
            filesWithMissingData: [],
            filesWithNullValues: [],
            filesWithMissingMeasurements: [],
            filesWithMissingLocation: [],
            extractedLocations: {},
            indexLocations: {},
            conflicts: [],
            missingFields: {}
        }
    };

    files.forEach(file => {
        const filePath = path.join(jsonDir, file);
        const awardNum = file.replace('.json', '');
        
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8').trim();
            
            // Check for empty files
            if (!fileContent || fileContent === '{}' || fileContent === '') {
                report.details.emptyFiles.push(file);
                report.summary.emptyFiles++;
                return;
            }

            let data;
            try {
                data = JSON.parse(fileContent);
            } catch (parseError) {
                console.error(`Invalid JSON in ${file}:`, parseError.message);
                report.details.emptyFiles.push(file);
                report.summary.emptyFiles++;
                return;
            }

            let hasMissingData = false;
            let hasNullValues = false;
            let hasMissingMeasurements = false;
            let hasMissingLocation = false;
            const missingFields = [];

            // Check required fields
            requiredFields.forEach(field => {
                if (!(field in data)) {
                    missingFields.push(field);
                    hasMissingData = true;
                } else if (data[field] === null || data[field] === undefined) {
                    hasNullValues = true;
                    if (field === 'location') {
                        hasMissingLocation = true;
                    }
                } else if (typeof data[field] === 'string' && data[field].trim() === '') {
                    hasNullValues = true;
                    if (field === 'location') {
                        hasMissingLocation = true;
                    }
                }
            });

            // Extract locations from both sources
            const htmlLocationData = extractLocationFromHtml(awardNum);
            const indexLocationData = indexLocationMap[awardNum];

            // Store location information
            if (htmlLocationData) {
                report.details.extractedLocations[file] = htmlLocationData.location;
                report.summary.filesWithExtractableLocation++;
            }
            
            if (indexLocationData) {
                report.details.indexLocations[file] = indexLocationData;
            }

            // Check for conflicts
            if (htmlLocationData && indexLocationData) {
                // Compare locations
                const htmlLocation = htmlLocationData.location.toLowerCase().trim();
                const indexLocation = indexLocationData.toLowerCase().trim();
                
                // Extract just the location part from index (after the date)
                const indexLocationMatch = indexLocationData.match(/[A-Za-z]+ \d+ - (.+)/);
                const indexLocationOnly = indexLocationMatch ? indexLocationMatch[1].toLowerCase().trim() : indexLocation;
                
                if (htmlLocation !== indexLocationOnly) {
                    report.details.conflicts.push({
                        file: file,
                        awardNum: awardNum,
                        htmlLocation: htmlLocationData.location,
                        htmlDate: htmlLocationData.date,
                        indexLocation: indexLocationData,
                        indexLocationOnly: indexLocationMatch ? indexLocationMatch[1] : 'Unknown'
                    });
                    report.summary.filesWithConflicts++;
                }
            }

            // Handle missing location
            if (hasMissingLocation && !htmlLocationData) {
                report.details.filesWithMissingLocation.push(file);
                report.summary.filesWithMissingLocation++;
            }

            // Check measurements if it exists
            if (data.measurements && typeof data.measurements === 'object') {
                const missingMeasurementFields = [];
                requiredMeasurementFields.forEach(field => {
                    if (!(field in data.measurements)) {
                        missingMeasurementFields.push(field);
                        hasMissingMeasurements = true;
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
            }

            // Record findings
            if (hasMissingData) {
                report.details.filesWithMissingData.push({
                    file: file,
                    missingFields: missingFields
                });
                report.summary.filesWithMissingData++;
                
                // Track which fields are most commonly missing
                missingFields.forEach(field => {
                    if (!report.details.missingFields[field]) {
                        report.details.missingFields[field] = 0;
                    }
                    report.details.missingFields[field]++;
                });
            }

            if (hasNullValues) {
                report.details.filesWithNullValues.push(file);
                report.summary.filesWithNullValues++;
            }

            if (hasMissingMeasurements) {
                report.details.filesWithMissingMeasurements.push(file);
                report.summary.filesWithMissingMeasurements++;
            }

            // A file is valid if it has no missing data, no conflicts, no null values (except extractable location), and no missing measurements
            const hasConflict = report.details.conflicts.some(c => c.file === file);
            const isLocationFixable = hasMissingLocation && htmlLocationData && !hasConflict;
            if (!hasMissingData && !hasConflict && (!hasNullValues || (hasNullValues && isLocationFixable)) && !hasMissingMeasurements) {
                report.summary.validFiles++;
            }

        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
            report.details.emptyFiles.push(file);
            report.summary.emptyFiles++;
        }
    });

    // Write the report
    try {
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log('Analysis complete! Report written to:', reportPath);
        
        // Print summary to console
        console.log('\n=== COMPREHENSIVE ANALYSIS WITH CONFLICT DETECTION ===');
        console.log(`Total files analyzed: ${report.summary.totalJsonFiles}`);
        console.log(`Valid files: ${report.summary.validFiles}`);
        console.log(`Empty files: ${report.summary.emptyFiles}`);
        console.log(`Files with missing data: ${report.summary.filesWithMissingData}`);
        console.log(`Files with null values: ${report.summary.filesWithNullValues}`);
        console.log(`Files with missing measurements: ${report.summary.filesWithMissingMeasurements}`);
        console.log(`Files with missing location: ${report.summary.filesWithMissingLocation}`);
        console.log(`Files with extractable location: ${report.summary.filesWithExtractableLocation}`);
        console.log(`FILES WITH LOCATION CONFLICTS: ${report.summary.filesWithConflicts}`);
        
        if (report.details.emptyFiles.length > 0) {
            console.log('\nEmpty files:', report.details.emptyFiles.join(', '));
        }
        
        if (report.details.conflicts.length > 0) {
            console.log('\n=== LOCATION CONFLICTS DETECTED ===');
            report.details.conflicts.forEach(conflict => {
                console.log(`\n${conflict.file} (Award ${conflict.awardNum}):`);
                console.log(`  HTML Page: "${conflict.htmlDate} - ${conflict.htmlLocation}"`);
                console.log(`  Index Page: "${conflict.indexLocation}"`);
                console.log(`  Conflict: HTML shows "${conflict.htmlLocation}" but Index shows "${conflict.indexLocationOnly}"`);
            });
        }
        
        if (report.details.filesWithMissingLocation.length > 0) {
            console.log('\nFiles with missing location (no HTML source):', report.details.filesWithMissingLocation.join(', '));
        }
        
        if (Object.keys(report.details.extractedLocations).length > 0) {
            console.log(`\nSample extracted locations (showing first 3):`);
            const samples = Object.entries(report.details.extractedLocations).slice(0, 3);
            samples.forEach(([file, location]) => {
                console.log(`  ${file}: "${location}"`);
            });
        }
        
        if (Object.keys(report.details.missingFields).length > 0) {
            console.log('\nMost commonly missing fields:');
            Object.entries(report.details.missingFields)
                .sort(([,a], [,b]) => b - a)
                .forEach(([field, count]) => {
                    console.log(`  ${field}: ${count} files`);
                });
        }
        
    } catch (error) {
        console.error('Error writing report:', error);
    }
}

analyzeJsonFiles();