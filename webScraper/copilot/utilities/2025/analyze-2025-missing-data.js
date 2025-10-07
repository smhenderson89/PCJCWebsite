const fs = require('fs');
const path = require('path');

const jsonDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2025/json';
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

function analyzeJsonFiles() {
    console.log('Starting analysis of 2025 JSON files...');
    
    let files = [];
    try {
        files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
    } catch (error) {
        console.error('Error reading directory:', error);
        return;
    }

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalJsonFiles: files.length,
            filesWithMissingData: 0,
            emptyFiles: 0,
            filesWithNullValues: 0,
            filesWithMissingMeasurements: 0,
            validFiles: 0
        },
        details: {
            emptyFiles: [],
            filesWithMissingData: [],
            filesWithNullValues: [],
            filesWithMissingMeasurements: [],
            missingFields: {}
        }
    };

    files.forEach(file => {
        const filePath = path.join(jsonDir, file);
        
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
                report.details.emptyFiles.push(file); // Treat invalid JSON as empty
                report.summary.emptyFiles++;
                return;
            }

            let hasMissingData = false;
            let hasNullValues = false;
            let hasMissingMeasurements = false;
            const missingFields = [];

            // Check required fields
            requiredFields.forEach(field => {
                if (!(field in data)) {
                    missingFields.push(field);
                    hasMissingData = true;
                } else if (data[field] === null || data[field] === undefined) {
                    hasNullValues = true;
                } else if (typeof data[field] === 'string' && data[field].trim() === '') {
                    hasNullValues = true;
                }
            });

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

            if (!hasMissingData && !hasNullValues && !hasMissingMeasurements) {
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
        console.log('\n=== ANALYSIS SUMMARY ===');
        console.log(`Total files analyzed: ${report.summary.totalJsonFiles}`);
        console.log(`Valid files: ${report.summary.validFiles}`);
        console.log(`Empty files: ${report.summary.emptyFiles}`);
        console.log(`Files with missing data: ${report.summary.filesWithMissingData}`);
        console.log(`Files with null values: ${report.summary.filesWithNullValues}`);
        console.log(`Files with missing measurements: ${report.summary.filesWithMissingMeasurements}`);
        
        if (report.details.emptyFiles.length > 0) {
            console.log('\nEmpty files:', report.details.emptyFiles.join(', '));
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