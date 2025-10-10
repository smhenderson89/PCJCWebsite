const fs = require('fs');
const path = require('path');

// Configuration
const JSON_DIR = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2019/data/json');
const HTML_DIR = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2019/html');
const ISSUES_FILE = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2019/data/2019-categorized-issues.json');

console.log('🔧 Applying 2019 Fix Strategies...\n');

// Enhanced HTML parsing functions
function extractFieldsFromHTML(htmlContent, awardNum) {
    const fixes = {};
    
    try {
        // Extract award type and points (e.g., "HCC 76", "AM 85")
        const awardMatch = htmlContent.match(/<BR CLEAR="ALL">\s*([A-Z]{2,3}\s*\d+)\s*<BR CLEAR="ALL">/);
        if (awardMatch) {
            const awardStr = awardMatch[1].trim();
            fixes.award = awardStr;
            
            // Extract numeric points
            const pointsMatch = awardStr.match(/(\d+)$/);
            if (pointsMatch) {
                fixes.awardpoints = parseInt(pointsMatch[1]);
            }
        }
        
        // Extract location (show name)
        const locationMatch = htmlContent.match(/<FONT SIZE="\+1"\s*>\s*([^<]+?)\s*-\s*([^<]+Show[^<]*)/i);
        if (locationMatch) {
            fixes.location = locationMatch[2].trim();
        }
        
        // Extract cross information
        const crossInfo = extractCrossInfo(htmlContent);
        if (crossInfo) {
            fixes.cross = crossInfo;
        }
        
        // Extract measurements from tables
        const measurements = extractMeasurements(htmlContent);
        if (Object.keys(measurements).length > 0) {
            fixes.measurements = measurements;
        }
        
        // Extract variety/cultivar info from title if available
        const titleMatch = htmlContent.match(/<TITLE[^>]*>\s*([^<]+)\s*<\/TITLE>/i);
        if (titleMatch) {
            const title = titleMatch[1];
            
            // Look for variety (v. something)
            const varietyMatch = title.match(/v\.\s+([a-z]+)/i);
            if (varietyMatch && !fixes.species) {
                fixes.species = varietyMatch[1];
            }
            
            // Look for clone name in quotes
            const cloneMatch = title.match(/'([^']+)'/);
            if (cloneMatch) {
                fixes.clone = cloneMatch[1];
            }
        }
        
    } catch (error) {
        console.log(`   ⚠️  Error extracting from ${awardNum}: ${error.message}`);
    }
    
    return fixes;
}

// Extract measurements from HTML tables
function extractMeasurements(htmlContent) {
    const measurements = {};
    
    try {
        // Extract basic measurements (NS, NSV, DSW, etc.)
        const measurementRegex = /<TD[^>]*>\s*&nbsp;([A-Z]+)\s*<\/TD>\s*<TD[^>]*>\s*&nbsp;<FONT[^>]*>([0-9.]+)<\/FONT>\s*<\/TD>/gi;
        let match;
        
        while ((match = measurementRegex.exec(htmlContent)) !== null) {
            const fieldName = match[1].trim();
            const value = parseFloat(match[2]);
            
            if (!isNaN(value)) {
                measurements[fieldName] = value;
            }
        }
        
        // Extract flower/bud counts
        const flowerCountRegex = /<TD[^>]*>\s*&nbsp;#\s*flwrs\s*<\/TD>\s*<TD[^>]*>\s*<P><CENTER><FONT[^>]*>(\d+)<\/FONT><\/CENTER><\/TD>/i;
        const flowerMatch = htmlContent.match(flowerCountRegex);
        if (flowerMatch) {
            measurements.numFlowers = parseInt(flowerMatch[1]);
        }
        
        const budCountRegex = /<TD[^>]*>\s*&nbsp;#\s*buds\s*<\/TD>\s*<TD[^>]*>\s*<P><CENTER><FONT[^>]*>(\d+)<\/FONT><\/CENTER><\/TD>/i;
        const budMatch = htmlContent.match(budCountRegex);
        if (budMatch) {
            measurements.numBuds = parseInt(budMatch[1]);
        }
        
        const inflCountRegex = /<TD[^>]*>\s*&nbsp;#\s*infl\s*<\/TD>\s*<TD[^>]*>\s*<P><CENTER><FONT[^>]*>(\d+)<\/FONT><\/CENTER><\/TD>/i;
        const inflMatch = htmlContent.match(inflCountRegex);
        if (inflMatch) {
            measurements.numInflorescences = parseInt(inflMatch[1]);
        }
        
        // Determine measurement type based on available fields
        if (measurements.LIPW || measurements.LIPL || measurements.LSW || measurements.LSL) {
            measurements.type = "Lip&LateralSepal";
        } else if (measurements.PCHW || measurements.PCHL) {
            measurements.type = "Pouch";
        } else if (measurements.SYNSW || measurements.SYNSL) {
            measurements.type = "Synsepal";
        } else if (Object.keys(measurements).length > 1) {
            measurements.type = "Standard";
        }
        
    } catch (error) {
        console.log(`   ⚠️  Error extracting measurements: ${error.message}`);
    }
    
    return measurements;
}

// Extract proper cross information
function extractCrossInfo(htmlContent) {
    // Look for "species" line between BR tags - this should be first
    const speciesPattern = /<BR CLEAR="ALL">\s*(species)\s*<BR CLEAR="ALL">/i;
    const speciesMatch = htmlContent.match(speciesPattern);
    if (speciesMatch) {
        return 'species';
    }
    
    // Alternative pattern - look for species after the plant name
    const alternativePattern = /<BR CLEAR="ALL">[^<]*<BR CLEAR="ALL">\s*(species|hybrid)\s*<BR CLEAR="ALL">/i;
    const altMatch = htmlContent.match(alternativePattern);
    if (altMatch) {
        return altMatch[1].toLowerCase();
    }
    
    // Check for parenthetical cross (e.g., "(Parent1 x Parent2)")
    const crossMatch = htmlContent.match(/\(([^)]+x[^)]+)\)/);
    if (crossMatch) {
        return crossMatch[1].trim();
    }
    
    // Look for cross pattern like "Parent1 x Parent2" in the header section (avoid URLs)
    const headerCrossMatch = htmlContent.match(/<BR CLEAR="ALL">\s*([A-Za-z][A-Za-z\s]*\s+x\s+[A-Za-z][A-Za-z\s]*)\s*<BR CLEAR="ALL">/);
    if (headerCrossMatch && !headerCrossMatch[1].includes('<') && !headerCrossMatch[1].includes('HREF')) {
        return headerCrossMatch[1].trim();
    }
    
    return null;
}

async function applyFixStrategies() {
    try {
        // Check if issues file exists
        if (!fs.existsSync(ISSUES_FILE)) {
            console.log('❌ Issues file not found. Run analysis first.');
            process.exit(1);
        }
        
        const issuesData = JSON.parse(fs.readFileSync(ISSUES_FILE, 'utf-8'));
        const problematicFiles = issuesData.categories.problematic || [];
        const recoverableFiles = issuesData.categories.recoverable || [];
        const minorFiles = issuesData.categories.minor || [];
        
        const allFiles = [...problematicFiles, ...recoverableFiles, ...minorFiles];
        
        console.log(`📊 Processing ${allFiles.length} files with issues...\n`);
        
        let totalFixes = 0;
        let filesImproved = 0;
        
        for (const fileEntry of allFiles) {
            const awardNum = fileEntry.awardNum;
            const jsonPath = path.join(JSON_DIR, `${awardNum}.json`);
            const htmlPath = path.join(HTML_DIR, `${awardNum}.html`);
            
            if (!fs.existsSync(htmlPath)) {
                console.log(`   ⚠️  ${awardNum}: No HTML file found`);
                continue;
            }
            
            const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
            const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
            
            // Extract missing fields from HTML
            const fixes = extractFieldsFromHTML(htmlContent, awardNum);
            let fileFixes = 0;
            let hasChanges = false;
            
            // Apply fixes
            Object.keys(fixes).forEach(field => {
                if (fixes[field] !== null && fixes[field] !== undefined && fixes[field] !== '') {
                    // Only apply if current field is empty or placeholder
                    const currentValue = jsonData[field];
                    const isEmpty = !currentValue || currentValue === '' || currentValue === 'N/A' || 
                                  (typeof currentValue === 'object' && Object.keys(currentValue).length === 0);
                    
                    if (isEmpty) {
                        jsonData[field] = fixes[field];
                        fileFixes++;
                        hasChanges = true;
                    }
                }
            });
            
            if (hasChanges) {
                // Update metadata
                jsonData.lastModified = new Date().toISOString();
                jsonData.fixesApplied = fileFixes;
                jsonData.fixVersion = '2019-v1.0';
                
                // Save updated file
                fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
                
                console.log(`   ✅ ${awardNum}: Applied ${fileFixes} fixes`);
                totalFixes += fileFixes;
                filesImproved++;
            } else {
                console.log(`   ➡️  ${awardNum}: No fixes needed`);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 FIX STRATEGIES SUMMARY');
        console.log('='.repeat(50));
        console.log(`\n🎯 RESULTS:`);
        console.log(`   Files processed: ${allFiles.length}`);
        console.log(`   Files improved: ${filesImproved}`);
        console.log(`   Total fixes applied: ${totalFixes}`);
        console.log(`   Average fixes per file: ${(totalFixes/allFiles.length).toFixed(1)}`);
        
        console.log(`\n✅ Fix strategies applied successfully!`);
        console.log(`📄 Run analysis again to see improvement statistics.`);
        
    } catch (error) {
        console.error('❌ Error in fix process:', error.message);
        process.exit(1);
    }
}

// Run the fix process
applyFixStrategies();
