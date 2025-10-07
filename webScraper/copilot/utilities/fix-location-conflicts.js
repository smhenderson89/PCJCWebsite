const fs = require('fs');
const path = require('path');

const jsonDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2025/json';
const reportPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2025/2025-missing-data-report.json';

function fixHighSeverityLocationConflicts() {
    console.log('Starting location conflict resolution...');
    
    try {
        // Read the analysis report
        const reportContent = fs.readFileSync(reportPath, 'utf8');
        const report = JSON.parse(reportContent);
        
        console.log(`Found ${report.summary.filesWithRealConflicts} high-severity conflicts to fix`);
        
        if (report.details.realConflicts.length === 0) {
            console.log('No high-severity conflicts found. Nothing to fix.');
            return;
        }
        
        let updatedFiles = 0;
        let errors = 0;
        
        // Process each high-severity conflict
        report.details.realConflicts.forEach(conflict => {
            if (conflict.severity === 'HIGH') {
                const jsonFilePath = path.join(jsonDir, conflict.file);
                
                try {
                    console.log(`\nProcessing ${conflict.file}:`);
                    console.log(`  Current location: "${conflict.htmlLocation}"`);
                    console.log(`  Index location: "${conflict.indexLocationOnly}"`);
                    
                    // Read the JSON file
                    const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
                    const jsonData = JSON.parse(jsonContent);
                    
                    // Update the location field with the index page location
                    const oldLocation = jsonData.location || '';
                    jsonData.location = conflict.indexLocationOnly;
                    
                    // Add a note about the correction
                    if (!jsonData.corrections) {
                        jsonData.corrections = [];
                    }
                    
                    jsonData.corrections.push({
                        timestamp: new Date().toISOString(),
                        field: 'location',
                        oldValue: oldLocation,
                        newValue: conflict.indexLocationOnly,
                        reason: `Location corrected from HTML page ("${conflict.htmlLocation}") to match index page placement ("${conflict.indexLocationOnly}")`,
                        source: 'index-page-authority'
                    });
                    
                    // Write the updated JSON back
                    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
                    
                    console.log(`  ✅ Updated location to: "${conflict.indexLocationOnly}"`);
                    updatedFiles++;
                    
                } catch (error) {
                    console.error(`  ❌ Error processing ${conflict.file}:`, error.message);
                    errors++;
                }
            }
        });
        
        console.log(`\n=== LOCATION CONFLICT RESOLUTION COMPLETE ===`);
        console.log(`Files updated: ${updatedFiles}`);
        console.log(`Errors: ${errors}`);
        
        if (updatedFiles > 0) {
            console.log('\nNext steps:');
            console.log('1. Review the updated files to ensure accuracy');
            console.log('2. Consider running the analysis again to verify conflicts are resolved');
            console.log('3. The "corrections" field has been added to track changes made');
        }
        
        // Update the report to reflect the fixes
        if (updatedFiles > 0) {
            console.log('\nUpdating analysis report...');
            
            // Mark the conflicts as resolved
            report.details.realConflicts.forEach(conflict => {
                if (conflict.severity === 'HIGH') {
                    conflict.resolved = true;
                    conflict.resolvedAt = new Date().toISOString();
                    conflict.resolution = 'location-updated-to-index-authority';
                }
            });
            
            // Update summary
            report.summary.filesWithRealConflicts = report.details.realConflicts.filter(c => !c.resolved).length;
            report.summary.validFiles += updatedFiles;
            report.lastLocationFix = {
                timestamp: new Date().toISOString(),
                filesUpdated: updatedFiles,
                conflictsResolved: updatedFiles
            };
            
            // Write updated report
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            console.log('✅ Analysis report updated');
        }
        
    } catch (error) {
        console.error('Error in conflict resolution:', error.message);
    }
}

fixHighSeverityLocationConflicts();