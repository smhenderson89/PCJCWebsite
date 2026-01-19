/**
 * 2019 Master Data Check Script
 * Comprehensive verification of 2019 orchid awards data
 * Checks measurement types, missing data, and data integrity
 */

const fs = require('fs');
const path = require('path');

// Path to the 2019 JSON data directory
const jsonDataPath = path.join(__dirname, '../../paccentraljc.org/awards/2019/data/json');

/**
 * Check if a JSON object contains synsepal and pouch measurements
 * @param {Object} data - The JSON data object
 * @returns {boolean} - True if contains SYNSW, SYNSL, PCHW, PCHL measurements
 */
function hasSynsepalPouchMeasurements(data) {
    if (!data.measurements) return false;
    
    const measurements = data.measurements;
    return measurements.hasOwnProperty('SYNSW') && 
           measurements.hasOwnProperty('SYNSL') && 
           measurements.hasOwnProperty('PCHW') && 
           measurements.hasOwnProperty('PCHL');
}

/**
 * Check if an award is a display or special award
 * @param {Object} data - The JSON data object
 * @returns {boolean} - True if this is a display or special award
 */
function checkIsDisplayAward(data) {
    // Check genus for display indicators
    if (data.genus) {
        const genus = data.genus.toLowerCase();
        if (genus === "display" || genus.includes("display")) {
            return true;
        }
    }
    
    // Check award type for specific display awards
    if (data.award) {
        const award = data.award.toLowerCase();
        // Specific display award types: ST (Show Trophy), SC (Silver Certificate), 
        // GC (Gold Certificate), EEC (Exhibitors Excellence Certificate), AQ (Award of Quality for groups)
        if (award === "st" || award === "sc" || award === "gc" || award === "eec" || 
            award === "aq" || award.includes("trophy") || award.includes("certificate")) {
            return true;
        }
    }
    
    // Check species for display indicators
    if (data.species) {
        const species = data.species.toLowerCase();
        if (species === "display") {
            return true;
        }
    }
    
    // Check description for specific display indicators (standalone word "display", not "displayed")
    if (data.measurements && data.measurements.description) {
        const description = data.measurements.description.toLowerCase();
        // Use word boundaries to match standalone "display" only
        if (/\bdisplay\b/.test(description) || 
            description.includes("group of") || 
            description.includes("plants representing")) {
            return true;
        }
    }
    
    return false;
}

/**
 * Check if measurement type matches actual measurements
 * @param {Object} data - The JSON data object
 * @returns {Object} - Analysis of measurement type accuracy
 */
function analyzeMeasurementType(data) {
    const result = {
        currentType: data.measurements?.type || 'N/A',
        hasPouch: hasSynsepalPouchMeasurements(data),
        isDisplay: false,
        expectedType: 'Unknown',
        isCorrect: false,
        issues: []
    };

    if (!data.measurements) {
        result.issues.push('No measurements object');
        return result;
    }

    // Check if this is a display/special award
    result.isDisplay = checkIsDisplayAward(data);

    // Determine expected type based on the three valid categories
    if (result.isDisplay) {
        result.expectedType = 'Other';
    } else if (result.hasPouch) {
        result.expectedType = 'Pouch&SynselPal';
    } else {
        // All other regular awards should be Lip&LateralSepal
        result.expectedType = 'Lip&LateralSepal';
    }

    // Check if current type matches expected
    result.isCorrect = result.currentType === result.expectedType;
    
    if (!result.isCorrect) {
        result.issues.push(`Type mismatch: has '${result.currentType}', should be '${result.expectedType}'`);
    }

    return result;
}

/**
 * Check for missing critical data fields
 * @param {Object} data - The JSON data object
 * @returns {Array} - Array of missing or invalid fields
 */
function checkMissingData(data) {
    const issues = [];
    
    // Check if this is a display award
    const isDisplay = checkIsDisplayAward(data);
    
    // Critical fields that should always be present
    const criticalFields = ['awardNum', 'award', 'date', 'location', 'genus', 'exhibitor'];
    
    // For non-display awards, species should be present
    if (!isDisplay) {
        criticalFields.push('species');
    }
    
    criticalFields.forEach(field => {
        if (!data[field] || data[field] === '') {
            issues.push(`Missing or invalid ${field}`);
        }
    });

    // For display awards, species can be "N/A" - that's acceptable
    if (isDisplay && (!data.species || data.species === '')) {
        // Only flag if completely missing, not if set to "N/A"
        if (!data.species) {
            issues.push('Missing species field');
        }
    }

    // Check measurements object
    if (!data.measurements) {
        issues.push('Missing measurements object');
    } else {
        // Check for description
        if (!data.measurements.description || data.measurements.description === '') {
            issues.push('Missing description');
        }
        
        // Check for measurement type
        if (!data.measurements.type || data.measurements.type === '') {
            issues.push('Missing measurement type');
        }
        
        // Check for flower counts
        if (data.measurements.numFlowers === undefined) {
            issues.push('Missing numFlowers');
        }
    }

    return issues;
}

/**
 * Analyze a single JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Object} - Analysis results
 */
function analyzeFile(filePath) {
    try {
        const jsonContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(jsonContent);
        const fileName = path.basename(filePath);
        
        const typeAnalysis = analyzeMeasurementType(data);
        const missingData = checkMissingData(data);
        
        return {
            fileName,
            awardNum: data.awardNum,
            award: data.award,
            genus: data.genus,
            species: data.species,
            typeAnalysis,
            missingData,
            hasIssues: !typeAnalysis.isCorrect || missingData.length > 0,
            rawData: data
        };
        
    } catch (error) {
        return {
            fileName: path.basename(filePath),
            error: error.message,
            hasIssues: true
        };
    }
}

/**
 * Main verification function
 */
function runMasterCheck() {
    console.log('🔍 2019 MASTER DATA CHECK');
    console.log('=' .repeat(60));
    
    if (!fs.existsSync(jsonDataPath)) {
        console.error(`❌ JSON directory not found: ${jsonDataPath}`);
        return;
    }

    const jsonFiles = fs.readdirSync(jsonDataPath)
        .filter(file => file.endsWith('.json'))
        .sort();

    if (jsonFiles.length === 0) {
        console.error('❌ No JSON files found');
        return;
    }

    console.log(`📋 Found ${jsonFiles.length} JSON files to analyze\n`);

    const results = {
        totalFiles: jsonFiles.length,
        processedFiles: 0,
        filesWithIssues: 0,
        measurementTypeIssues: 0,
        missingDataIssues: 0,
        parsingErrors: 0,
        typeDistribution: {
            'Pouch&SynselPal': 0,
            'Lip&LateralSepal': 0,
            'Other': 0,
            'Unknown': 0
        },
        issueFiles: [],
        summary: {
            correctTypes: 0,
            incorrectTypes: 0
        }
    };

    // Analyze each file
    jsonFiles.forEach((file, index) => {
        const filePath = path.join(jsonDataPath, file);
        console.log(`📄 [${index + 1}/${jsonFiles.length}] Analyzing ${file}...`);
        
        const analysis = analyzeFile(filePath);
        results.processedFiles++;
        
        if (analysis.error) {
            console.log(`   ❌ Parse error: ${analysis.error}`);
            results.parsingErrors++;
            results.filesWithIssues++;
            results.issueFiles.push({
                file,
                type: 'parse-error',
                error: analysis.error
            });
            return;
        }

        // Track measurement type distribution
        const currentType = analysis.typeAnalysis.currentType;
        if (results.typeDistribution.hasOwnProperty(currentType)) {
            results.typeDistribution[currentType]++;
        } else {
            results.typeDistribution['Unknown']++;
        }

        // Check for issues
        if (analysis.hasIssues) {
            results.filesWithIssues++;
            
            if (!analysis.typeAnalysis.isCorrect) {
                results.measurementTypeIssues++;
                results.summary.incorrectTypes++;
                console.log(`   ⚠️  Type issue: ${analysis.typeAnalysis.issues.join(', ')}`);
            } else {
                results.summary.correctTypes++;
            }
            
            if (analysis.missingData.length > 0) {
                results.missingDataIssues++;
                console.log(`   ⚠️  Missing data: ${analysis.missingData.join(', ')}`);
            }
            
            results.issueFiles.push({
                file,
                awardNum: analysis.awardNum,
                award: analysis.award,
                plant: `${analysis.genus} ${analysis.species}`,
                typeIssues: analysis.typeAnalysis.issues,
                missingData: analysis.missingData
            });
        } else {
            results.summary.correctTypes++;
            console.log(`   ✅ All checks passed`);
        }
    });

    // Print comprehensive summary
    printSummary(results);
    
    // Save detailed report
    const reportPath = path.join(__dirname, '2019-master-check-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📊 Detailed report saved: ${path.basename(reportPath)}`);
}

/**
 * Print comprehensive summary
 * @param {Object} results - Analysis results
 */
function printSummary(results) {
    console.log('\n' + '=' .repeat(80));
    console.log('📊 2019 DATA VERIFICATION SUMMARY');
    console.log('=' .repeat(80));
    
    console.log(`\n📈 PROCESSING STATS:`);
    console.log(`   Total files: ${results.totalFiles}`);
    console.log(`   Processed successfully: ${results.processedFiles - results.parsingErrors}`);
    console.log(`   Parse errors: ${results.parsingErrors}`);
    console.log(`   Files with issues: ${results.filesWithIssues}`);
    console.log(`   Clean files: ${results.processedFiles - results.filesWithIssues}`);
    
    console.log(`\n📊 MEASUREMENT TYPE DISTRIBUTION:`);
    Object.entries(results.typeDistribution).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
    });
    
    console.log(`\n🎯 ACCURACY STATS:`);
    console.log(`   Correct measurement types: ${results.summary.correctTypes}`);
    console.log(`   Incorrect measurement types: ${results.summary.incorrectTypes}`);
    console.log(`   Type accuracy: ${((results.summary.correctTypes / results.processedFiles) * 100).toFixed(1)}%`);
    
    console.log(`\n⚠️  ISSUE BREAKDOWN:`);
    console.log(`   Measurement type issues: ${results.measurementTypeIssues}`);
    console.log(`   Missing data issues: ${results.missingDataIssues}`);
    
    // Show problematic files if any
    if (results.issueFiles.length > 0) {
        console.log(`\n🔍 FILES WITH ISSUES:`);
        results.issueFiles.forEach((issue, index) => {
            if (index < 10) { // Show first 10 for readability
                console.log(`   ${issue.file} (${issue.awardNum}): ${issue.plant}`);
                if (issue.typeIssues?.length > 0) {
                    console.log(`      Type: ${issue.typeIssues.join(', ')}`);
                }
                if (issue.missingData?.length > 0) {
                    console.log(`      Missing: ${issue.missingData.join(', ')}`);
                }
            }
        });
        if (results.issueFiles.length > 10) {
            console.log(`   ... and ${results.issueFiles.length - 10} more (see detailed report)`);
        }
    }
    
    console.log('\n' + '=' .repeat(80));
    
    if (results.filesWithIssues === 0) {
        console.log('🎉 ALL DATA CHECKS PASSED! The 2019 dataset is clean and properly categorized.');
    } else {
        console.log(`⚠️  ${results.filesWithIssues} files have issues that should be reviewed.`);
    }
    
    console.log('=' .repeat(80));
}

// Run the master check
if (require.main === module) {
    runMasterCheck();
}

module.exports = {
    runMasterCheck,
    analyzeFile,
    analyzeMeasurementType,
    checkMissingData
};