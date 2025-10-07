const fs = require('fs');
const path = require('path');

const jsonDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2025/json';
const htmlDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2025/html';
const categorizedReportPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2025/2025-categorized-issues.json';

function extractAwardFromHtml(awardNum) {
    const htmlFilePath = path.join(htmlDir, `${awardNum}.html`);
    
    try {
        if (!fs.existsSync(htmlFilePath)) {
            return null;
        }
        
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        
        // Look for award patterns like "AM 82", "HCC 77", "CCE 93", "FCC 91", etc.
        // Pattern: Award type followed by optional space and points
        const awardMatch = htmlContent.match(/<BR CLEAR="ALL">\s*([A-Z]{2,4})(\s+(\d+))?\s*<BR/i);
        
        if (awardMatch) {
            const awardType = awardMatch[1].trim();
            const awardPoints = awardMatch[3] ? parseInt(awardMatch[3]) : null;
            
            return {
                award: awardType,
                awardpoints: awardPoints
            };
        }
        
        return null;
    } catch (error) {
        console.error(`Error reading HTML file for ${awardNum}:`, error.message);
        return null;
    }
}

function extractDescriptionFromHtml(awardNum) {
    const htmlFilePath = path.join(htmlDir, `${awardNum}.html`);
    
    try {
        if (!fs.existsSync(htmlFilePath)) {
            return null;
        }
        
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        
        // Look for description patterns - usually in a specific section
        // This is a more complex pattern that would need to be refined based on actual HTML structure
        // For now, return null as descriptions might need manual extraction
        return null;
        
    } catch (error) {
        console.error(`Error reading HTML file for ${awardNum}:`, error.message);
        return null;
    }
}

function fixRecoverableIssues() {
    console.log('Starting to fix recoverable issues from HTML sources...');
    
    // Read the categorized report
    let categorizedReport;
    try {
        const reportContent = fs.readFileSync(categorizedReportPath, 'utf8');
        categorizedReport = JSON.parse(reportContent);
    } catch (error) {
        console.error('Error reading categorized report:', error);
        return;
    }
    
    const recoverableFiles = categorizedReport.categories.recoverableFromHtml || [];
    console.log(`Found ${recoverableFiles.length} recoverable files to process`);
    
    let fixedCount = 0;
    let errorCount = 0;
    const fixLog = [];
    
    recoverableFiles.forEach(fileInfo => {
        const filePath = path.join(jsonDir, fileInfo.fileName);
        const awardNum = fileInfo.awardNum;
        
        try {
            console.log(`\nProcessing ${fileInfo.fileName} (${awardNum})...`);
            
            // Read current JSON
            const jsonContent = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(jsonContent);
            
            // Extract award data from HTML
            const htmlAwardData = extractAwardFromHtml(awardNum);
            
            if (htmlAwardData) {
                let updated = false;
                const changes = [];
                
                // Update award if null and HTML has data
                if (jsonData.award === null && htmlAwardData.award) {
                    jsonData.award = htmlAwardData.award;
                    changes.push(`award: null → "${htmlAwardData.award}"`);
                    updated = true;
                }
                
                // Update awardpoints if null and HTML has data
                if (jsonData.awardpoints === null && htmlAwardData.awardpoints !== null) {
                    jsonData.awardpoints = htmlAwardData.awardpoints;
                    changes.push(`awardpoints: null → ${htmlAwardData.awardpoints}`);
                    updated = true;
                }
                
                if (updated) {
                    // Add correction tracking
                    if (!jsonData.corrections) {
                        jsonData.corrections = [];
                    }
                    
                    jsonData.corrections.push({
                        timestamp: new Date().toISOString(),
                        changes: changes,
                        reason: 'Fixed missing award data from HTML source',
                        source: 'automated-html-extraction'
                    });
                    
                    // Write updated JSON
                    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
                    
                    console.log(`  ✅ Fixed: ${changes.join(', ')}`);
                    fixLog.push({
                        file: fileInfo.fileName,
                        awardNum: awardNum,
                        changes: changes,
                        success: true
                    });
                    fixedCount++;
                } else {
                    console.log(`  ⚠️  No fixable data found in HTML`);
                    fixLog.push({
                        file: fileInfo.fileName,
                        awardNum: awardNum,
                        issue: 'No extractable data in HTML',
                        success: false
                    });
                }
            } else {
                console.log(`  ❌ Could not extract award data from HTML`);
                fixLog.push({
                    file: fileInfo.fileName,
                    awardNum: awardNum,
                    issue: 'Could not parse HTML award data',
                    success: false
                });
                errorCount++;
            }
            
        } catch (error) {
            console.error(`  ❌ Error processing ${fileInfo.fileName}:`, error.message);
            errorCount++;
        }
    });
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('RECOVERABLE ISSUES FIX SUMMARY');
    console.log('='.repeat(60));
    console.log(`Files processed: ${recoverableFiles.length}`);
    console.log(`Successfully fixed: ${fixedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('');
    
    if (fixedCount > 0) {
        console.log('SUCCESSFULLY FIXED:');
        fixLog.filter(entry => entry.success).forEach((entry, index) => {
            console.log(`${index + 1}. ${entry.file} - ${entry.changes.join(', ')}`);
        });
        console.log('');
    }
    
    if (errorCount > 0) {
        console.log('ISSUES ENCOUNTERED:');
        fixLog.filter(entry => !entry.success).forEach((entry, index) => {
            console.log(`${index + 1}. ${entry.file} - ${entry.issue}`);
        });
    }
    
    console.log('='.repeat(60));
    
    return fixLog;
}

fixRecoverableIssues();