const fs = require('fs');
const path = require('path');

// Paths
const awardsDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2020/data/json');
const outputPath = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2020/data/2020-categorized-issues.json');

console.log('🔍 Analyzing 2020 Awards Data for Missing Information...\n');

// Define critical fields and their importance
const fieldDefinitions = {
    // Critical fields that must be present
    critical: ['awardNum', 'award', 'genus'],
    
    // Important fields for completeness
    important: ['date', 'location', 'species', 'exhibitor'],
    
    // Optional but valuable fields
    optional: ['photographer', 'cross', 'clone', 'awardpoints'],
    
    // Nice to have but not essential
    supplementary: ['photo', 'measurements', 'sourceURL']
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
    } else {
        return {
            severity: 'minor',
            reason: 'Only optional fields missing'
        };
    }
}

try {
    const files = fs.readdirSync(awardsDir).filter(f => f.endsWith('.json'));
    
    let results = {
        timestamp: new Date().toISOString(),
        year: '2020',
        analysisVersion: '2.0',
        purpose: 'Categorize null/empty field issues by fixability and severity for 2020 data',
        summary: {
            totalFiles: files.length,
            filesWithIssues: 0,
            recoverableIssues: 0,
            problematicFiles: 0,
            minorIssues: 0,
            perfectFiles: 0
        },
        categories: {
            recoverable: [],
            problematic: [],
            minor: [],
            perfect: []
        },
        fieldAnalysis: {}
    };
    
    console.log(`📊 Analyzing ${files.length} award files...\n`);
    
    // Track field statistics
    const fieldStats = {};
    
    for (const file of files.sort()) {
        const filePath = path.join(awardsDir, file);
        const awardData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const awardNum = awardData.awardNum || file.replace('.json', '');
        
        console.log(`   📄 ${awardNum}: Analyzing...`);
        
        let issues = [];
        
        // Check all defined fields
        const allFields = [...fieldDefinitions.critical, ...fieldDefinitions.important, ...fieldDefinitions.optional, ...fieldDefinitions.supplementary];
        
        for (const field of allFields) {
            const analysis = analyzeField(awardData[field], field);
            
            // Track field statistics
            if (!fieldStats[field]) {
                fieldStats[field] = { total: 0, missing: 0, present: 0 };
            }
            fieldStats[field].total++;
            
            if (analysis.isEmpty) {
                fieldStats[field].missing++;
                
                let severity = 'low';
                let type = 'missing_optional';
                
                if (fieldDefinitions.critical.includes(field)) {
                    severity = 'high';
                    type = 'missing_critical';
                } else if (fieldDefinitions.important.includes(field)) {
                    severity = 'medium';
                    type = 'missing_important';
                }
                
                issues.push({
                    field: field,
                    type: type,
                    severity: severity,
                    value: analysis.value,
                    issue: analysis.issue
                });
            } else {
                fieldStats[field].present++;
                
                // Check for malformed data
                if (analysis.issue) {
                    issues.push({
                        field: field,
                        type: 'malformed_data',
                        severity: 'medium',
                        value: analysis.value,
                        issue: analysis.issue
                    });
                }
            }
        }
        
        if (issues.length === 0) {
            results.categories.perfect.push({
                awardNum: awardNum,
                file: file,
                status: 'complete'
            });
            results.summary.perfectFiles++;
        } else {
            const categorization = categorizeIssues(issues);
            const issueEntry = {
                awardNum: awardNum,
                file: file,
                issues: issues,
                severity: categorization.severity,
                notes: categorization.reason
            };
            
            results.categories[categorization.severity].push(issueEntry);
            results.summary.filesWithIssues++;
            
            if (categorization.severity === 'recoverable') {
                results.summary.recoverableIssues++;
            } else if (categorization.severity === 'problematic') {
                results.summary.problematicFiles++;
            } else if (categorization.severity === 'minor') {
                results.summary.minorIssues++;
            }
        }
        
        console.log(`     Issues found: ${issues.length} (${issues.length === 0 ? 'Perfect' : categorizeIssues(issues).severity})`);
    }
    
    // Calculate field statistics
    results.fieldAnalysis = {};
    for (const [field, stats] of Object.entries(fieldStats)) {
        const completeness = ((stats.present / stats.total) * 100).toFixed(1);
        results.fieldAnalysis[field] = {
            ...stats,
            completenessPercent: parseFloat(completeness),
            fieldType: fieldDefinitions.critical.includes(field) ? 'critical' :
                      fieldDefinitions.important.includes(field) ? 'important' :
                      fieldDefinitions.optional.includes(field) ? 'optional' : 'supplementary'
        };
    }
    
    // Save results
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 2020 AWARDS ANALYSIS SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 FILE STATISTICS:`);
    console.log(`   Total files analyzed: ${results.summary.totalFiles}`);
    console.log(`   Perfect files: ${results.summary.perfectFiles} (${(results.summary.perfectFiles/results.summary.totalFiles*100).toFixed(1)}%)`);
    console.log(`   Files with issues: ${results.summary.filesWithIssues} (${(results.summary.filesWithIssues/results.summary.totalFiles*100).toFixed(1)}%)`);
    
    console.log(`\n📋 ISSUES BY SEVERITY:`);
    console.log(`   Problematic: ${results.summary.problematicFiles} (critical fields missing)`);
    console.log(`   Recoverable: ${results.summary.recoverableIssues} (multiple important fields missing)`);
    console.log(`   Minor: ${results.summary.minorIssues} (few important fields missing)`);
    
    console.log(`\n📈 FIELD COMPLETENESS ANALYSIS:`);
    
    // Group fields by type for display
    const fieldsByType = {
        critical: [],
        important: [],
        optional: [],
        supplementary: []
    };
    
    for (const [field, stats] of Object.entries(results.fieldAnalysis)) {
        fieldsByType[stats.fieldType].push({ field, ...stats });
    }
    
    for (const [type, fields] of Object.entries(fieldsByType)) {
        if (fields.length > 0) {
            console.log(`\n   ${type.toUpperCase()} FIELDS:`);
            fields.sort((a, b) => b.completenessPercent - a.completenessPercent);
            for (const fieldData of fields) {
                const status = fieldData.completenessPercent >= 95 ? '✅' :
                              fieldData.completenessPercent >= 80 ? '⚠️' : '❌';
                console.log(`     ${status} ${fieldData.field}: ${fieldData.completenessPercent}% (${fieldData.present}/${fieldData.total})`);
            }
        }
    }
    
    if (results.summary.filesWithIssues > 0) {
        console.log(`\n📝 SAMPLE ISSUES BY CATEGORY:`);
        
        for (const [category, items] of Object.entries(results.categories)) {
            if (items.length > 0 && category !== 'perfect') {
                console.log(`\n   ${category.toUpperCase()} (${items.length} files):`);
                
                // Show first 3 examples
                const examples = items.slice(0, 3);
                for (const item of examples) {
                    const criticalIssues = item.issues?.filter(i => i.severity === 'high') || [];
                    const importantIssues = item.issues?.filter(i => i.severity === 'medium') || [];
                    
                    console.log(`     📄 ${item.awardNum}:`);
                    if (criticalIssues.length > 0) {
                        console.log(`       🔴 Critical: ${criticalIssues.map(i => i.field).join(', ')}`);
                    }
                    if (importantIssues.length > 0) {
                        console.log(`       🟡 Important: ${importantIssues.map(i => i.field).join(', ')}`);
                    }
                }
                
                if (items.length > 3) {
                    console.log(`     ... and ${items.length - 3} more`);
                }
            }
        }
    }
    
    console.log(`\n📄 Detailed analysis saved to: ${outputPath}`);
    console.log('\n🎉 2020 analysis complete! Ready for fix strategy planning.');
    
} catch (error) {
    console.error('❌ Error during analysis:', error.message);
    console.error(error.stack);
    process.exit(1);
}