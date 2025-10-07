const fs = require('fs-extra');
const path = require('path');

const JSON_DIR = path.join(__dirname, '../savedData/2024/json');

async function analyzeMissingData() {
    console.log('🔍 Analyzing Missing Data in 2024 JSON Files\n');
    
    try {
        const jsonFiles = (await fs.readdir(JSON_DIR))
            .filter(file => file.endsWith('.json'))
            .sort();
        
        const analysis = {
            totalFiles: jsonFiles.length,
            filesWithMissingData: [],
            completeSummary: {
                genus: { missing: 0, files: [] },
                species: { missing: 0, files: [] },
                clone: { missing: 0, files: [] },
                award: { missing: 0, files: [] },
                awardpoints: { missing: 0, files: [] },
                cross: { missing: 0, files: [] },
                exhibitor: { missing: 0, files: [] },
                photographer: { missing: 0, files: [] }
            },
            generatedDate: new Date().toISOString()
        };
        
        console.log(`📊 Analyzing ${jsonFiles.length} files...\n`);
        
        for (const filename of jsonFiles) {
            const jsonPath = path.join(JSON_DIR, filename);
            const data = await fs.readJson(jsonPath);
            
            const missingFields = [];
            
            // Check each field for missing data
            if (data.genus === null || data.genus === undefined || data.genus === '') {
                missingFields.push('genus');
                analysis.completeSummary.genus.missing++;
                analysis.completeSummary.genus.files.push(filename);
            }
            
            if (data.species === null || data.species === undefined || data.species === '') {
                missingFields.push('species');
                analysis.completeSummary.species.missing++;
                analysis.completeSummary.species.files.push(filename);
            }
            
            if (data.clone === null || data.clone === undefined || data.clone === '') {
                missingFields.push('clone');
                analysis.completeSummary.clone.missing++;
                analysis.completeSummary.clone.files.push(filename);
            }
            
            if (data.award === null || data.award === undefined || data.award === '') {
                missingFields.push('award');
                analysis.completeSummary.award.missing++;
                analysis.completeSummary.award.files.push(filename);
            }
            
            if (data.awardpoints === null || data.awardpoints === undefined || data.awardpoints === '') {
                missingFields.push('awardpoints');
                analysis.completeSummary.awardpoints.missing++;
                analysis.completeSummary.awardpoints.files.push(filename);
            }
            
            if (data.cross === null || data.cross === undefined || data.cross === '') {
                missingFields.push('cross');
                analysis.completeSummary.cross.missing++;
                analysis.completeSummary.cross.files.push(filename);
            }
            
            if (data.exhibitor === null || data.exhibitor === undefined || data.exhibitor === '') {
                missingFields.push('exhibitor');
                analysis.completeSummary.exhibitor.missing++;
                analysis.completeSummary.exhibitor.files.push(filename);
            }
            
            if (data.photographer === null || data.photographer === undefined || data.photographer === '') {
                missingFields.push('photographer');
                analysis.completeSummary.photographer.missing++;
                analysis.completeSummary.photographer.files.push(filename);
            }
            
            // If there are missing fields, add to analysis
            if (missingFields.length > 0) {
                analysis.filesWithMissingData.push({
                    filename: filename,
                    awardNum: data.awardNum,
                    missingFields: missingFields,
                    existingData: {
                        genus: data.genus,
                        species: data.species,
                        clone: data.clone,
                        award: data.award,
                        awardpoints: data.awardpoints,
                        exhibitor: data.exhibitor,
                        photographer: data.photographer
                    }
                });
                
                console.log(`⚠️  ${filename}: Missing ${missingFields.join(', ')}`);
            } else {
                console.log(`✅ ${filename}: Complete`);
            }
        }
        
        // Generate summary statistics
        console.log('\n📊 SUMMARY STATISTICS:');
        console.log('======================');
        console.log(`📄 Total files: ${analysis.totalFiles}`);
        console.log(`❌ Files with missing data: ${analysis.filesWithMissingData.length}`);
        console.log(`✅ Complete files: ${analysis.totalFiles - analysis.filesWithMissingData.length}`);
        console.log(`📈 Completion rate: ${((analysis.totalFiles - analysis.filesWithMissingData.length) / analysis.totalFiles * 100).toFixed(1)}%`);
        
        console.log('\n🔍 MISSING DATA BY FIELD:');
        console.log('========================');
        Object.entries(analysis.completeSummary).forEach(([field, info]) => {
            if (info.missing > 0) {
                console.log(`❌ ${field}: ${info.missing} files missing (${(info.missing / analysis.totalFiles * 100).toFixed(1)}%)`);
            } else {
                console.log(`✅ ${field}: Complete in all files`);
            }
        });
        
        // Save analysis to JSON file
        const outputPath = path.join(__dirname, '../analysis/2024-missing-data-analysis.json');
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeJson(outputPath, analysis, { spaces: 2 });
        
        console.log(`\n💾 Analysis saved to: ${outputPath}`);
        
        // Generate human-readable report
        const reportPath = path.join(__dirname, '../analysis/2024-missing-data-report.md');
        await generateMarkdownReport(analysis, reportPath);
        
        console.log(`📝 Markdown report saved to: ${reportPath}`);
        
        return analysis;
        
    } catch (error) {
        console.error('❌ Error during analysis:', error.message);
        throw error;
    }
}

async function generateMarkdownReport(analysis, outputPath) {
    const report = `# 2024 Orchid Awards - Missing Data Analysis

Generated: ${new Date(analysis.generatedDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
})}

## Summary Statistics

- **Total Files**: ${analysis.totalFiles}
- **Files with Missing Data**: ${analysis.filesWithMissingData.length}
- **Complete Files**: ${analysis.totalFiles - analysis.filesWithMissingData.length}
- **Completion Rate**: ${((analysis.totalFiles - analysis.filesWithMissingData.length) / analysis.totalFiles * 100).toFixed(1)}%

## Missing Data by Field

${Object.entries(analysis.completeSummary)
    .map(([field, info]) => 
        info.missing > 0 
            ? `- **${field}**: ${info.missing} files missing (${(info.missing / analysis.totalFiles * 100).toFixed(1)}%)`
            : `- **${field}**: ✅ Complete in all files`
    ).join('\n')}

## Files Requiring Attention

${analysis.filesWithMissingData.length === 0 
    ? '🎉 All files are complete!' 
    : analysis.filesWithMissingData.map(file => {
        return `### ${file.filename} (Award ${file.awardNum})

**Missing Fields**: ${file.missingFields.map(field => '`' + field + '`').join(', ')}

**Current Data**:
- Genus: ${file.existingData.genus || 'null'}
- Species: ${file.existingData.species || 'null'}
- Clone: ${file.existingData.clone || 'null'}
- Award: ${file.existingData.award || 'null'}
- Award Points: ${file.existingData.awardpoints || 'null'}
- Exhibitor: ${file.existingData.exhibitor || 'null'}
- Photographer: ${file.existingData.photographer || 'null'}

---`;
    }).join('\n\n')}

## Fields with Missing Data Details

${Object.entries(analysis.completeSummary)
    .filter(([field, info]) => info.missing > 0)
    .map(([field, info]) => `### ${field} (${info.missing} missing)

Files: ${info.files.map(f => '`' + f + '`').join(', ')}`)
    .join('\n\n')}

## Recommendations

1. **Priority 1**: Fix missing \`award\` and \`awardpoints\` data - these are critical award information
2. **Priority 2**: Complete missing \`genus\` and \`species\` data for taxonomic accuracy
3. **Priority 3**: Fill in missing \`clone\` names where available
4. **Priority 4**: Complete exhibitor and photographer information for credit

## Next Steps

- Review HTML source files for missing information
- Consider manual data entry for critical missing fields
- Implement enhanced parsing for edge cases
- Validate data consistency across all files
`;

    await fs.writeFile(outputPath, report, 'utf8');
}

// Run the analysis
analyzeMissingData()
    .then(() => {
        console.log('\n🎉 Analysis complete!');
    })
    .catch(error => {
        console.error('❌ Analysis failed:', error);
        process.exit(1);
    });