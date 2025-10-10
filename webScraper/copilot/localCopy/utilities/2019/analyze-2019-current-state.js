const fs = require('fs');
const path = require('path');

// Paths
const jsonDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2019/data/json');
const outputPath = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2019/data/2019-categorized-issues-updated.json');

console.log('🔍 Analyzing Current State of 2019 Awards Data (existing JSON files)...\n');

// Define critical fields and their importance
const fieldDefinitions = {
    // Critical fields that must be present
    critical: ['awardNum', 'award', 'genus'],
    
    // Important fields for completeness
    important: ['date', 'location', 'species', 'exhibitor'],
    
    // Optional but valuable fields
    optional: ['photographer', 'cross', 'clone', 'awardpoints'],
    
    // Nice to have but not essential
    supplementary: ['photo', 'measurements', 'sourceUrl']
};

function analyzeField(value, fieldName) {
    if (value === null || value === undefined || value === '') {
        return { isEmpty: true, issue: 'missing', value: value };
    }
    
    // Check for placeholder values
    const placeholders = ['N/A', 'n/a', 'unknown', 'TBD', 'tbd', '?', '-'];
    if (typeof value === 'string' && placeholders.includes(value.trim())) {
        return { isEmpty: true, issue: 'placeholder', value: value };
    }
    
    // Special check for measurements - should have actual data
    if (fieldName === 'measurements') {
        if (typeof value === 'object' && value !== null) {
            const keys = Object.keys(value);
            if (keys.length === 0) {
                return { isEmpty: true, issue: 'empty_object', value: '{}' };
            }
            // Check if it has meaningful measurement data
            const meaningfulKeys = keys.filter(k => !['type'].includes(k));
            if (meaningfulKeys.length === 0) {
                return { isEmpty: true, issue: 'no_measurement_data', value: 'type only' };
            }
        }
    }
    
    // Check for obviously malformed data
    if (typeof value === 'string' && value.length > 200) {
        return { isEmpty: false, issue: 'malformed_long', value: value.substring(0, 50) + '...' };
    }
    
    return { isEmpty: false, issue: null, value: value };
}

function categorizeIssues(issues) {
    const criticalCount = issues.filter(i => fieldDefinitions.critical.includes(i.field)).length;
    const importantCount = issues.filter(i => fieldDefinitions.important.includes(i.field)).length;
    
    if (criticalCount > 0) {
        return {
            severity: 'problematic',
            reason: `${criticalCount} critical field(s) missing`
        };
    } else if (importantCount >= 3) {
        return {
            severity: 'recoverable',
            reason: `${importantCount} important fields missing but recoverable`
        };
    } else if (importantCount > 0) {
        return {
            severity: 'minor',
            reason: `${importantCount} important field(s) missing`
        };
    }
    
    return {
        severity: 'perfect',
        reason: 'All critical and important fields present'
    };
}

async function analyzeCurrentState() {
    try {
        const files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
        
        console.log(`📊 Analyzing ${files.length} existing JSON files...\n`);
        
        const results = {
            timestamp: new Date().toISOString(),
            year: "2019",
            analysisVersion: "3.0-post-fixes",
            purpose: "Analyze current state of 2019 data after applying fixes",
            summary: {
                totalFiles: files.length,
                filesWithIssues: 0,
                perfectFiles: 0,
                minorIssues: 0,
                recoverableIssues: 0,
                problematicFiles: 0
            },
            categories: {
                perfect: [],
                minor: [],
                recoverable: [],
                problematic: []
            },
            fieldStats: {}
        };
        
        // Initialize field statistics
        const allFields = [...fieldDefinitions.critical, ...fieldDefinitions.important, 
                          ...fieldDefinitions.optional, ...fieldDefinitions.supplementary];
        
        allFields.forEach(field => {
            results.fieldStats[field] = { present: 0, missing: 0, total: files.length };
        });
        
        for (const file of files) {
            const filePath = path.join(jsonDir, file);
            const awardNum = file.replace('.json', '');
            
            try {
                const awardData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const issues = [];
                
                console.log(`   📄 ${awardNum}: Analyzing...`);
                
                // Check all defined fields
                allFields.forEach(field => {
                    const analysis = analyzeField(awardData[field], field);
                    
                    if (analysis.isEmpty) {
                        // Determine issue type based on field importance
                        let issueType = 'missing_optional';
                        if (fieldDefinitions.critical.includes(field)) {
                            issueType = 'missing_critical';
                        } else if (fieldDefinitions.important.includes(field)) {
                            issueType = 'missing_important';
                        } else if (fieldDefinitions.supplementary.includes(field)) {
                            issueType = 'missing_supplementary';
                        }
                        
                        issues.push({
                            field: field,
                            type: issueType,
                            severity: fieldDefinitions.critical.includes(field) ? 'high' : 
                                    fieldDefinitions.important.includes(field) ? 'medium' : 'low',
                            value: analysis.value,
                            issue: analysis.issue
                        });
                        
                        results.fieldStats[field].missing++;
                    } else {
                        results.fieldStats[field].present++;
                    }
                });
                
                // Categorize based on issues found
                const category = categorizeIssues(issues);
                
                const fileEntry = {
                    awardNum: awardNum,
                    file: file,
                    issues: issues,
                    issueCount: issues.length,
                    severity: category.severity,
                    reason: category.reason
                };
                
                results.categories[category.severity].push(fileEntry);
                
                if (issues.length > 0) {
                    results.summary.filesWithIssues++;
                    
                    if (category.severity === 'problematic') {
                        results.summary.problematicFiles++;
                    } else if (category.severity === 'recoverable') {
                        results.summary.recoverableIssues++;
                    } else if (category.severity === 'minor') {
                        results.summary.minorIssues++;
                    }
                } else {
                    results.summary.perfectFiles++;
                }
                
                console.log(`     Issues found: ${issues.length} (${category.severity})`);
                
            } catch (error) {
                console.log(`     ❌ Error processing ${awardNum}: ${error.message}`);
            }
        }
        
        // Calculate percentages for field stats
        Object.keys(results.fieldStats).forEach(field => {
            const stat = results.fieldStats[field];
            stat.percentage = ((stat.present / stat.total) * 100).toFixed(1);
        });
        
        // Save results
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 2019 CURRENT STATE ANALYSIS SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`\n🎯 FILE STATISTICS:`);
        console.log(`   Total files analyzed: ${results.summary.totalFiles}`);
        console.log(`   Perfect files: ${results.summary.perfectFiles} (${((results.summary.perfectFiles/results.summary.totalFiles)*100).toFixed(1)}%)`);
        console.log(`   Files with issues: ${results.summary.filesWithIssues} (${((results.summary.filesWithIssues/results.summary.totalFiles)*100).toFixed(1)}%)`);
        
        console.log(`\n📋 ISSUES BY SEVERITY:`);
        console.log(`   Problematic: ${results.summary.problematicFiles} (critical fields missing)`);
        console.log(`   Recoverable: ${results.summary.recoverableIssues} (multiple important fields missing)`);
        console.log(`   Minor: ${results.summary.minorIssues} (few important fields missing)`);
        
        console.log(`\n📈 FIELD COMPLETENESS ANALYSIS:`);
        
        console.log(`\n   CRITICAL FIELDS:`);
        fieldDefinitions.critical.forEach(field => {
            const stat = results.fieldStats[field];
            const status = stat.percentage >= 90 ? '✅' : '❌';
            console.log(`     ${status} ${field}: ${stat.percentage}% (${stat.present}/${stat.total})`);
        });
        
        console.log(`\n   IMPORTANT FIELDS:`);
        fieldDefinitions.important.forEach(field => {
            const stat = results.fieldStats[field];
            const status = stat.percentage >= 90 ? '✅' : '❌';
            console.log(`     ${status} ${field}: ${stat.percentage}% (${stat.present}/${stat.total})`);
        });
        
        console.log(`\n   OPTIONAL FIELDS:`);
        fieldDefinitions.optional.forEach(field => {
            const stat = results.fieldStats[field];
            const status = stat.percentage >= 50 ? '✅' : '❌';
            console.log(`     ${status} ${field}: ${stat.percentage}% (${stat.present}/${stat.total})`);
        });
        
        console.log(`\n   SUPPLEMENTARY FIELDS:`);
        fieldDefinitions.supplementary.forEach(field => {
            const stat = results.fieldStats[field];
            const status = stat.percentage >= 90 ? '✅' : '❌';
            console.log(`     ${status} ${field}: ${stat.percentage}% (${stat.present}/${stat.total})`);
        });
        
        console.log(`\n📄 Detailed analysis saved to: ${outputPath}`);
        console.log(`🎉 Current state analysis complete!`);
        
    } catch (error) {
        console.error('❌ Error in analysis process:', error.message);
        process.exit(1);
    }
}

// Run the analysis
analyzeCurrentState();