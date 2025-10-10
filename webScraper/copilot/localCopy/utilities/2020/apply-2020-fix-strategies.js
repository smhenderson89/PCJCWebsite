const fs = require('fs');
const path = require('path');

// Paths
const issuesFilePath = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2020/data/2020-categorized-issues.json');
const awardsDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2020/data/json');
const htmlDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2020/html');

console.log('🔧 Applying 2021-style fix strategies to 2020 award data...');

// Reuse the successful HTML extraction functions from 2021
function extractExhibitorFromHtml(htmlContent) {
    try {
        // Look for "Exhibited by:" pattern and extract just the name
        const exhibitorMatch = htmlContent.match(/Exhibited by:\s*([^<\n\r]+?)(?:\s*<|$)/i);
        if (exhibitorMatch) {
            let exhibitor = exhibitorMatch[1].trim();
            // Clean up any trailing text that shouldn't be part of the name
            exhibitor = exhibitor.split(/\s+Award\s+/)[0]; // Remove "Award 20205xxx" part
            exhibitor = exhibitor.split(/\s+All awards/)[0]; // Remove "All awards" part
            return exhibitor.trim();
        }
        
        return null;
    } catch (error) {
        console.log(`     Error parsing HTML for exhibitor: ${error.message}`);
        return null;
    }
}

function extractPhotographerFromHtml(htmlContent) {
    try {
        // Look for "Photographer:" pattern and extract just the name
        const photographerMatch = htmlContent.match(/Photographer:\s*([^<\n\r]+?)(?:\s*<|$)/i);
        if (photographerMatch) {
            let photographer = photographerMatch[1].trim();
            // Clean up any trailing text
            photographer = photographer.split(/\s+Award\s+/)[0];
            photographer = photographer.split(/\s+All awards/)[0];
            return photographer.trim();
        }
        
        return null;
    } catch (error) {
        console.log(`     Error parsing HTML for photographer: ${error.message}`);
        return null;
    }
}

function extractAwardFromHtml(htmlContent) {
    try {
        // Look for award pattern like "HCC", "CCE", "AM", etc.
        const awardMatch = htmlContent.match(/(?:Award|Points?):\s*([A-Z]{2,4})\s*(?:[\s-]*(\d+))?/i);
        if (awardMatch) {
            return {
                award: awardMatch[1].trim().toUpperCase(),
                points: awardMatch[2] ? parseInt(awardMatch[2]) : null
            };
        }
        
        // Alternative pattern
        const altMatch = htmlContent.match(/([A-Z]{2,4})\s*[-–]\s*(\d+)\s*points?/i);
        if (altMatch) {
            return {
                award: altMatch[1].trim().toUpperCase(),
                points: parseInt(altMatch[2])
            };
        }
        
        return null;
    } catch (error) {
        console.log(`     Error parsing HTML for award: ${error.message}`);
        return null;
    }
}

function extractGenusSpeciesFromHtml(htmlContent) {
    try {
        // Look for genus and species patterns
        const genusMatch = htmlContent.match(/<h[1-6][^>]*>([A-Z][a-z]+(?:\s+[a-z]+)?)\s+([a-z]+(?:\s+[a-z]+)?)/);
        if (genusMatch) {
            return {
                genus: genusMatch[1].trim(),
                species: genusMatch[2].trim()
            };
        }
        
        // Alternative pattern in title or strong tags
        const altMatch = htmlContent.match(/<(?:title|strong)[^>]*>([A-Z][a-z]+)\s+([a-z]+)/);
        if (altMatch) {
            return {
                genus: altMatch[1].trim(),
                species: altMatch[2].trim()
            };
        }
        
        return null;
    } catch (error) {
        console.log(`     Error parsing HTML for genus/species: ${error.message}`);
        return null;
    }
}

try {
    // Read the issues file
    const issuesData = JSON.parse(fs.readFileSync(issuesFilePath, 'utf8'));
    
    let processedCount = 0;
    let fixedCount = 0;
    let errorCount = 0;
    
    console.log('\n🔍 Applying fixes to 2020 awards:');
    
    // Get all awards that need fixes
    const allAwards = [];
    for (const category of ['recoverable', 'problematic', 'minor']) {
        if (issuesData.categories[category]) {
            allAwards.push(...issuesData.categories[category]);
        }
    }
    
    for (const item of allAwards) {
        const awardNum = item.awardNum;
        const issues = item.issues || [];
        
        if (!awardNum) continue;
        
        try {
            // Find the award file
            const possibleFiles = [
                `${awardNum}.json`,
                `${awardNum}-display.json`
            ];
            
            let awardFilePath = null;
            for (const fileName of possibleFiles) {
                const fullPath = path.join(awardsDir, fileName);
                if (fs.existsSync(fullPath)) {
                    awardFilePath = fullPath;
                    break;
                }
            }
            
            if (!awardFilePath) {
                console.log(`   ❌ ${awardNum}: Award file not found`);
                errorCount++;
                continue;
            }
            
            const awardData = JSON.parse(fs.readFileSync(awardFilePath, 'utf8'));
            let changed = false;
            let changes = [];
            
            console.log(`\n   🔧 ${awardNum}: Processing ${issues.length} issues...`);
            
            // Try to get HTML content for extraction
            const htmlFilePath = path.join(htmlDir, `${awardNum}.html`);
            let htmlContent = null;
            
            if (fs.existsSync(htmlFilePath)) {
                htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
            }
            
            // Process each issue
            for (const issue of issues) {
                const field = issue.field;
                const currentValue = awardData[field];
                
                // Skip if field already has a value
                if (currentValue && currentValue !== "" && currentValue !== null) {
                    continue;
                }
                
                if (!htmlContent) {
                    console.log(`     ⚠️  No HTML source for ${field} extraction`);
                    continue;
                }
                
                // Apply field-specific fixes
                if (field === 'exhibitor') {
                    const exhibitor = extractExhibitorFromHtml(htmlContent);
                    if (exhibitor) {
                        awardData.exhibitor = exhibitor;
                        changed = true;
                        changes.push(`Set exhibitor to "${exhibitor}"`);
                    } else {
                        console.log(`     ⚠️  Could not extract exhibitor from HTML`);
                    }
                }
                
                else if (field === 'photographer') {
                    const photographer = extractPhotographerFromHtml(htmlContent);
                    if (photographer) {
                        awardData.photographer = photographer;
                        changed = true;
                        changes.push(`Set photographer to "${photographer}"`);
                    } else {
                        awardData.photographer = "N/A";
                        changed = true;
                        changes.push("Set photographer to N/A (not found in HTML)");
                    }
                }
                
                else if (field === 'award' || field === 'awardpoints') {
                    const awardInfo = extractAwardFromHtml(htmlContent);
                    if (awardInfo) {
                        if (field === 'award' && awardInfo.award) {
                            awardData.award = awardInfo.award;
                            changed = true;
                            changes.push(`Set award to "${awardInfo.award}"`);
                        }
                        if (field === 'awardpoints' && awardInfo.points) {
                            awardData.awardpoints = awardInfo.points;
                            changed = true;
                            changes.push(`Set awardpoints to ${awardInfo.points}`);
                        }
                    }
                }
                
                else if (field === 'genus' || field === 'species') {
                    const genusSpecies = extractGenusSpeciesFromHtml(htmlContent);
                    if (genusSpecies) {
                        if (field === 'genus' && genusSpecies.genus) {
                            awardData.genus = genusSpecies.genus;
                            changed = true;
                            changes.push(`Set genus to "${genusSpecies.genus}"`);
                        }
                        if (field === 'species' && genusSpecies.species) {
                            awardData.species = genusSpecies.species;
                            changed = true;
                            changes.push(`Set species to "${genusSpecies.species}"`);
                        }
                    }
                }
                
                else if (field === 'cross') {
                    // Look for cross information in HTML
                    const crossMatch = htmlContent.match(/(?:Cross|Parentage):\s*([^<\n\r]+)/i);
                    if (crossMatch) {
                        const cross = crossMatch[1].trim();
                        awardData.cross = cross;
                        changed = true;
                        changes.push(`Set cross to "${cross}"`);
                    }
                }
            }
            
            // Save changes
            if (changed) {
                // Add change log entry
                if (!awardData.changeLog) {
                    awardData.changeLog = [];
                }
                
                awardData.changeLog.push({
                    timestamp: new Date().toISOString(),
                    field: "multiple",
                    changes: changes,
                    source: "automated-2020-fix-extraction",
                    reason: `Applied 2021-style fix strategies to extract missing data from HTML`
                });
                
                fs.writeFileSync(awardFilePath, JSON.stringify(awardData, null, 2));
                
                console.log(`     ✅ Applied: ${changes.join(', ')}`);
                fixedCount++;
            } else {
                console.log(`     ℹ️  No fixes could be applied`);
            }
            
            processedCount++;
            
        } catch (error) {
            console.log(`   ❌ ${awardNum}: Error - ${error.message}`);
            errorCount++;
        }
    }
    
    console.log('\n📊 2020 Fix Summary:');
    console.log(`   📁 Awards processed: ${processedCount}`);
    console.log(`   🔧 Awards fixed: ${fixedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ✅ Success rate: ${((processedCount - errorCount) / processedCount * 100).toFixed(1)}%`);
    
    console.log('\n🎉 2020 fix process complete! Re-run analysis to see improvements.');
    
} catch (error) {
    console.error('❌ Error in 2020 fix process:', error.message);
    process.exit(1);
}