const fs = require('fs');
const path = require('path');

// Import the analysis function from the main parser
const { analyze2020Data } = require('./2020htmlToJSONparse.js');

// Path to HTML directory for reading source files
const htmlDirectory = path.resolve(path.join(__dirname, '../../paccentraljc.org/awards/2020/html'));

/**
 * Read JSON data to get sourceUrl for an award
 * @param {string} awardNum - The award number
 * @returns {Object|null} - JSON data or null if file not found
 */
function readJsonData(awardNum) {
    try {
        const jsonDirectory = path.resolve(path.join(__dirname, '../../paccentraljc.org/awards/2020/data/json'));
        const jsonPath = path.join(jsonDirectory, `${awardNum}.json`);
        
        if (fs.existsSync(jsonPath)) {
            const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
            return JSON.parse(jsonContent);
        }
        return null;
    } catch (error) {
        console.log(`⚠️  Error reading JSON for ${awardNum}: ${error.message}`);
        return null;
    }
}

/**
 * Enhanced analysis function that includes source URLs for review
 * @param {boolean} focusedMode - Whether to run focused analysis
 * @param {boolean} saveFile - Whether to save to file
 * @param {boolean} includeSourceUrls - Whether to include source URLs for review
 * @returns {Object} - Analysis results with source URLs
 */
async function analyze2020DataWithSourceUrls(focusedMode = true, saveFile = true, includeSourceUrls = true) {
    console.log(`🔍 Running enhanced analysis with source URL inclusion for review...`);
    
    // Get the base analysis results
    const results = await analyze2020Data(focusedMode, false); // Don't save yet, we'll enhance first
    
    if (includeSourceUrls) {
        console.log(`� Adding source URLs from JSON data for review...`);
        
        // Add source URL data to critical issues
        results.critical = results.critical.map(issue => {
            const jsonData = readJsonData(issue.awardNum);
            return {
                ...issue,
                reviewInfo: jsonData ? {
                    sourceUrl: jsonData.sourceUrl || 'N/A',
                    htmlReference: jsonData.htmlReference || 'N/A',
                    scrapedDate: jsonData.scrapedDate || 'N/A',
                    date: jsonData.date || 'Missing',
                    location: jsonData.location || 'Missing',
                    genus: jsonData.genus || 'Missing',
                    species: jsonData.species || 'Missing',
                    clone: jsonData.clone || 'N/A',
                    cross: jsonData.cross || 'N/A',
                    photographer: jsonData.photographer || 'Missing'
                } : {
                    error: 'JSON file not found',
                    sourceUrl: 'N/A'
                }
            };
        });
        
        // Add source URL data to important issues
        results.important = results.important.map(issue => {
            const jsonData = readJsonData(issue.awardNum);
            return {
                ...issue,
                reviewInfo: jsonData ? {
                    sourceUrl: jsonData.sourceUrl || 'N/A',
                    htmlReference: jsonData.htmlReference || 'N/A',
                    scrapedDate: jsonData.scrapedDate || 'N/A',
                    date: jsonData.date || 'Missing',
                    location: jsonData.location || 'Missing',
                    genus: jsonData.genus || 'Missing',
                    species: jsonData.species || 'Missing',
                    clone: jsonData.clone || 'N/A',
                    cross: jsonData.cross || 'N/A',
                    photographer: jsonData.photographer || 'Missing'
                } : {
                    error: 'JSON file not found',
                    sourceUrl: 'N/A'
                }
            };
        });
        
        // Add source URL data to measurement issues
        results.measurements = results.measurements.map(issue => {
            const jsonData = readJsonData(issue.awardNum);
            return {
                ...issue,
                reviewInfo: jsonData ? {
                    sourceUrl: jsonData.sourceUrl || 'N/A',
                    htmlReference: jsonData.htmlReference || 'N/A',
                    scrapedDate: jsonData.scrapedDate || 'N/A',
                    date: jsonData.date || 'Missing',
                    location: jsonData.location || 'Missing',
                    genus: jsonData.genus || 'Missing',
                    species: jsonData.species || 'Missing',
                    clone: jsonData.clone || 'N/A',
                    cross: jsonData.cross || 'N/A',
                    photographer: jsonData.photographer || 'Missing'
                } : {
                    error: 'JSON file not found',
                    sourceUrl: 'N/A'
                }
            };
        });
    }
    
    // Save the enhanced results if requested
    if (saveFile) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const mode = focusedMode ? 'missing-data' : 'full-data';
        const filename = `2020-${mode}-${timestamp}.json`;
        const outputPath = path.resolve(path.join(htmlDirectory, '../data', filename));
        
        const enhancedOutput = {
            metadata: {
                year: 2020,
                analysisType: focusedMode ? 'missing-data' : 'full-data',
                timestamp: new Date().toISOString(),
                generatedBy: 'analyze-2020-data.js (enhanced with source URLs)',
                includesSourceUrls: includeSourceUrls,
                purpose: 'Review missing data by visiting source URLs',
                logicReferenceUsed: 'logicReference/missingInfoLogic.json'
            },
            summary: {
                totalFiles: results.total,
                perfectFiles: results.perfect,
                filesWithIssues: results.withIssues,
                perfectPercentage: parseFloat(((results.perfect / results.total) * 100).toFixed(1)),
                issuesPercentage: parseFloat(((results.withIssues / results.total) * 100).toFixed(1))
            },
            issueBreakdown: {
                criticalIssues: results.critical.length,
                importantMissing: results.important.length,
                measurementIssues: results.measurements.length,
                descriptionOnly: results.descriptionOnly.length
            },
            awardsWithIssues: {
                critical: results.critical,
                important: results.important,
                measurements: results.measurements,
                descriptionOnly: results.descriptionOnly
            }
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(enhancedOutput, null, 2));
        console.log(`💾 Enhanced analysis with source URLs saved to: ${outputPath}\n`);
    }
    
    return results;
}

/**
 * Standalone 2020 Analysis Runner
 * 
 * This file provides a simple way to run 2020 data analysis without command line arguments.
 * Just run: node analyze-2020-data.js
 * 
 * Features:
 * - Automatically runs focused analysis (missing data only)
 * - Saves results to timestamped file
 * - Provides interactive menu for different analysis types
 */

async function runAnalysisMenu() {
    console.log('🔍 2020 ORCHID AWARDS DATA ANALYSIS TOOL');
    console.log('='.repeat(50));
    console.log('');
    console.log('Available Analysis Options:');
    console.log('1. 📊 Missing Data Analysis (Focused) - Default');
    console.log('2. 📈 Full Data Analysis (All Files)');
    console.log('3. 🔧 Custom Analysis Options');
    console.log('');
    
    // For now, we'll just run the focused analysis automatically
    // In the future, you could add readline input to make it interactive
    
    console.log('🚀 Running Missing Data Analysis (Focused Mode) with Source URLs for Review...\n');
    
    try {
        const results = await analyze2020DataWithSourceUrls(true, true, true); // focusedMode=true, saveToFile=true, includeSourceUrls=true
        
        console.log('\n✅ Analysis Complete!');
        console.log(`📊 Results Summary:`);
        console.log(`   • Total Files: ${results.total}`);
        console.log(`   • Perfect Files: ${results.perfect} (${((results.perfect / results.total) * 100).toFixed(1)}%)`);
        console.log(`   • Files with Issues: ${results.withIssues} (${((results.withIssues / results.total) * 100).toFixed(1)}%)`);
        
        if (results.withIssues > 0) {
            console.log(`\n🚨 Issue Breakdown:`);
            console.log(`   • Critical Issues: ${results.critical.length}`);
            console.log(`   • Important Missing: ${results.important.length}`);
            console.log(`   • Measurement Issues: ${results.measurements.length}`);
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        process.exit(1);
    }
}

/**
 * Run specific analysis type
 * @param {string} type - 'focused', 'full', or 'custom'
 * @param {boolean} saveFile - Whether to save to file
 */
async function runSpecificAnalysis(type = 'focused', saveFile = true) {
    console.log(`🔍 Running ${type} analysis for 2020 data...`);
    
    const focusedMode = type !== 'full';
    
    try {
        const results = await analyze2020Data(focusedMode, saveFile);
        return results;
    } catch (error) {
        console.error(`❌ ${type} analysis failed:`, error.message);
        throw error;
    }
}

/**
 * Quick focused analysis (most common use case)
 */
async function quickMissingDataAnalysis() {
    console.log('🎯 QUICK MISSING DATA ANALYSIS - 2020 (with source URLs for review)');
    console.log('='.repeat(60));
    
    try {
        const results = await analyze2020DataWithSourceUrls(true, true, true);
        
        // Quick summary
        const issueCount = results.withIssues;
        const criticalCount = results.critical.length;
        
        console.log('\n📊 QUICK SUMMARY:');
        if (issueCount === 0) {
            console.log('   🎉 All files are perfect!');
        } else {
            console.log(`   ⚠️  ${issueCount} files need attention`);
            if (criticalCount > 0) {
                console.log(`   🚨 ${criticalCount} critical issues requiring immediate fix`);
            }
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Quick analysis failed:', error.message);
        throw error;
    }
}

// Main execution logic
async function main() {
    // Check if we're being called with any arguments to determine behavior
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Default: run the interactive menu
        await runAnalysisMenu();
    } else if (args[0] === '--quick') {
        // Quick analysis
        await quickMissingDataAnalysis();
    } else if (args[0] === '--full') {
        // Full analysis
        await runSpecificAnalysis('full', true);
    } else if (args[0] === '--focused') {
        // Focused analysis (same as default, but explicit)
        await runSpecificAnalysis('focused', true);
    } else if (args[0] === '--no-save') {
        // Analysis without saving to file
        await runSpecificAnalysis('focused', false);
    } else if (args[0] === '--no-urls') {
        // Analysis without source URLs (faster)
        await analyze2020Data(true, true);
    } else {
        console.log('❓ Unknown option:', args[0]);
        console.log('');
        console.log('Available options:');
        console.log('  node analyze-2020-data.js          # Default menu');
        console.log('  node analyze-2020-data.js --quick   # Quick summary');
        console.log('  node analyze-2020-data.js --full    # Full analysis');
        console.log('  node analyze-2020-data.js --focused # Focused (missing data only)');
        console.log('  node analyze-2020-data.js --no-save # No file output');
        console.log('  node analyze-2020-data.js --no-urls  # Faster analysis without source URLs');
    }
}

// Only run main if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = {
    runAnalysisMenu,
    runSpecificAnalysis,
    quickMissingDataAnalysis,
    analyze2020DataWithSourceUrls,
    readJsonData
};