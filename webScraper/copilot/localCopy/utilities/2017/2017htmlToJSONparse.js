const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const jsonDirectory = path.join(__dirname, '../../paccentraljc.org/awards/2017/data/json');
const htmlDirectory = path.join(__dirname, '../../paccentraljc.org/awards/2017/html');
const categorizedReportPath = path.join(__dirname, '../../paccentraljc.org/awards/2017/data/2017-categorized-issues.json');

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
                type: 'enhanced_html_parsing_2017',
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

function fix2017RecoverableIssuesEnhanced() {
    console.log('Starting enhanced fix for 2017 recoverable issues from HTML sources...');
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
    console.log('2017 ENHANCED RECOVERABLE ISSUES FIX SUMMARY');
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
function fix2017MeasurementOnlyIssues() {
    console.log('Checking 2017 measurement-only issues for possible fixes...');
    
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
                    if (text === 'PETL' || text === 'PETW' || text === 'LIPL' || text === 'LIPW' || 
                        text === 'NS' || text === 'NSV' || text === 'DSL' || text === 'DSW' ||
                        text === 'LSL' || text === 'LSW') {
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
                            type: 'measurement_extraction_2017',
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

// Comprehensive HTML to JSON parsing function
function extractFullAwardDataFromHtml(awardNum) {
    const htmlPath = path.join(htmlDirectory, `${awardNum}.html`);
    
    if (!fs.existsSync(htmlPath)) {
        console.log(`  ❌ HTML file not found: ${awardNum}.html`);
        return null;
    }
    
    try {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const $ = cheerio.load(htmlContent);
        
        const extractedData = {
            awardNum: awardNum,
            award: '',
            awardpoints: null,
            location: '',
            date: '',
            genus: '',
            species: '',
            clone: '',
            cross: '',
            exhibitor: '',
            photographer: '',
            photo: `images/${awardNum}.jpg`,
            measurements: {
                type: '',
                numFlowers: 0,
                numBuds: 0,
                description: ''
            },
            scrapedDate: new Date().toISOString(),
            sourceUrl: `https://www.paccentraljc.org/${awardNum.substring(0,8)}/${awardNum}.html`,
            htmlReference: `localCopy/paccentraljc.org/awards/2017/html/${awardNum}.html`,
            year: 2017
        };

        // Extract from main content area - use the full body text approach
        const bodyText = $('body').text();
        
        // Also try the font-specific approach
        const mainFont = $('table').first().find('font[size="+1"]').first();
        
        if (mainFont.length > 0) {
            const htmlText = mainFont.html();
            const lines = htmlText
                .split(/<br[^>]*>/i)
                .map(line => cheerio.load(line).text().trim())
                .filter(line => line && !line.includes('Award '));

            console.log(`📝 Found ${lines.length} content lines to parse:`);
            lines.forEach((line, i) => console.log(`   ${i}: "${line}"`));

            // Process each line
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                console.log(`\n🔍 Processing line ${i}: "${line}"`);

                // Date and location (first line)
                if (i === 0 && line.includes(' - ')) {
                    const parts = line.split(' - ');
                    extractedData.date = parts[0].trim();
                    extractedData.location = parts.slice(1).join(' - ').trim();
                    console.log(`   📅 Date: "${extractedData.date}"`);
                    console.log(`   📍 Location: "${extractedData.location}"`);
                    continue;
                }

                // Plant name with clone
                const plantMatch = line.match(/^([A-Z][a-z]+)\s+(.+?)\s+'([^']+)'$/);
                if (plantMatch) {
                    extractedData.genus = plantMatch[1];
                    extractedData.species = plantMatch[2].trim();
                    extractedData.clone = plantMatch[3];
                    console.log(`   🌸 Plant: ${extractedData.genus} ${extractedData.species} '${extractedData.clone}'`);
                    continue;
                }

                // Plant name without clone
                const plantMatch2 = line.match(/^([A-Z][a-z]+)\s+([a-z][a-zA-Z\s]+)$/);
                if (plantMatch2 && !line.includes('by:')) {
                    extractedData.genus = plantMatch2[1];
                    extractedData.species = plantMatch2[2].trim();
                    console.log(`   🌸 Plant: ${extractedData.genus} ${extractedData.species}`);
                    continue;
                }

                // Cross/parentage
                const crossMatch = line.match(/^\((.+)\)$/);
                if (crossMatch) {
                    extractedData.cross = crossMatch[1].trim();
                    console.log(`   🧬 Cross: (${extractedData.cross})`);
                    continue;
                }

                // Award and points (separate)
                const awardMatch = line.match(/^(AM|HCC|CCM|FCC|AQ|CBR|JC|AD|CHM)\s+(\d+)$/i);
                if (awardMatch) {
                    extractedData.award = awardMatch[1].toUpperCase();
                    extractedData.awardpoints = parseInt(awardMatch[2]);
                    console.log(`   🏆 Award: ${extractedData.award} ${extractedData.awardpoints}`);
                    continue;
                }

                // Award without points
                const awardOnlyMatch = line.match(/^(JC|CBR|CHM)$/i);
                if (awardOnlyMatch) {
                    extractedData.award = awardOnlyMatch[1].toUpperCase();
                    extractedData.awardpoints = 'N/A';
                    console.log(`   🏆 Award: ${extractedData.award} (no points)`);
                    continue;
                }

                // Exhibitor
                const exhibitorMatch = line.match(/^Exhibited by:\s*(.+)$/i);
                if (exhibitorMatch) {
                    extractedData.exhibitor = exhibitorMatch[1].trim();
                    console.log(`   👤 Exhibitor: "${extractedData.exhibitor}"`);
                    continue;
                }

                // Photographer
                const photographerMatch = line.match(/^Photographer:\s*(.+)$/i);
                if (photographerMatch) {
                    extractedData.photographer = photographerMatch[1].trim();
                    console.log(`   📷 Photographer: "${extractedData.photographer}"`);
                    continue;
                }
                
                console.log(`   ❓ Unmatched line: "${line}"`);
            }
        }
        
        // Additional exhibitor extraction - sometimes it's after the main content
        if (!extractedData.exhibitor) {
            console.log(`\n🔍 Exhibitor not found in main content, checking full body...`);
            const exhibitorBodyMatch = bodyText.match(/Exhibited by[:\s]+([^\n\r<]+)/i);
            if (exhibitorBodyMatch) {
                extractedData.exhibitor = exhibitorBodyMatch[1].trim();
                console.log(`   👤 Found exhibitor in body: "${extractedData.exhibitor}"`);
            }
        }

        // Extract measurements
        console.log(`\n📏 Looking for measurements table...`);
        const measurementTable = $('table').eq(1).find('table').first();
        if (measurementTable.length > 0) {
            console.log(`✅ Found measurements table`);
            measurementTable.find('tr').each((i, row) => {
                const $row = $(row);
                const cells = $row.find('td');
                
                // Process pairs of cells (label, value, label, value)
                for (let j = 0; j < cells.length; j += 2) {
                    if (cells[j] && cells[j + 1]) {
                        const label = $(cells[j]).text().trim();
                        const value = $(cells[j + 1]).text().trim();
                        const numValue = parseFloat(value);
                        
                        console.log(`   📊 ${label}: "${value}" (${numValue})`);
                        
                        if (!isNaN(numValue) && ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'LIPL'].includes(label)) {
                            extractedData.measurements[label] = numValue;
                        }
                    }
                }
            });
        } else {
            console.log(`❌ No measurements table found`);
        }

        // Extract flower info (# flowers, buds, inflorescences) and store in measurements
        console.log(`\n🌺 Looking for flower information...`);
        // Look for the table that contains "# flwrs", "# buds", "# infl"
        $('table').each((tableIndex, table) => {
            const $table = $(table);
            const tableText = $table.text();
            
            if (tableText.includes('flwrs') || tableText.includes('buds') || tableText.includes('infl')) {
                console.log(`✅ Found flower info table at index ${tableIndex}`);
                
                $table.find('tr').each((i, row) => {
                    const $row = $(row);
                    const cells = $row.find('td');
                    
                    for (let j = 0; j < cells.length; j += 2) {
                        if (cells[j] && cells[j + 1]) {
                            const label = $(cells[j]).text().trim();
                            const value = $(cells[j + 1]).text().trim();
                            const numValue = parseInt(value);
                            
                            console.log(`   🌼 ${label}: "${value}" (${numValue})`);
                            
                            if (!isNaN(numValue)) {
                                if (label.includes('flwrs')) extractedData.measurements.numFlowers = numValue;
                                if (label.includes('buds')) extractedData.measurements.numBuds = numValue;
                                if (label.includes('infl')) extractedData.measurements.numInflorescences = numValue;
                            }
                        }
                    }
                });
                return false; // Break out of each loop after finding the table
            }
        });

        // Extract description from the last table and store in measurements object
        console.log(`\n📝 Looking for description...`);
        // Find the table with "Description:" in it
        $('table').each((index, table) => {
            const $table = $(table);
            const tableText = $table.text();
            
            if (tableText.includes('Description:')) {
                console.log(`   📝 Found description in table ${index}`);
                const descText = $table.find('td').text().trim();
                const descMatch = descText.match(/Description\s*:\s*(.+)$/is);
                
                if (descMatch) {
                    extractedData.measurements.description = descMatch[1].trim();
                    console.log(`✅ Description: "${extractedData.measurements.description.substring(0, 100)}..."`);
                } else {
                    // Try to get text after "Description:" without regex
                    const parts = descText.split(/Description\s*:\s*/i);
                    if (parts.length > 1) {
                        extractedData.measurements.description = parts[1].trim();
                        console.log(`✅ Description (split method): "${extractedData.measurements.description.substring(0, 100)}..."`);
                    }
                }
                return false; // Break out of each loop
            }
        });

        // Set default values for missing fields specific to 2017
        console.log(`\n🔧 Setting default values for missing fields...`);
        if (!extractedData.photographer || extractedData.photographer.trim() === '') {
            extractedData.photographer = 'N/A';
            console.log(`   📷 No photographer found, set to: "N/A"`);
        }
        
        // Set measurement type based on what measurements we have
        const measurementFields = ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'LIPL'];
        const foundMeasurements = measurementFields.filter(field => extractedData.measurements[field] !== undefined);
        
        if (foundMeasurements.length > 0) {
            // Check if we have lip measurements
            const hasLipMeasurements = ['LIPW', 'LIPL'].some(field => extractedData.measurements[field] !== undefined);
            const hasSepalMeasurements = ['NS', 'NSV', 'LSW', 'LSL'].some(field => extractedData.measurements[field] !== undefined);
            
            if (hasLipMeasurements && hasSepalMeasurements) {
                extractedData.measurements.type = 'Lip&LateralSepal';
            } else if (hasLipMeasurements) {
                extractedData.measurements.type = 'Lip';
            } else if (hasSepalMeasurements) {
                extractedData.measurements.type = 'LateralSepal';
            } else {
                extractedData.measurements.type = 'General';
            }
            console.log(`   📏 Measurement type detected: "${extractedData.measurements.type}"`);
        }
        
        // Log final field status
        console.log(`\n📋 Final field status:`);
        console.log(`   Photographer: "${extractedData.photographer}"`);
        console.log(`   Exhibitor: "${extractedData.exhibitor || 'Not found'}"`);
        console.log(`   Photo: "${extractedData.photo}"`);
        console.log(`   Description: ${extractedData.measurements.description ? 'Found' : 'Not found'}`);
        console.log(`   Measurements: ${foundMeasurements.length} fields`);

        return extractedData;
        
    } catch (error) {
        console.log(`  ❌ Error reading HTML for ${awardNum}:`, error.message);
        return null;
    }
}

// Test function for single file
function testSingleFile(awardNum) {
    console.log(`🧪 Testing HTML to JSON parsing for award ${awardNum}\n`);
    
    // Ensure directories exist
    const dataDir = path.join(__dirname, '../../paccentraljc.org/awards/2017/data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(jsonDirectory)) {
        fs.mkdirSync(jsonDirectory, { recursive: true });
    }
    
    const extractedData = extractFullAwardDataFromHtml(awardNum);
    
    if (extractedData) {
        const outputPath = path.join(jsonDirectory, `${awardNum}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(extractedData, null, 2));
        
        console.log(`\n✅ Successfully parsed and saved JSON to: ${outputPath}`);
        console.log(`\n📊 Summary of extracted data:`);
        console.log(`   Award Number: ${extractedData.awardNum}`);
        console.log(`   Plant: ${extractedData.genus} ${extractedData.species} ${extractedData.clone ? `'${extractedData.clone}'` : ''}`);
        console.log(`   Cross: ${extractedData.cross || 'N/A'}`);
        console.log(`   Award: ${extractedData.award} ${extractedData.awardpoints}`);
        console.log(`   Date: ${extractedData.date}`);
        console.log(`   Location: ${extractedData.location}`);
        console.log(`   Exhibitor: ${extractedData.exhibitor}`);
        console.log(`   Photographer: ${extractedData.photographer}`);
        console.log(`   Photo: ${extractedData.photo}`);
        console.log(`   Measurements: ${Object.keys(extractedData.measurements).filter(k => !['type', 'numFlowers', 'numBuds', 'description'].includes(k)).length} measurement fields`);
        console.log(`   Measurement Type: ${extractedData.measurements.type}`);
        console.log(`   Flower Count: ${extractedData.measurements.numFlowers}`);
        console.log(`   Bud Count: ${extractedData.measurements.numBuds}`);
        console.log(`   Description: ${extractedData.measurements.description ? 'Yes' : 'No'}`);
        
        return extractedData;
    } else {
        console.log(`❌ Failed to parse ${awardNum}.html`);
        return null;
    }
}

// Run the test if called directly
if (require.main === module) {
    const testAward = process.argv[2] || '20174115';
    testSingleFile(testAward);
} else {
    // Original behavior - run both fixes
    fix2017RecoverableIssuesEnhanced();
    console.log('\n');
    fix2017MeasurementOnlyIssues();
}