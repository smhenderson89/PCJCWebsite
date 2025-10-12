const fs = require('fs');
const path = require('path');

const dataDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2025/data/json';

console.log('='.repeat(80));
console.log('FRESH 2025 MISSING DATA ANALYSIS');
console.log('='.repeat(80));

// Core required fields that should not be null/empty
const requiredCoreFields = [
    'awardNum', 'genus', 'species', 'exhibitor', 'award', 'awardpoints', 
    'date', 'location', 'sourceUrl'
];

// Optional fields that can be null/empty without being critical
const optionalFields = [
    'clone', 'cross', 'photographer', 'photo'
];

// Measurement fields (within measurements object)
const measurementFields = [
    'type', 'description', 'numFlowers', 'numBuds', 'numInflorescences'
];

const analysis = {
    timestamp: new Date().toISOString(),
    purpose: "Fresh analysis of 2025 data to identify actual missing/null values after all fixes",
    summary: {
        totalFiles: 0,
        completeFiles: 0,
        filesWithMissingCore: 0,
        filesWithNullValues: 0,
        filesWithMissingMeasurements: 0
    },
    detailedIssues: {
        missingCoreData: [],
        nullValues: [],
        missingMeasurements: [],
        completeFiles: []
    }
};

// Get all JSON files
const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
analysis.summary.totalFiles = files.length;

console.log(`📊 Analyzing ${files.length} JSON files...`);

files.forEach(filename => {
    const filePath = path.join(dataDir, filename);
    
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const issues = [];
        const nullFields = [];
        const missingMeasurements = [];
        
        // Check core required fields
        requiredCoreFields.forEach(field => {
            const value = data[field];
            if (value === null || value === undefined || value === '') {
                issues.push(`${field}: ${value === null ? 'null' : value === undefined ? 'undefined' : 'empty string'}`);
                nullFields.push(field);
            }
        });
        
        // Check measurements object
        if (!data.measurements) {
            missingMeasurements.push('entire measurements object missing');
        } else {
            measurementFields.forEach(field => {
                const value = data.measurements[field];
                if (value === null || value === undefined || value === '') {
                    missingMeasurements.push(`measurements.${field}: ${value === null ? 'null' : value === undefined ? 'undefined' : 'empty string'}`);
                }
            });
        }
        
        // Categorize this file
        if (issues.length > 0) {
            analysis.detailedIssues.missingCoreData.push({
                fileName: filename,
                awardNum: data.awardNum,
                plantName: `${data.genus || 'Unknown'} ${data.species || ''}`.trim(),
                exhibitor: data.exhibitor || 'Unknown',
                missingFields: nullFields,
                issues: issues,
                priority: issues.length > 2 ? 'HIGH' : 'MEDIUM'
            });
            analysis.summary.filesWithMissingCore++;
        }
        
        if (nullFields.length > 0) {
            analysis.summary.filesWithNullValues++;
        }
        
        if (missingMeasurements.length > 0) {
            analysis.detailedIssues.missingMeasurements.push({
                fileName: filename,
                awardNum: data.awardNum,
                plantName: `${data.genus || 'Unknown'} ${data.species || ''}`.trim(),
                missingMeasurements: missingMeasurements
            });
            analysis.summary.filesWithMissingMeasurements++;
        }
        
        // If no core issues, mark as complete
        if (issues.length === 0) {
            analysis.detailedIssues.completeFiles.push({
                fileName: filename,
                awardNum: data.awardNum,
                plantName: `${data.genus} ${data.species}`,
                exhibitor: data.exhibitor,
                status: 'complete'
            });
            analysis.summary.completeFiles++;
        }
        
    } catch (error) {
        console.log(`❌ Error processing ${filename}: ${error.message}`);
        analysis.detailedIssues.missingCoreData.push({
            fileName: filename,
            error: `File parsing error: ${error.message}`,
            priority: 'HIGH'
        });
    }
});

// Calculate completion rate
const completionRate = ((analysis.summary.completeFiles / analysis.summary.totalFiles) * 100).toFixed(1);

console.log('');
console.log('📈 FRESH ANALYSIS RESULTS:');
console.log(`   Total Files: ${analysis.summary.totalFiles}`);
console.log(`   Complete Files: ${analysis.summary.completeFiles} (${completionRate}%)`);
console.log(`   Files with Missing Core Data: ${analysis.summary.filesWithMissingCore}`);
console.log(`   Files with Null Values: ${analysis.summary.filesWithNullValues}`);
console.log(`   Files with Missing Measurements: ${analysis.summary.filesWithMissingMeasurements}`);

// Save fresh analysis
const outputPath = path.join('/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2025/data', 'FRESH-2025-MISSING-DATA-ANALYSIS.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

console.log('');
console.log(`✅ Fresh analysis saved to: FRESH-2025-MISSING-DATA-ANALYSIS.json`);

// Show examples of issues found
if (analysis.detailedIssues.missingCoreData.length > 0) {
    console.log('');
    console.log('🚨 ACTUAL MISSING CORE DATA FOUND:');
    analysis.detailedIssues.missingCoreData.slice(0, 5).forEach(item => {
        console.log(`   • ${item.fileName}: ${item.issues.join(', ')}`);
    });
    if (analysis.detailedIssues.missingCoreData.length > 5) {
        console.log(`   ... and ${analysis.detailedIssues.missingCoreData.length - 5} more files with issues`);
    }
} else {
    console.log('');
    console.log('🎉 NO MISSING CORE DATA FOUND! All files appear to have complete core information.');
}

// Quick check on the specific file mentioned
console.log('');
console.log('🔍 SPOT CHECK - 20255304.json:');
try {
    const spotCheckPath = path.join(dataDir, '20255304.json');
    const spotCheckData = JSON.parse(fs.readFileSync(spotCheckPath, 'utf-8'));
    console.log(`   Award: ${spotCheckData.award || 'MISSING'}`);
    console.log(`   Award Points: ${spotCheckData.awardpoints || 'MISSING'}`);
    console.log(`   Exhibitor: ${spotCheckData.exhibitor || 'MISSING'}`);
    console.log(`   Genus/Species: ${spotCheckData.genus || 'MISSING'} ${spotCheckData.species || 'MISSING'}`);
    console.log(`   Status: ${spotCheckData.award && spotCheckData.awardpoints ? '✅ COMPLETE' : '❌ MISSING DATA'}`);
} catch (error) {
    console.log(`   ❌ Could not read 20255304.json: ${error.message}`);
}