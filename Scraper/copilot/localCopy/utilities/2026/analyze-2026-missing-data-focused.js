const fs = require('fs');
const path = require('path');

const jsonDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2026/data/json';

console.log('🔍 2026 AWARDS - MISSING DATA ONLY ANALYSIS');
console.log('='.repeat(80));

// Define required fields and their importance
const requiredFields = {
    critical: ['awardNum', 'award', 'awardpoints', 'date', 'location', 'genus', 'species', 'exhibitor'],
    important: ['photographer', 'cross'],
    optional: ['clone']
};

const requiredMeasurements = {
    critical: ['type', 'description'],
    important: ['numFlowers', 'numBuds', 'numInflorescences'],
    measurementFields: ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'LIPL']
};

function categorizeIssues(data, awardNum) {
    const issues = {
        awardNum,
        filename: `${awardNum}.json`,
        plant: `${data.genus || 'Unknown'} ${data.species || 'Unknown'} ${data.clone ? `'${data.clone}'` : ''}`.trim(),
        exhibitor: data.exhibitor || 'Unknown',
        award: `${data.award || 'Missing'} ${data.awardpoints || ''}`.trim(),
        sourceUrl: data.sourceUrl || 'N/A',
        htmlReference: data.htmlReference || 'N/A',
        severity: 'none',
        issues: [],
        missingFields: []
    };
    
    // Check critical fields
    const criticalMissing = [];
    requiredFields.critical.forEach(field => {
        if (!data[field] || data[field] === '' || data[field] === null) {
            criticalMissing.push(field);
        }
    });
    
    if (criticalMissing.length > 0) {
        issues.severity = 'critical';
        issues.issues.push(`Missing critical: ${criticalMissing.join(', ')}`);
        issues.missingFields = criticalMissing;
        return issues;
    }
    
    // Check important fields
    const importantMissing = [];
    requiredFields.important.forEach(field => {
        // For display/special awards (SC, ST, AQ, JC), "N/A" is acceptable for cross field
        const isDisplayAward = ['SC', 'ST', 'AQ', 'JC'].includes(data.award);
        const isAcceptableNA = isDisplayAward && field === 'cross' && data[field] === 'N/A';
        
        if (!data[field] || data[field] === '' || data[field] === null) {
            importantMissing.push(field);
        } else if (data[field] === 'N/A' && !isAcceptableNA) {
            importantMissing.push(field);
        }
    });
    
    if (importantMissing.length > 0) {
        issues.severity = 'important';
        issues.issues.push(`Missing important: ${importantMissing.join(', ')}`);
        issues.missingFields = importantMissing;
        return issues;
    }
    
    // Check measurements
    if (!data.measurements) {
        issues.severity = 'measurements';
        issues.issues.push('No measurements object');
        issues.missingFields = ['measurements_object'];
        return issues;
    }
    
    const measurementMissing = [];
    
    // Check critical measurement fields
    requiredMeasurements.critical.forEach(field => {
        if (!data.measurements[field] || data.measurements[field] === '' || data.measurements[field] === null) {
            measurementMissing.push(field);
        }
    });
    
    // Check if we have measurement data (but allow N/A for display/special awards)
    const isDisplayOrSpecialAward = ['SC', 'ST', 'AQ', 'JC', 'CBR', 'CHM'].includes(data.award);
    
    const hasAnyMeasurements = requiredMeasurements.measurementFields.some(field => 
        data.measurements[field] !== undefined && data.measurements[field] !== null && 
        data.measurements[field] !== '' && !isNaN(data.measurements[field])
    );
    
    const hasAcceptableNAMeasurements = isDisplayOrSpecialAward && 
        requiredMeasurements.measurementFields.some(field => 
            data.measurements[field] === 'N/A'
        );
    
    if (!hasAnyMeasurements && !hasAcceptableNAMeasurements) {
        measurementMissing.push('no_measurement_data');
    }
    
    if (measurementMissing.length > 0) {
        if (measurementMissing.includes('description') && measurementMissing.length === 1) {
            issues.severity = 'description';
            issues.issues.push('Missing description only');
            issues.missingFields = ['description'];
        } else {
            issues.severity = 'measurements';
            issues.issues.push(`Missing measurements: ${measurementMissing.join(', ')}`);
            issues.missingFields = measurementMissing;
        }
        return issues;
    }
    
    // If we get here, the file is complete
    issues.severity = 'none';
    return issues;
}

function analyzeOnlyProblematicFiles() {
    const files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
    
    const problematicFiles = {
        critical: [],
        important: [],
        measurements: [],
        descriptionOnly: []
    };
    
    let totalPerfect = 0;
    
    console.log(`📊 Analyzing ${files.length} JSON files for missing data...\n`);
    
    files.forEach(filename => {
        const filePath = path.join(jsonDir, filename);
        const awardNum = path.basename(filename, '.json');
        
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const issues = categorizeIssues(data, awardNum);
            
            if (issues.severity === 'none') {
                totalPerfect++;
            } else {
                switch (issues.severity) {
                    case 'critical':
                        problematicFiles.critical.push(issues);
                        break;
                    case 'important':
                        problematicFiles.important.push(issues);
                        break;
                    case 'measurements':
                        problematicFiles.measurements.push(issues);
                        break;
                    case 'description':
                        problematicFiles.descriptionOnly.push(issues);
                        break;
                }
            }
            
        } catch (error) {
            console.log(`❌ Error reading ${filename}: ${error.message}`);
            problematicFiles.critical.push({
                awardNum,
                filename,
                severity: 'critical',
                issues: ['File parsing error'],
                plant: 'Unknown',
                exhibitor: 'Unknown',
                award: 'Unknown'
            });
        }
    });
    
    return {
        total: files.length,
        perfect: totalPerfect,
        problematic: problematicFiles
    };
}

function displayResults(analysis) {
    const totalProblematic = analysis.problematic.critical.length + 
                            analysis.problematic.important.length + 
                            analysis.problematic.measurements.length + 
                            analysis.problematic.descriptionOnly.length;
    
    console.log('📈 SUMMARY:');
    console.log(`   Total Files: ${analysis.total}`);
    console.log(`   Perfect Files: ${analysis.perfect} (${(analysis.perfect/analysis.total*100).toFixed(1)}%)`);
    console.log(`   Files with Missing Data: ${totalProblematic} (${(totalProblematic/analysis.total*100).toFixed(1)}%)`);
    
    console.log(`\n🚨 BREAKDOWN OF MISSING DATA:`);
    console.log(`   Critical Issues: ${analysis.problematic.critical.length}`);
    console.log(`   Important Missing: ${analysis.problematic.important.length}`);
    console.log(`   Measurement Issues: ${analysis.problematic.measurements.length}`);
    console.log(`   Description Only: ${analysis.problematic.descriptionOnly.length}`);
    
    // Display critical issues
    if (analysis.problematic.critical.length > 0) {
        console.log(`\n🚨 CRITICAL MISSING DATA (${analysis.problematic.critical.length}):`);
        analysis.problematic.critical.forEach((issue, i) => {
            console.log(`\n${i + 1}. ${issue.awardNum} - ${issue.plant}`);
            console.log(`   Award: ${issue.award}`);
            console.log(`   Exhibitor: ${issue.exhibitor}`);
            console.log(`   Missing: ${issue.missingFields.join(', ')}`);
            console.log(`   Source: ${issue.sourceUrl}`);
            console.log(`   Local HTML: ${issue.htmlReference}`);
        });
    }
    
    // Display important missing data
    if (analysis.problematic.important.length > 0) {
        console.log(`\n⚠️  IMPORTANT MISSING DATA (${analysis.problematic.important.length}):`);
        analysis.problematic.important.forEach((issue, i) => {
            console.log(`\n${i + 1}. ${issue.awardNum} - ${issue.plant}`);
            console.log(`   Award: ${issue.award}`);
            console.log(`   Exhibitor: ${issue.exhibitor}`);
            console.log(`   Missing: ${issue.missingFields.join(', ')}`);
            console.log(`   Source: ${issue.sourceUrl}`);
            console.log(`   Local HTML: ${issue.htmlReference}`);
        });
    }
    
    // Display measurement issues
    if (analysis.problematic.measurements.length > 0) {
        console.log(`\n📏 MEASUREMENT ISSUES (${analysis.problematic.measurements.length}):`);
        analysis.problematic.measurements.forEach((issue, i) => {
            console.log(`\n${i + 1}. ${issue.awardNum} - ${issue.plant}`);
            console.log(`   Award: ${issue.award}`);
            console.log(`   Exhibitor: ${issue.exhibitor}`);
            console.log(`   Missing: ${issue.missingFields.join(', ')}`);
            console.log(`   Source: ${issue.sourceUrl}`);
            console.log(`   Local HTML: ${issue.htmlReference}`);
        });
    }
    
    // Display description-only issues
    if (analysis.problematic.descriptionOnly.length > 0) {
        console.log(`\n📝 DESCRIPTION MISSING ONLY (${analysis.problematic.descriptionOnly.length}):`);
        analysis.problematic.descriptionOnly.forEach((issue, i) => {
            console.log(`\n${i + 1}. ${issue.awardNum} - ${issue.plant}`);
            console.log(`   Award: ${issue.award}`);
            console.log(`   Source: ${issue.sourceUrl}`);
        });
    }
    
    // Save focused report
    const reportPath = path.join(jsonDir, '../2026-missing-data-focused-report.json');
    const report = {
        timestamp: new Date().toISOString(),
        purpose: "Focused analysis showing only 2026 awards with missing data",
        summary: {
            totalFiles: analysis.total,
            perfectFiles: analysis.perfect,
            filesWithMissingData: totalProblematic,
            completionRate: `${(analysis.perfect/analysis.total*100).toFixed(1)}%`
        },
        missingDataBreakdown: {
            critical: analysis.problematic.critical.length,
            important: analysis.problematic.important.length,
            measurements: analysis.problematic.measurements.length,
            descriptionOnly: analysis.problematic.descriptionOnly.length
        },
        problematicFiles: analysis.problematic
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 Focused report saved: 2026-missing-data-focused-report.json`);
    
    if (totalProblematic === 0) {
        console.log(`\n🎉 ALL FILES ARE PERFECT! No missing data found.`);
    } else {
        console.log(`\n💡 Focus on fixing the ${analysis.problematic.critical.length} critical issues first,`);
        console.log(`   then address the ${analysis.problematic.important.length} important missing fields.`);
    }
}

// Run the focused analysis
const analysis = analyzeOnlyProblematicFiles();
displayResults(analysis);