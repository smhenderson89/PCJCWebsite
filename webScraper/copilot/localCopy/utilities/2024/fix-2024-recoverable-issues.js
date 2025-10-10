const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const jsonDirectory = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2024/json';
const htmlDirectory = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2024/html';
const categorizedReportPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2024/2024-categorized-issues.json';

function extractAwardDataFromHtml(awardNum) {
    const htmlPath = path.join(htmlDirectory, `${awardNum}.html`);
    
    if (!fs.existsSync(htmlPath)) {
        console.log(`  ❌ HTML file not found: ${awardNum}.html`);
        return null;
    }
    
    try {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const $ = cheerio.load(htmlContent);
        
        let award = null;
        let awardpoints = null;
        
        // Look for award patterns in the HTML
        const bodyText = $('body').text();
        
        // Common award patterns
        const awardPatterns = [
            /\b(AM|HCC|CCE|CCM|AOS|FCC|PC|JC|CBR|CHM)\s+(\d{1,3})\b/gi,
            /Award:\s*(AM|HCC|CCE|CCM|AOS|FCC|PC|JC|CBR|CHM)\s*(\d{1,3})/gi,
            /(AM|HCC|CCE|CCM|AOS|FCC|PC|JC|CBR|CHM)\s*[-:]?\s*(\d{1,3})\s*pts?/gi
        ];
        
        for (const pattern of awardPatterns) {
            const matches = [...bodyText.matchAll(pattern)];
            for (const match of matches) {
                if (match[1] && match[2]) {
                    award = match[1].toUpperCase();
                    awardpoints = parseInt(match[2]);
                    break;
                }
            }
            if (award && awardpoints) break;
        }
        
        // Also look in specific HTML elements
        if (!award || !awardpoints) {
            $('p, td, div, span').each((i, elem) => {
                const text = $(elem).text().trim();
                
                // Check for award patterns
                const awardMatch = text.match(/(AM|HCC|CCE|CCM|AOS|FCC|PC|JC|CBR|CHM)\s*[-:]?\s*(\d{1,3})/i);
                if (awardMatch && !award) {
                    award = awardMatch[1].toUpperCase();
                    if (awardMatch[2]) {
                        awardpoints = parseInt(awardMatch[2]);
                    }
                }
            });
        }
        
        return { award, awardpoints };
        
    } catch (error) {
        console.log(`  ❌ Error reading HTML for ${awardNum}:`, error.message);
        return null;
    }
}

function updateJsonFile(awardNum, updates) {
    const jsonPath = path.join(jsonDirectory, `${awardNum}.json`);
    
    try {
        const content = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(content);
        
        let hasChanges = false;
        const changes = [];
        
        // Apply updates
        for (const [field, value] of Object.entries(updates)) {
            if (value !== null && (data[field] === null || data[field] === undefined)) {
                changes.push(`${field}: ${data[field]} → "${value}"`);
                data[field] = value;
                hasChanges = true;
            }
        }
        
        if (hasChanges) {
            // Add correction metadata
            if (!data.corrections) {
                data.corrections = [];
            }
            data.corrections.push({
                timestamp: new Date().toISOString(),
                type: 'automated_fix_from_html',
                fields: Object.keys(updates),
                source: `HTML file ${awardNum}.html`
            });
            
            fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
            return changes;
        }
        
        return null;
        
    } catch (error) {
        console.error(`  ❌ Error updating ${awardNum}.json:`, error);
        return null;
    }
}

function fix2024RecoverableIssues() {
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
    console.log('');
    
    const fixResults = {
        processed: 0,
        successful: 0,
        failed: 0,
        fixes: [],
        errors: []
    };
    
    for (const fileInfo of recoverableFiles) {
        const awardNum = fileInfo.awardNum;
        console.log(`Processing ${awardNum}.json (${awardNum})...`);
        
        fixResults.processed++;
        
        // Extract award data from HTML
        const extractedData = extractAwardDataFromHtml(awardNum);
        
        if (extractedData && (extractedData.award || extractedData.awardpoints)) {
            const updates = {};
            if (extractedData.award) updates.award = extractedData.award;
            if (extractedData.awardpoints) updates.awardpoints = extractedData.awardpoints;
            
            const changes = updateJsonFile(awardNum, updates);
            
            if (changes) {
                console.log(`  ✅ Fixed: ${changes.join(', ')}`);
                fixResults.successful++;
                fixResults.fixes.push({
                    awardNum,
                    plantName: fileInfo.plantName,
                    changes: changes
                });
            } else {
                console.log(`  ⚠️  No changes made`);
            }
        } else {
            console.log(`  ⚠️  No fixable data found in HTML`);
            fixResults.errors.push({
                awardNum,
                plantName: fileInfo.plantName,
                reason: 'No award data found in HTML'
            });
        }
        
        console.log('');
    }
    
    // Summary
    console.log('='.repeat(60));
    console.log('2024 RECOVERABLE ISSUES FIX SUMMARY');
    console.log('='.repeat(60));
    console.log(`Files processed: ${fixResults.processed}`);
    console.log(`Successfully fixed: ${fixResults.successful}`);
    console.log(`Errors: ${fixResults.errors.length}`);
    console.log('');
    
    if (fixResults.fixes.length > 0) {
        console.log('SUCCESSFULLY FIXED:');
        fixResults.fixes.forEach((fix, index) => {
            console.log(`${index + 1}. ${fix.awardNum}.json - ${fix.changes.join(', ')}`);
        });
    }
    
    if (fixResults.errors.length > 0) {
        console.log('');
        console.log('UNABLE TO FIX:');
        fixResults.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.awardNum}.json - ${error.reason}`);
        });
    }
    
    console.log('='.repeat(60));
    
    return fixResults;
}

fix2024RecoverableIssues();