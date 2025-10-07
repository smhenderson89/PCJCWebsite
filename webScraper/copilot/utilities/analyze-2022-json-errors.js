#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

const JSON_DIR = path.join(__dirname, '..', 'savedData', '2022', 'json');
const HTML_DIR = path.join(__dirname, '..', 'localCopy', 'paccentraljc.org', 'awards', '2022', 'html');

async function analyzeJsonFiles() {
    console.log('🚀 Starting 2022 JSON Files Error Analysis\n');
    
    console.log('📋 This will:');
    console.log('   1. 📁 Read all 2022 JSON award files');
    console.log('   2. 🔍 Compare with original HTML data');
    console.log('   3. 📊 Categorize errors and missing data');
    console.log('   4. 📄 Generate comprehensive error report\n');

    const errorCategories = {
        missingAward: [],
        missingAwardPoints: [],
        incorrectGenus: [],
        incorrectSpecies: [],
        incorrectClone: [],
        truncatedDescription: [],
        missingCross: [],
        incorrectLocation: [],
        incorrectDate: [],
        measurementErrors: [],
        multipleErrors: []
    };

    const allFiles = await fs.readdir(JSON_DIR);
    const jsonFiles = allFiles.filter(f => f.endsWith('.json') && f.match(/^20225\d{3}\.json$/));
    
    console.log(`📁 Found ${jsonFiles.length} JSON files to analyze...\n`);

    for (let i = 0; i < jsonFiles.length; i++) {
        const filename = jsonFiles[i];
        const awardNum = filename.replace('.json', '');
        const jsonPath = path.join(JSON_DIR, filename);
        const htmlPath = path.join(HTML_DIR, `${awardNum}.html`);
        
        console.log(`   📄 Analyzing ${i + 1}/${jsonFiles.length}: ${filename}`);
        
        try {
            // Read JSON data
            const jsonData = await fs.readJSON(jsonPath);
            
            // Read HTML data if exists
            let htmlData = null;
            if (await fs.pathExists(htmlPath)) {
                const htmlContent = await fs.readFile(htmlPath, 'utf8');
                htmlData = parseHtmlData(htmlContent, awardNum);
            }

            // Analyze for errors
            const fileErrors = analyzeFileErrors(jsonData, htmlData, awardNum);
            
            // Categorize errors
            if (fileErrors.length === 0) {
                // No errors found
            } else if (fileErrors.length === 1) {
                const errorType = fileErrors[0].type;
                if (errorCategories[errorType]) {
                    errorCategories[errorType].push({
                        file: filename,
                        errors: fileErrors
                    });
                }
            } else {
                // Multiple errors
                errorCategories.multipleErrors.push({
                    file: filename,
                    errors: fileErrors
                });
            }

        } catch (error) {
            console.log(`      ❌ Error analyzing ${filename}: ${error.message}`);
        }
    }

    // Generate report
    console.log('\n📊 Generating error analysis report...');
    
    const report = {
        timestamp: new Date().toISOString(),
        totalFiles: jsonFiles.length,
        summary: {},
        details: errorCategories
    };

    // Calculate summary statistics
    let totalFilesWithErrors = 0;
    let totalErrors = 0;
    
    Object.keys(errorCategories).forEach(category => {
        const categoryCount = errorCategories[category].length;
        report.summary[category] = categoryCount;
        totalFilesWithErrors += categoryCount;
        
        // Count individual errors for multipleErrors category
        if (category === 'multipleErrors') {
            errorCategories[category].forEach(item => {
                totalErrors += item.errors.length;
            });
        } else {
            totalErrors += categoryCount;
        }
    });

    report.summary.totalFilesWithErrors = totalFilesWithErrors;
    report.summary.totalErrors = totalErrors;
    report.summary.cleanFiles = jsonFiles.length - totalFilesWithErrors;

    // Print summary
    console.log('\n📋 2022 JSON Files Error Analysis Summary:');
    console.log(`   📄 Total files analyzed: ${jsonFiles.length}`);
    console.log(`   ✅ Clean files: ${report.summary.cleanFiles}`);
    console.log(`   ❌ Files with errors: ${totalFilesWithErrors}`);
    console.log(`   🔢 Total errors found: ${totalErrors}\n`);

    console.log('📊 Error Categories:');
    Object.keys(errorCategories).forEach(category => {
        const count = errorCategories[category].length;
        if (count > 0) {
            console.log(`   ${getCategoryIcon(category)} ${formatCategoryName(category)}: ${count} files`);
        }
    });

    // Show sample errors for each category
    console.log('\n📝 Sample Errors by Category:');
    Object.keys(errorCategories).forEach(category => {
        const items = errorCategories[category];
        if (items.length > 0) {
            console.log(`\n${getCategoryIcon(category)} ${formatCategoryName(category)}:`);
            const samplesToShow = Math.min(3, items.length);
            for (let i = 0; i < samplesToShow; i++) {
                const item = items[i];
                console.log(`   📄 ${item.file}:`);
                item.errors.forEach(error => {
                    console.log(`      - ${error.description}`);
                    if (error.expected && error.actual) {
                        console.log(`        Expected: "${error.expected}"`);
                        console.log(`        Actual: "${error.actual}"`);
                    }
                });
            }
            if (items.length > samplesToShow) {
                console.log(`   ... and ${items.length - samplesToShow} more files`);
            }
        }
    });

    // Save report
    const reportPath = path.join(JSON_DIR, '2022-json-error-analysis-report.json');
    await fs.writeJSON(reportPath, report, { spaces: 2 });
    console.log(`\n📊 Detailed report saved to: ${reportPath}`);

    console.log('\n✅ 2022 JSON error analysis complete!');
    return report;
}

function parseHtmlData(htmlContent, awardNum) {
    try {
        const $ = cheerio.load(htmlContent);
        
        // Extract award info from the main content block
        const mainContent = $('font[size="+1"]').first().text();
        
        // Extract award type and points (like "CHM 80", "AM 85", "HCC 75")
        const awardMatch = mainContent.match(/(AM|HCC|CCM|CHM|CBR|JC|AQ|AD)\s*(\d+)/i);
        const award = awardMatch ? awardMatch[1].toUpperCase() : '';
        const awardPoints = awardMatch ? parseInt(awardMatch[2]) : null;
        
        // Extract plant name (genus species 'clone')
        const plantMatch = mainContent.match(/([A-Z][a-z]+)\s+([a-z\s]+(?:'[^']*')?)/);
        const genus = plantMatch ? plantMatch[1] : '';
        const speciesClone = plantMatch ? plantMatch[2].trim() : '';
        
        // Split species and clone
        let species = '', clone = '';
        const cloneMatch = speciesClone.match(/(.+?)\s*'([^']+)'$/);
        if (cloneMatch) {
            species = cloneMatch[1].trim();
            clone = cloneMatch[2];
        } else {
            species = speciesClone;
        }

        // Extract date and location
        const dateLocationMatch = mainContent.match(/([A-Z][a-z]+\s+\d+,\s+\d{4})\s*-\s*(.+?)(?:\n|$)/);
        const date = dateLocationMatch ? dateLocationMatch[1] : '';
        const location = dateLocationMatch ? dateLocationMatch[2].trim() : '';

        // Extract exhibitor
        const exhibitorMatch = mainContent.match(/Exhibited by:\s*([^\n]+)/);
        const exhibitor = exhibitorMatch ? exhibitorMatch[1].trim() : '';

        // Extract photographer  
        const photographerMatch = mainContent.match(/Photographer:\s*([^\n]+)/);
        const photographer = photographerMatch ? photographerMatch[1].trim() : '';

        return {
            awardNum,
            award,
            awardPoints,
            genus,
            species,
            clone,
            date,
            location,
            exhibitor,
            photographer
        };
    } catch (error) {
        console.log(`   ⚠️  Error parsing HTML for ${awardNum}: ${error.message}`);
        return null;
    }
}

function analyzeFileErrors(jsonData, htmlData, awardNum) {
    const errors = [];
    
    if (!htmlData) {
        errors.push({
            type: 'missingHtml',
            description: 'HTML file not found for comparison'
        });
        return errors;
    }

    // Check award field
    if (!jsonData.award || jsonData.award.trim() === '') {
        if (htmlData.award) {
            errors.push({
                type: 'missingAward',
                description: 'Award type is missing or empty',
                expected: htmlData.award,
                actual: jsonData.award
            });
        }
    }

    // Check award points
    if (!jsonData.awardpoints || jsonData.awardpoints === null) {
        if (htmlData.awardPoints) {
            errors.push({
                type: 'missingAwardPoints', 
                description: 'Award points are missing or null',
                expected: htmlData.awardPoints,
                actual: jsonData.awardpoints
            });
        }
    }

    // Check genus
    if (htmlData.genus && jsonData.genus !== htmlData.genus) {
        errors.push({
            type: 'incorrectGenus',
            description: 'Genus does not match HTML',
            expected: htmlData.genus,
            actual: jsonData.genus
        });
    }

    // Check species
    if (htmlData.species && jsonData.species !== htmlData.species) {
        errors.push({
            type: 'incorrectSpecies', 
            description: 'Species does not match HTML',
            expected: htmlData.species,
            actual: jsonData.species
        });
    }

    // Check clone
    if (htmlData.clone && jsonData.clone !== htmlData.clone) {
        errors.push({
            type: 'incorrectClone',
            description: 'Clone does not match HTML', 
            expected: htmlData.clone,
            actual: jsonData.clone
        });
    }

    // Check date
    if (htmlData.date && jsonData.date !== htmlData.date) {
        errors.push({
            type: 'incorrectDate',
            description: 'Date does not match HTML',
            expected: htmlData.date,
            actual: jsonData.date
        });
    }

    // Check location
    if (htmlData.location && jsonData.location !== htmlData.location) {
        errors.push({
            type: 'incorrectLocation',
            description: 'Location does not match HTML',
            expected: htmlData.location,
            actual: jsonData.location
        });
    }

    // Check for truncated descriptions
    if (jsonData.measurements && jsonData.measurements.description) {
        if (jsonData.measurements.description.length < 20 || 
            jsonData.measurements.description.includes('are subject to revision')) {
            errors.push({
                type: 'truncatedDescription',
                description: 'Description appears truncated or contains placeholder text',
                actual: jsonData.measurements.description
            });
        }
    }

    return errors;
}

function getCategoryIcon(category) {
    const icons = {
        missingAward: '🏆',
        missingAwardPoints: '🔢',
        incorrectGenus: '🌿',
        incorrectSpecies: '🌱',
        incorrectClone: '🏷️',
        truncatedDescription: '✂️',
        missingCross: '❌',
        incorrectLocation: '📍',
        incorrectDate: '📅',
        measurementErrors: '📏',
        multipleErrors: '🔥'
    };
    return icons[category] || '❓';
}

function formatCategoryName(category) {
    return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// Run the analysis
analyzeJsonFiles().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});