const fs = require('fs');
const path = require('path');

// Paths
const issuesFilePath = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2021/data/2021-categorized-issues.json');
const awardsDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2021/data/json');
const htmlDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2021/html');

console.log('🔧 Cleaning up 2021 award fixes and applying proper corrections...');

// Proper function to extract exhibitor from HTML
function extractExhibitorFromHtml(htmlContent) {
    try {
        // Look for "Exhibited by:" pattern and extract just the name
        const exhibitorMatch = htmlContent.match(/Exhibited by:\s*([^<\n\r]+?)(?:\s*<|$)/i);
        if (exhibitorMatch) {
            let exhibitor = exhibitorMatch[1].trim();
            // Clean up any trailing text that shouldn't be part of the name
            exhibitor = exhibitor.split(/\s+Award\s+/)[0]; // Remove "Award 20215xxx" part
            exhibitor = exhibitor.split(/\s+All awards/)[0]; // Remove "All awards" part
            return exhibitor.trim();
        }
        
        return null;
    } catch (error) {
        console.log(`     Error parsing HTML: ${error.message}`);
        return null;
    }
}

// Proper function to extract photographer from HTML
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
        console.log(`     Error parsing HTML: ${error.message}`);
        return null;
    }
}

try {
    // Read the issues file
    const issuesData = JSON.parse(fs.readFileSync(issuesFilePath, 'utf8'));
    
    let processedCount = 0;
    let fixedCount = 0;
    let errorCount = 0;
    
    console.log('\n🔍 Cleaning up and applying proper fixes:');
    
    // Get all awards that need fixes
    const allAwards = [];
    for (const category of ['recoverable', 'problematic', 'minor']) {
        if (issuesData.categories[category]) {
            allAwards.push(...issuesData.categories[category]);
        }
    }
    
    for (const item of allAwards) {
        const awardNum = item.awardNum;
        const fixStrategy = item.fixStrategy || '';
        
        if (!fixStrategy || !awardNum) continue;
        
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
            
            console.log(`\n   🔧 ${awardNum}: Processing...`);
            
            // Clean up malformed exhibitor data
            if (awardData.exhibitor && awardData.exhibitor.length > 100) {
                console.log(`     🧹 Cleaning up malformed exhibitor data`);
                
                const htmlFilePath = path.join(htmlDir, `${awardNum}.html`);
                if (fs.existsSync(htmlFilePath)) {
                    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
                    const properExhibitor = extractExhibitorFromHtml(htmlContent);
                    
                    if (properExhibitor && properExhibitor.length < 100) {
                        awardData.exhibitor = properExhibitor;
                        changed = true;
                        changes.push(`Fixed exhibitor to "${properExhibitor}"`);
                    }
                }
            }
            
            // Clean up malformed photographer data
            if (awardData.photographer && awardData.photographer.length > 100) {
                console.log(`     🧹 Cleaning up malformed photographer data`);
                
                const htmlFilePath = path.join(htmlDir, `${awardNum}.html`);
                if (fs.existsSync(htmlFilePath)) {
                    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
                    const properPhotographer = extractPhotographerFromHtml(htmlContent);
                    
                    if (properPhotographer && properPhotographer.length < 100) {
                        awardData.photographer = properPhotographer;
                        changed = true;
                        changes.push(`Fixed photographer to "${properPhotographer}"`);
                    } else {
                        awardData.photographer = "N/A";
                        changed = true;
                        changes.push("Set photographer to N/A");
                    }
                }
            }
            
            // Apply specific fixes based on strategies
            if (fixStrategy.includes("Award is HCC and value is 79")) {
                if (!awardData.award || awardData.award === "") {
                    awardData.award = "HCC";
                    changed = true;
                    changes.push("Set award to HCC");
                }
                if (!awardData.awardpoints || awardData.awardpoints === "") {
                    awardData.awardpoints = 79;
                    changed = true;
                    changes.push("Set awardpoints to 79");
                }
                if (fixStrategy.includes("Cross is species") && (!awardData.cross || awardData.cross === "")) {
                    awardData.cross = "species";
                    changed = true;
                    changes.push("Set cross to 'species'");
                }
            }
            
            if (fixStrategy.includes("Award is CCE")) {
                if (!awardData.award || awardData.award === "") {
                    awardData.award = "CCE";
                    changed = true;
                    changes.push("Set award to CCE");
                }
                
                if (fixStrategy.includes("awardpoints if 91") && (!awardData.awardpoints || awardData.awardpoints === "")) {
                    awardData.awardpoints = 91;
                    changed = true;
                    changes.push("Set awardpoints to 91");
                } else if (fixStrategy.includes("awardpoints is 90") && (!awardData.awardpoints || awardData.awardpoints === "")) {
                    awardData.awardpoints = 90;
                    changed = true;
                    changes.push("Set awardpoints to 90");
                }
            }
            
            if (fixStrategy.includes("species is species") && (!awardData.species || awardData.species === "")) {
                awardData.species = "species";
                changed = true;
                changes.push("Set species to 'species'");
            }
            
            if (fixStrategy.includes("Exhibitor is Japheth Ko") && (!awardData.exhibitor || awardData.exhibitor === "")) {
                awardData.exhibitor = "Japheth Ko";
                changed = true;
                changes.push("Set exhibitor to Japheth Ko");
            }
            
            // Ensure photographer is set properly
            if ((!awardData.photographer || awardData.photographer === "") && 
                (fixStrategy.includes("Photographer is N/A") || fixStrategy.includes("photographer is N/A"))) {
                awardData.photographer = "N/A";
                changed = true;
                changes.push("Set photographer to N/A");
            }
            
            // Apply missing data from HTML where needed
            if (fixStrategy === "Check HTML source for missing data" || 
                fixStrategy.includes("Exhibitor is in the source html") ||
                fixStrategy.includes("Exhibitor is in HTML")) {
                
                const htmlFilePath = path.join(htmlDir, `${awardNum}.html`);
                if (fs.existsSync(htmlFilePath)) {
                    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
                    
                    // Check exhibitor
                    if (!awardData.exhibitor || awardData.exhibitor === "" || awardData.exhibitor.length > 100) {
                        const exhibitor = extractExhibitorFromHtml(htmlContent);
                        if (exhibitor) {
                            awardData.exhibitor = exhibitor;
                            changed = true;
                            changes.push(`Set exhibitor to "${exhibitor}" from HTML`);
                        }
                    }
                    
                    // Check photographer
                    if (!awardData.photographer || awardData.photographer === "" || awardData.photographer.length > 100) {
                        const photographer = extractPhotographerFromHtml(htmlContent);
                        if (photographer) {
                            awardData.photographer = photographer;
                            changed = true;
                            changes.push(`Set photographer to "${photographer}" from HTML`);
                        } else {
                            awardData.photographer = "N/A";
                            changed = true;
                            changes.push("Set photographer to N/A (not found in HTML)");
                        }
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
                    source: "automated-2021-cleanup-and-fix",
                    reason: `Cleaned up malformed data and applied proper fixes`
                });
                
                fs.writeFileSync(awardFilePath, JSON.stringify(awardData, null, 2));
                
                console.log(`     ✅ Applied: ${changes.join(', ')}`);
                fixedCount++;
            } else {
                console.log(`     ℹ️  No changes needed`);
            }
            
            processedCount++;
            
        } catch (error) {
            console.log(`   ❌ ${awardNum}: Error - ${error.message}`);
            errorCount++;
        }
    }
    
    console.log('\n📊 Cleanup and Fix Summary:');
    console.log(`   📁 Awards processed: ${processedCount}`);
    console.log(`   🔧 Awards fixed: ${fixedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ✅ Success rate: ${((processedCount - errorCount) / processedCount * 100).toFixed(1)}%`);
    
} catch (error) {
    console.error('❌ Error in cleanup and fix:', error.message);
    process.exit(1);
}