const fs = require('fs');
const path = require('path');

const jsonDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2025/json';
const htmlDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2025/html';
const outputPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2025/2025-categorized-issues.json';

function categorizeNullValueIssues() {
    console.log('Creating categorized analysis of null value issues...');
    
    let files = [];
    try {
        files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
    } catch (error) {
        console.error('Error reading directory:', error);
        return;
    }

    const categorizedReport = {
        timestamp: new Date().toISOString(),
        purpose: "Categorized analysis of null values: recoverable vs author errors vs minor issues",
        summary: {
            totalFiles: files.length,
            filesWithNullValues: 0,
            recoverableIssues: 0,
            authorErrors: 0,
            minorIssues: 0
        },
        categories: {
            recoverableFromHtml: [],
            authorErrorsOnSource: [],
            minorDescriptionIssues: []
        }
    };

    files.forEach(file => {
        const filePath = path.join(jsonDir, file);
        
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(fileContent);
            
            // Check for null values in all fields
            const nullFields = [];
            
            function checkForNulls(obj, keyPath = '') {
                for (const [key, value] of Object.entries(obj)) {
                    const currentPath = keyPath ? `${keyPath}.${key}` : key;
                    
                    if (value === null || value === undefined) {
                        nullFields.push(currentPath);
                    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        checkForNulls(value, currentPath);
                    }
                }
            }
            
            checkForNulls(data);
            
            if (nullFields.length > 0) {
                categorizedReport.summary.filesWithNullValues++;
                
                const baseInfo = {
                    fileName: file,
                    awardNum: data.awardNum || 'Unknown',
                    plantName: `${data.genus || 'Unknown'} ${data.species || ''}`.trim(),
                    exhibitor: data.exhibitor || 'Unknown',
                    nullFieldsList: nullFields,
                    nullCount: nullFields.length
                };

                // Categorize based on null field count and types
                if (nullFields.length >= 5) {
                    // Author errors - too many missing fields, likely source issue
                    categorizedReport.categories.authorErrorsOnSource.push({
                        ...baseInfo,
                        issue: "Source page incomplete - likely author error on original website"
                    });
                    categorizedReport.summary.authorErrors++;
                    
                } else if (nullFields.some(field => field === 'award' || field === 'awardpoints')) {
                    // Recoverable - critical award data missing but should be in HTML
                    categorizedReport.categories.recoverableFromHtml.push({
                        ...baseInfo,
                        issue: "Critical award data missing - should be recoverable from HTML source",
                        priority: "HIGH"
                    });
                    categorizedReport.summary.recoverableIssues++;
                    
                } else if (nullFields.every(field => field.includes('description') || field.includes('SYNSL') || field.includes('SYNSW'))) {
                    // Minor issues - just descriptions or optional measurements
                    categorizedReport.categories.minorDescriptionIssues.push({
                        ...baseInfo,
                        issue: "Minor missing descriptions or optional measurements",
                        priority: "LOW"
                    });
                    categorizedReport.summary.minorIssues++;
                    
                } else {
                    // Mixed issues - need individual review
                    categorizedReport.categories.recoverableFromHtml.push({
                        ...baseInfo,
                        issue: "Mixed missing data - needs individual review",
                        priority: "MEDIUM"
                    });
                    categorizedReport.summary.recoverableIssues++;
                }
            }
            
        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
        }
    });

    // Write the categorized report
    try {
        fs.writeFileSync(outputPath, JSON.stringify(categorizedReport, null, 2));
        console.log('Categorized issues report created:', outputPath);
        
        // Print categorized summary
        console.log('\n' + '='.repeat(70));
        console.log('CATEGORIZED NULL VALUES ANALYSIS');
        console.log('='.repeat(70));
        console.log(`Total files: ${categorizedReport.summary.totalFiles}`);
        console.log(`Files with issues: ${categorizedReport.summary.filesWithNullValues}`);
        console.log('');
        
        // HIGH PRIORITY: Author Errors
        if (categorizedReport.categories.authorErrorsOnSource.length > 0) {
            console.log(`🚨 AUTHOR ERRORS ON SOURCE (${categorizedReport.summary.authorErrors} files):`);
            console.log('   These have 5+ null fields - likely incomplete source pages');
            console.log('');
            categorizedReport.categories.authorErrorsOnSource.forEach((fileInfo, index) => {
                console.log(`   ${index + 1}. ${fileInfo.fileName} (${fileInfo.awardNum})`);
                console.log(`      Plant: ${fileInfo.plantName}`);
                console.log(`      Exhibitor: ${fileInfo.exhibitor}`);
                console.log(`      Missing fields (${fileInfo.nullCount}): ${fileInfo.nullFieldsList.slice(0, 5).join(', ')}${fileInfo.nullCount > 5 ? '...' : ''}`);
                console.log('');
            });
        }
        
        // MEDIUM PRIORITY: Recoverable Issues
        if (categorizedReport.categories.recoverableFromHtml.length > 0) {
            console.log(`🔧 RECOVERABLE FROM HTML (${categorizedReport.summary.recoverableIssues} files):`);
            console.log('   Critical data missing but should be in HTML source');
            console.log('');
            categorizedReport.categories.recoverableFromHtml.forEach((fileInfo, index) => {
                console.log(`   ${index + 1}. ${fileInfo.fileName} (${fileInfo.awardNum}) - ${fileInfo.priority} PRIORITY`);
                console.log(`      Plant: ${fileInfo.plantName}`);
                console.log(`      Exhibitor: ${fileInfo.exhibitor}`);
                console.log(`      Missing: ${fileInfo.nullFieldsList.join(', ')}`);
                console.log('');
            });
        }
        
        // LOW PRIORITY: Minor Issues
        if (categorizedReport.categories.minorDescriptionIssues.length > 0) {
            console.log(`📝 MINOR DESCRIPTION ISSUES (${categorizedReport.summary.minorIssues} files):`);
            console.log('   Missing descriptions or optional measurements only');
            console.log('');
            categorizedReport.categories.minorDescriptionIssues.forEach((fileInfo, index) => {
                console.log(`   ${index + 1}. ${fileInfo.fileName} (${fileInfo.awardNum})`);
                console.log(`      Plant: ${fileInfo.plantName} - Missing: ${fileInfo.nullFieldsList.join(', ')}`);
            });
            console.log('');
        }
        
        console.log('RECOMMENDED ACTIONS:');
        console.log(`1. 🚨 Report ${categorizedReport.summary.authorErrors} author error(s) to website maintainer`);
        console.log(`2. 🔧 Fix ${categorizedReport.summary.recoverableIssues} recoverable issue(s) from HTML source`);
        console.log(`3. 📝 Address ${categorizedReport.summary.minorIssues} minor issue(s) when convenient`);
        
        console.log('='.repeat(70));
        
    } catch (error) {
        console.error('Error writing categorized report:', error);
    }
}

categorizeNullValueIssues();