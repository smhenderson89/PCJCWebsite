const fs = require('fs');
const path = require('path');

const jsonDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2025/json';
const outputPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2025/2025-null-values-review.json';

function createSimpleNullValuesReport() {
    console.log('Creating simple list of files with null values...');
    
    let files = [];
    try {
        files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
    } catch (error) {
        console.error('Error reading directory:', error);
        return;
    }

    const nullValuesReport = {
        timestamp: new Date().toISOString(),
        purpose: "Simple list of files with null values for manual review",
        summary: {
            totalFiles: files.length,
            filesWithNullValues: 0,
            totalNullFields: 0
        },
        filesToReview: []
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
                nullValuesReport.filesToReview.push({
                    fileName: file,
                    awardNum: data.awardNum || 'Unknown',
                    plantName: `${data.genus || 'Unknown'} ${data.species || ''}`.trim(),
                    exhibitor: data.exhibitor || 'Unknown',
                    nullFieldsList: nullFields,
                    nullCount: nullFields.length
                });
                
                nullValuesReport.summary.filesWithNullValues++;
                nullValuesReport.summary.totalNullFields += nullFields.length;
            }
            
        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
        }
    });

    // Write the simple report
    try {
        fs.writeFileSync(outputPath, JSON.stringify(nullValuesReport, null, 2));
        console.log('Simple null values report created:', outputPath);
        
        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('SIMPLE NULL VALUES REVIEW LIST');
        console.log('='.repeat(60));
        console.log(`Total files: ${nullValuesReport.summary.totalFiles}`);
        console.log(`Files to review: ${nullValuesReport.summary.filesWithNullValues}`);
        console.log(`Total null fields: ${nullValuesReport.summary.totalNullFields}`);
        console.log('\nFILES TO REVIEW:');
        
        nullValuesReport.filesToReview.forEach((fileInfo, index) => {
            console.log(`${index + 1}. ${fileInfo.fileName} (${fileInfo.awardNum})`);
            console.log(`   Plant: ${fileInfo.plantName}`);
            console.log(`   Exhibitor: ${fileInfo.exhibitor}`);
            console.log(`   Null fields (${fileInfo.nullCount}): ${fileInfo.nullFieldsList.join(', ')}`);
            console.log('');
        });
        
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('Error writing simple report:', error);
    }
}

createSimpleNullValuesReport();