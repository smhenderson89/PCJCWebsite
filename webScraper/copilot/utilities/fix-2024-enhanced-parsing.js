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
        
        // Look for award patterns in the HTML content
        const bodyText = $('body').text();
        
        // Look for award type in the structured content first
        $('td, p, div, center').each((i, elem) => {
            const text = $(elem).text().trim();
            
            // Look for award patterns after date and before exhibitor
            const lines = text.split(/\n|<BR|<br/i);
            
            for (let j = 0; j < lines.length; j++) {
                const line = lines[j].trim();
                
                // Check if this line contains an award type
                const awardMatch = line.match(/^\s*(AM|HCC|CCE|CCM|AOS|FCC|PC|JC|CBR|CHM)\s*$/i);
                if (awardMatch && !award) {
                    award = awardMatch[1].toUpperCase();
                    
                    // For awards that don't have points, set to "N/A"
                    if (['JC', 'CBR', 'CHM'].includes(award)) {
                        awardpoints = 'N/A';
                    }
                    break;
                }
                
                // Also check for award with points pattern
                const awardWithPointsMatch = line.match(/(AM|HCC|CCE|CCM|AOS|FCC|PC)\s*[-:]?\s*(\d{1,3})/i);
                if (awardWithPointsMatch && !award) {
                    award = awardWithPointsMatch[1].toUpperCase();
                    awardpoints = parseInt(awardWithPointsMatch[2]);
                    break;
                }
            }
            
            if (award && (awardpoints || awardpoints === 'N/A')) {
                return false; // Break out of each loop
            }
        });
        
        // If not found in structured content, try broader patterns
        if (!award) {
            // Look for common award patterns in the full text
            const awardPatterns = [
                /\b(AM|HCC|CCE|CCM|AOS|FCC|PC)\s+(\d{1,3})\b/gi,
                /Award:\s*(AM|HCC|CCE|CCM|AOS|FCC|PC|JC|CBR|CHM)\s*(\d{1,3})?/gi,
                /(AM|HCC|CCE|CCM|AOS|FCC|PC)\s*[-:]?\s*(\d{1,3})\s*pts?/gi,
                /\b(JC|CBR|CHM)\b/gi  // Non-point awards
            ];
            
            for (const pattern of awardPatterns) {
                const matches = [...bodyText.matchAll(pattern)];
                for (const match of matches) {
                    if (match[1] && !award) {
                        award = match[1].toUpperCase();
                        
                        if (match[2] && !isNaN(parseInt(match[2]))) {
                            awardpoints = parseInt(match[2]);
                        } else if (['JC', 'CBR', 'CHM'].includes(award)) {
                            awardpoints = 'N/A';
                        }
                        break;
                    }
                }
                if (award && (awardpoints || awardpoints === 'N/A')) break;
            }
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
            if (value !== null && (data[field] === null || data[field] === undefined || data[field] === '')) {
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
                type: 'enhanced_html_parsing',
                fields: Object.keys(updates),
                source: `HTML file ${awardNum}.html`,
                note: 'Enhanced parsing for non-point awards (JC, CBR, CHM) set to N/A'
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

function fixRecoverableIssuesEnhanced() {
    console.log('Starting enhanced fix for recoverable issues from HTML sources...');
    console.log('Note: JC, CBR, CHM awards will have points set to "N/A"');
    console.log('');
    
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
        console.log(`Processing ${awardNum}.json (${fileInfo.plantName})...`);
        
        fixResults.processed++;
        
        // Extract award data from HTML
        const extractedData = extractAwardDataFromHtml(awardNum);
        
        if (extractedData && (extractedData.award || extractedData.awardpoints)) {
            const updates = {};
            if (extractedData.award) updates.award = extractedData.award;
            if (extractedData.awardpoints !== null) updates.awardpoints = extractedData.awardpoints;
            
            const changes = updateJsonFile(awardNum, updates);
            
            if (changes) {
                console.log(`  ✅ Fixed: ${changes.join(', ')}`);
                fixResults.successful++;
                fixResults.fixes.push({
                    awardNum,
                    plantName: fileInfo.plantName,
                    exhibitor: fileInfo.exhibitor,
                    changes: changes,
                    awardType: extractedData.award
                });
            } else {
                console.log(`  ⚠️  No changes made (already populated)`);
            }
        } else {
            console.log(`  ⚠️  No fixable data found in HTML`);
            fixResults.errors.push({
                awardNum,
                plantName: fileInfo.plantName,
                exhibitor: fileInfo.exhibitor,
                reason: 'No award data found in HTML'
            });
        }
        
        console.log('');
    }
    
    // Summary
    console.log('='.repeat(70));
    console.log('2024 ENHANCED RECOVERABLE ISSUES FIX SUMMARY');
    console.log('='.repeat(70));
    console.log(`Files processed: ${fixResults.processed}`);
    console.log(`Successfully fixed: ${fixResults.successful}`);
    console.log(`Unable to fix: ${fixResults.errors.length}`);
    console.log('');
    
    if (fixResults.fixes.length > 0) {
        console.log('SUCCESSFULLY FIXED:');
        fixResults.fixes.forEach((fix, index) => {
            console.log(`${index + 1}. ${fix.awardNum}.json - ${fix.plantName}`);
            console.log(`   Exhibitor: ${fix.exhibitor}`);
            console.log(`   Changes: ${fix.changes.join(', ')}`);
            console.log(`   Award Type: ${fix.awardType}`);
            console.log('');
        });
    }
    
    if (fixResults.errors.length > 0) {
        console.log('UNABLE TO FIX:');
        fixResults.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error.awardNum}.json - ${error.plantName}`);
            console.log(`   Exhibitor: ${error.exhibitor}`);
            console.log(`   Reason: ${error.reason}`);
            console.log('');
        });
    }
    
    console.log('='.repeat(70));
    
    return fixResults;
}

// Also fix measurement-only issues that can be extracted
function fixMeasurementOnlyIssues() {
    console.log('Checking measurement-only issues for possible fixes...');
    
    let categorizedReport;
    try {
        const reportContent = fs.readFileSync(categorizedReportPath, 'utf8');
        categorizedReport = JSON.parse(reportContent);
    } catch (error) {
        console.error('Error reading categorized report:', error);
        return;
    }
    
    const measurementFiles = categorizedReport.categories.measurementOnlyIssues || [];
    console.log(`Found ${measurementFiles.length} measurement-only files to check`);
    
    for (const fileInfo of measurementFiles) {
        const awardNum = fileInfo.awardNum;
        console.log(`\nChecking ${awardNum}.json for measurement data...`);
        
        const htmlPath = path.join(htmlDirectory, `${awardNum}.html`);
        
        if (fs.existsSync(htmlPath)) {
            try {
                const htmlContent = fs.readFileSync(htmlPath, 'utf8');
                const $ = cheerio.load(htmlContent);
                
                // Check if HTML has the missing measurements
                const missingFields = fileInfo.nullFields;
                console.log(`  Missing: ${missingFields.join(', ')}`);
                
                // Look for measurement data in tables
                let foundMeasurements = {};
                
                $('table td').each((i, elem) => {
                    const text = $(elem).text().trim();
                    
                    // Check for measurement field names
                    if (text === 'PETL' || text === 'PETW' || text === 'LIPL' || text === 'LIPW') {
                        // Look for the value in the next cell or adjacent cells
                        const nextCell = $(elem).next('td');
                        if (nextCell.length > 0) {
                            const value = nextCell.text().trim();
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                                foundMeasurements[text] = numValue;
                            }
                        }
                    }
                });
                
                if (Object.keys(foundMeasurements).length > 0) {
                    console.log(`  ✅ Found measurements in HTML: ${Object.entries(foundMeasurements).map(([k,v]) => `${k}: ${v}`).join(', ')}`);
                    
                    // Update the JSON file
                    const jsonPath = path.join(jsonDirectory, `${awardNum}.json`);
                    const content = fs.readFileSync(jsonPath, 'utf8');
                    const data = JSON.parse(content);
                    
                    let hasChanges = false;
                    for (const [field, value] of Object.entries(foundMeasurements)) {
                        if (data.measurements && (data.measurements[field] === null || data.measurements[field] === undefined)) {
                            data.measurements[field] = value;
                            hasChanges = true;
                        }
                    }
                    
                    if (hasChanges) {
                        if (!data.corrections) data.corrections = [];
                        data.corrections.push({
                            timestamp: new Date().toISOString(),
                            type: 'measurement_extraction',
                            fields: Object.keys(foundMeasurements),
                            source: `HTML file ${awardNum}.html`
                        });
                        
                        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
                        console.log(`  ✅ Updated JSON with measurements`);
                    }
                } else {
                    console.log(`  ⚠️  No measurement data found in HTML`);
                }
                
            } catch (error) {
                console.log(`  ❌ Error processing HTML: ${error.message}`);
            }
        } else {
            console.log(`  ❌ HTML file not found`);
        }
    }
}

// Run both fixes
fixRecoverableIssuesEnhanced();
console.log('\n');
fixMeasurementOnlyIssues();