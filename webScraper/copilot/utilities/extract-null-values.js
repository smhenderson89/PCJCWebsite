const fs = require('fs');
const path = require('path');

const jsonDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2025/json';
const outputPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2025/2025-null-values-review.json';

function extractNullValuesReport() {
    console.log('Creating detailed report of files with null values...');
    
    let files = [];
    try {
        files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
    } catch (error) {
        console.error('Error reading directory:', error);
        return;
    }

    const nullValuesReport = {
        timestamp: new Date().toISOString(),
        purpose: "Concise list of awards with null values for manual inspection",
        summary: {
            totalFiles: files.length,
            filesWithNullValues: 0,
            totalNullFields: 0
        },
        filesWithNullValues: []
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
                        nullFields.push({
                            field: currentPath,
                            value: value,
                            type: typeof value
                        });
                    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        checkForNulls(value, currentPath);
                    } else if (Array.isArray(value)) {
                        value.forEach((item, index) => {
                            if (item === null || item === undefined) {
                                nullFields.push({
                                    field: `${currentPath}[${index}]`,
                                    value: item,
                                    type: typeof item
                                });
                            } else if (typeof item === 'object' && item !== null) {
                                checkForNulls(item, `${currentPath}[${index}]`);
                            }
                        });
                    }
                }
            }
            
            checkForNulls(data);
            
            if (nullFields.length > 0) {
                nullValuesReport.filesWithNullValues.push({
                    fileName: file,
                    awardNum: data.awardNum || 'Unknown',
                    awardType: data.award || 'Unknown',
                    genus: data.genus || 'Unknown',
                    species: data.species || 'Unknown',
                    exhibitor: data.exhibitor || 'Unknown',
                    date: data.date || 'Unknown',
                    location: data.location || 'Unknown',
                    nullFields: nullFields,
                    nullFieldCount: nullFields.length
                    // Removed fullRecord to keep report concise
                });
                
                nullValuesReport.summary.filesWithNullValues++;
                nullValuesReport.summary.totalNullFields += nullFields.length;
            }
            
        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
            nullValuesReport.filesWithNullValues.push({
                fileName: file,
                error: error.message,
                issue: 'Failed to parse JSON'
            });
        }
    });

    // Write the report
    try {
        fs.writeFileSync(outputPath, JSON.stringify(nullValuesReport, null, 2));
        console.log('Null values report created:', outputPath);
        
        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('NULL VALUES REVIEW REPORT');
        console.log('='.repeat(60));
        console.log(`Total files analyzed: ${nullValuesReport.summary.totalFiles}`);
        console.log(`Files with null values: ${nullValuesReport.summary.filesWithNullValues}`);
        console.log(`Total null fields found: ${nullValuesReport.summary.totalNullFields}`);
        console.log('');
        
        if (nullValuesReport.filesWithNullValues.length > 0) {
            console.log('FILES WITH NULL VALUES:');
            console.log('');
            
            nullValuesReport.filesWithNullValues.forEach((fileInfo, index) => {
                if (fileInfo.error) {
                    console.log(`${index + 1}. ${fileInfo.fileName} - ERROR: ${fileInfo.error}`);
                } else {
                    console.log(`${index + 1}. ${fileInfo.fileName} (Award ${fileInfo.awardNum}):`);
                    console.log(`   Plant: ${fileInfo.genus} ${fileInfo.species}`);
                    console.log(`   Exhibitor: ${fileInfo.exhibitor}`);
                    console.log(`   Date: ${fileInfo.date}`);
                    console.log(`   Location: ${fileInfo.location}`);
                    console.log(`   Null fields (${fileInfo.nullFieldCount}):`);
                    
                    fileInfo.nullFields.forEach(nullField => {
                        console.log(`     - ${nullField.field}: ${nullField.value} (${nullField.type})`);
                    });
                    console.log('');
                }
            });
            
            // Field frequency analysis
            const fieldFrequency = {};
            nullValuesReport.filesWithNullValues.forEach(fileInfo => {
                if (fileInfo.nullFields) {
                    fileInfo.nullFields.forEach(nullField => {
                        if (!fieldFrequency[nullField.field]) {
                            fieldFrequency[nullField.field] = 0;
                        }
                        fieldFrequency[nullField.field]++;
                    });
                }
            });
            
            if (Object.keys(fieldFrequency).length > 0) {
                console.log('MOST COMMON NULL FIELDS:');
                Object.entries(fieldFrequency)
                    .sort(([,a], [,b]) => b - a)
                    .forEach(([field, count]) => {
                        console.log(`  ${field}: ${count} files`);
                    });
            }
        } else {
            console.log('✅ No files with null values found!');
        }
        
        console.log('='.repeat(60));
        console.log(`Full detailed report saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('Error writing null values report:', error);
    }
}

extractNullValuesReport();