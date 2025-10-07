const fs = require('fs');
const path = require('path');

const reportPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2024/2024-missing-data-report.json';
const outputPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2024/2024-categorized-issues.json';

function categorize2024NullIssues() {
    console.log('Categorizing 2024 null value issues...');
    
    // Read the analysis report
    let analysisReport;
    try {
        const reportContent = fs.readFileSync(reportPath, 'utf8');
        analysisReport = JSON.parse(reportContent);
    } catch (error) {
        console.error('Error reading analysis report:', error);
        return;
    }
    
    const filesWithNulls = analysisReport.details.filesWithNullValues || [];
    const authorErrors = analysisReport.details.authorErrorFiles || [];
    
    console.log(`Found ${filesWithNulls.length} files with null values to categorize`);
    console.log(`Found ${authorErrors.length} author error files`);
    
    // Categorize the null issues
    const recoverableFromHtml = [];
    const minorDescriptionIssues = [];
    const authorErrorsOnSource = [];
    const measurementOnlyIssues = [];
    
    for (const fileInfo of filesWithNulls) {
        const nullCount = fileInfo.nullCount;
        const nullFields = fileInfo.nullFields;
        
        // Author errors: 5+ null fields
        if (nullCount >= 5) {
            authorErrorsOnSource.push({
                awardNum: fileInfo.awardNum,
                plantName: fileInfo.plantName,
                exhibitor: fileInfo.exhibitor,
                nullCount: nullCount,
                nullFieldsList: nullFields
            });
        }
        // Check if only missing award/awardpoints (recoverable from HTML)
        else if (nullFields.includes('award') || nullFields.includes('awardpoints')) {
            // Only consider recoverable if it's just award data missing
            const criticalNulls = nullFields.filter(field => 
                ['award', 'awardpoints'].includes(field)
            );
            
            if (criticalNulls.length > 0) {
                recoverableFromHtml.push({
                    awardNum: fileInfo.awardNum,
                    plantName: fileInfo.plantName,
                    exhibitor: fileInfo.exhibitor,
                    nullFields: nullFields,
                    criticalNulls: criticalNulls
                });
            }
        }
        // Check if only measurement issues
        else if (nullFields.every(field => field.startsWith('measurements.'))) {
            measurementOnlyIssues.push({
                awardNum: fileInfo.awardNum,
                plantName: fileInfo.plantName,
                exhibitor: fileInfo.exhibitor,
                nullFields: nullFields
            });
        }
        // Description-only issues (minor)
        else if (nullFields.length === 1 && nullFields[0] === 'measurements.description') {
            minorDescriptionIssues.push({
                awardNum: fileInfo.awardNum,
                plantName: fileInfo.plantName,
                exhibitor: fileInfo.exhibitor,
                nullFields: nullFields
            });
        }
        // Other minor issues
        else if (nullCount <= 3) {
            const hasDescription = nullFields.includes('measurements.description');
            const hasOptionalFields = nullFields.some(field => 
                ['clone', 'cross', 'photographer'].includes(field)
            );
            
            if (hasDescription || hasOptionalFields) {
                minorDescriptionIssues.push({
                    awardNum: fileInfo.awardNum,
                    plantName: fileInfo.plantName,
                    exhibitor: fileInfo.exhibitor,
                    nullFields: nullFields
                });
            } else {
                // Might be recoverable
                recoverableFromHtml.push({
                    awardNum: fileInfo.awardNum,
                    plantName: fileInfo.plantName,
                    exhibitor: fileInfo.exhibitor,
                    nullFields: nullFields,
                    criticalNulls: []
                });
            }
        }
    }
    
    const categorizedReport = {
        timestamp: new Date().toISOString(),
        analysisVersion: "1.0",
        purpose: "Categorize null value issues by fixability and severity",
        summary: {
            totalFilesWithNulls: filesWithNulls.length,
            recoverableFromHtml: recoverableFromHtml.length,
            minorDescriptionIssues: minorDescriptionIssues.length,
            measurementOnlyIssues: measurementOnlyIssues.length,
            authorErrorsOnSource: authorErrorsOnSource.length
        },
        categories: {
            recoverableFromHtml: recoverableFromHtml,
            minorDescriptionIssues: minorDescriptionIssues,
            measurementOnlyIssues: measurementOnlyIssues,
            authorErrorsOnSource: authorErrorsOnSource
        },
        recommendations: {
            recoverableFromHtml: "These files can be automatically fixed by extracting award data from HTML sources",
            minorDescriptionIssues: "These files have minor issues that may not affect core functionality",
            measurementOnlyIssues: "These files are missing measurement data - check if available in HTML",
            authorErrorsOnSource: "These pages have multiple missing fields and likely need website author attention"
        }
    };
    
    // Write the categorized report
    try {
        fs.writeFileSync(outputPath, JSON.stringify(categorizedReport, null, 2));
        console.log('Categorized issues report written to:', outputPath);
        
        console.log('\n' + '='.repeat(60));
        console.log('2024 NULL VALUE CATEGORIZATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`📊 TOTAL FILES WITH NULL VALUES: ${filesWithNulls.length}`);
        console.log('');
        console.log(`🔧 RECOVERABLE FROM HTML: ${recoverableFromHtml.length} files`);
        console.log('   - Can extract award/awardpoints from individual HTML pages');
        console.log('');
        console.log(`📏 MEASUREMENT ONLY ISSUES: ${measurementOnlyIssues.length} files`);
        console.log('   - Missing measurement data only');
        console.log('');
        console.log(`📝 MINOR DESCRIPTION ISSUES: ${minorDescriptionIssues.length} files`);
        console.log('   - Missing descriptions or optional fields only');
        console.log('');
        console.log(`🚨 AUTHOR ERRORS (5+ nulls): ${authorErrorsOnSource.length} files`);
        console.log('   - Likely incomplete source pages needing website author fix');
        
        if (authorErrorsOnSource.length > 0) {
            console.log('');
            console.log('Author Error Files:');
            authorErrorsOnSource.forEach((file, index) => {
                console.log(`   ${index + 1}. ${file.awardNum} - ${file.plantName} (${file.nullCount} nulls)`);
            });
        }
        
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('Error writing categorized report:', error);
    }
}

categorize2024NullIssues();