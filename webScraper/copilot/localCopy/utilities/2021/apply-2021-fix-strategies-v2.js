const fs = require('fs');
const path = require('path');

// Paths
const issuesFilePath = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2021/data/2021-categorized-issues.json');
const awardsDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2021/data/json');
const htmlDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2021/html');

console.log('🔧 Applying 2021 award fixes (improved version) based on defined strategies...');

// Helper function to extract exhibitor from HTML using better regex
function extractExhibitorFromHtml(htmlContent) {
    try {
        // Look for "Exhibited by:" pattern in clean text
        const exhibitorMatch = htmlContent.match(/Exhibited by:\s*([^<\n\r]+)/i);
        if (exhibitorMatch) {
            return exhibitorMatch[1].trim();
        }
        
        return null;
    } catch (error) {
        console.log(`     Error parsing HTML: ${error.message}`);
        return null;
    }
}

// Helper function to extract photographer from HTML using better regex  
function extractPhotographerFromHtml(htmlContent) {
    try {
        // Look for "Photographer:" pattern in clean text
        const photographerMatch = htmlContent.match(/Photographer:\s*([^<\n\r]+)/i);
        if (photographerMatch) {
            return photographerMatch[1].trim();
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
    let needTobyCount = 0;
    
    console.log('\n🔍 Processing awards by fix strategy:');
    
    // Process each category
    for (const category of ['recoverable', 'problematic', 'minor']) {
        if (!issuesData.categories[category]) continue;
        
        console.log(`\n📂 Processing ${category} issues:`);
        
        for (const item of issuesData.categories[category]) {
            const awardNum = item.awardNum;
            const fixStrategy = item.fixStrategy || '';
            
            if (!fixStrategy) {
                console.log(`   ⚠️  ${awardNum}: No fix strategy defined, skipping`);
                continue;
            }
            
            try {
                // Find the award file (could be regular or -display)
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
                
                console.log(`\n   🔧 ${awardNum}: ${fixStrategy}`);
                
                // Strategy 1: Basic photographer/exhibitor fixes
                if (fixStrategy.includes("Photographer is missing from html data") && fixStrategy.includes("Exhibitor is in the source html")) {
                    // Set photographer to N/A
                    if (!awardData.photographer || awardData.photographer === "") {
                        awardData.photographer = "N/A";
                        changed = true;
                        changes.push("Set photographer to N/A");
                    }
                    
                    // Extract exhibitor from HTML
                    const htmlFilePath = path.join(htmlDir, `${awardNum}.html`);
                    if (fs.existsSync(htmlFilePath) && (!awardData.exhibitor || awardData.exhibitor === "")) {
                        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
                        const exhibitor = extractExhibitorFromHtml(htmlContent);
                        
                        if (exhibitor) {
                            awardData.exhibitor = exhibitor;
                            changed = true;
                            changes.push(`Set exhibitor to "${exhibitor}" from HTML`);
                        }
                    }
                }
                
                // Strategy 2: Check HTML source for missing data
                else if (fixStrategy === "Check HTML source for missing data") {
                    const htmlFilePath = path.join(htmlDir, `${awardNum}.html`);
                    if (fs.existsSync(htmlFilePath)) {
                        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
                        
                        // Check for missing exhibitor
                        if (!awardData.exhibitor || awardData.exhibitor === "") {
                            const exhibitor = extractExhibitorFromHtml(htmlContent);
                            if (exhibitor) {
                                awardData.exhibitor = exhibitor;
                                changed = true;
                                changes.push(`Set exhibitor to "${exhibitor}" from HTML`);
                            }
                        }
                        
                        // Check for missing photographer
                        if (!awardData.photographer || awardData.photographer === "") {
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
                
                // Strategy 3: Photographer is in html source
                else if (fixStrategy === "Photographer is in html source, needs to be added") {
                    const htmlFilePath = path.join(htmlDir, `${awardNum}.html`);
                    if (fs.existsSync(htmlFilePath) && (!awardData.photographer || awardData.photographer === "")) {
                        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
                        const photographer = extractPhotographerFromHtml(htmlContent);
                        
                        if (photographer) {
                            awardData.photographer = photographer;
                            changed = true;
                            changes.push(`Set photographer to "${photographer}" from HTML`);
                        }
                    }
                }
                
                // Strategy 4: CCE award fixes
                else if (fixStrategy.includes("Award is CCE")) {
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
                    
                    if (!awardData.photographer || awardData.photographer === "") {
                        awardData.photographer = "N/A";
                        changed = true;
                        changes.push("Set photographer to N/A");
                    }
                    
                    // Extract exhibitor if needed
                    if (fixStrategy.includes("Exhibitor is in HTML") && (!awardData.exhibitor || awardData.exhibitor === "")) {
                        const htmlFilePath = path.join(htmlDir, `${awardNum}.html`);
                        if (fs.existsSync(htmlFilePath)) {
                            const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
                            const exhibitor = extractExhibitorFromHtml(htmlContent);
                            
                            if (exhibitor) {
                                awardData.exhibitor = exhibitor;
                                changed = true;
                                changes.push(`Set exhibitor to "${exhibitor}" from HTML`);
                            }
                        }
                    }
                }
                
                // Strategy 5: HCC award fixes
                else if (fixStrategy.includes("Award is HCC and value is 79")) {
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
                    if (!awardData.photographer || awardData.photographer === "") {
                        awardData.photographer = "N/A";
                        changed = true;
                        changes.push("Set photographer to N/A");
                    }
                    if (fixStrategy.includes("Cross is species") && (!awardData.cross || awardData.cross === "")) {
                        awardData.cross = "species";
                        changed = true;
                        changes.push("Set cross to 'species'");
                    }
                }
                
                // Strategy 6: Species fixes
                else if (fixStrategy.includes("species is species")) {
                    if (!awardData.species || awardData.species === "") {
                        awardData.species = "species";
                        changed = true;
                        changes.push("Set species to 'species'");
                    }
                    
                    // Extract photographer if in source
                    if (fixStrategy.includes("photographer is in source html") && (!awardData.photographer || awardData.photographer === "")) {
                        const htmlFilePath = path.join(htmlDir, `${awardNum}.html`);
                        if (fs.existsSync(htmlFilePath)) {
                            const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
                            const photographer = extractPhotographerFromHtml(htmlContent);
                            
                            if (photographer) {
                                awardData.photographer = photographer;
                                changed = true;
                                changes.push(`Set photographer to "${photographer}" from HTML`);
                            }
                        }
                    }
                }
                
                // Strategy 7: Specific exhibitor assignments
                else if (fixStrategy.includes("Exhibitor is Japheth Ko")) {
                    if (!awardData.exhibitor || awardData.exhibitor === "") {
                        awardData.exhibitor = "Japheth Ko";
                        changed = true;
                        changes.push("Set exhibitor to Japheth Ko");
                    }
                    if (!awardData.photographer || awardData.photographer === "") {
                        awardData.photographer = "N/A";
                        changed = true;
                        changes.push("Set photographer to N/A");
                    }
                }
                
                // Items that need Toby consultation
                if (fixStrategy.includes("Ask Toby") || fixStrategy.includes("Check with Toby") || fixStrategy.includes("Follow up with Toby")) {
                    console.log(`     📋 Needs Toby consultation`);
                    needTobyCount++;
                }
                
                // Save changes if any were made
                if (changed) {
                    // Add change log entry
                    if (!awardData.changeLog) {
                        awardData.changeLog = [];
                    }
                    
                    awardData.changeLog.push({
                        timestamp: new Date().toISOString(),
                        field: "multiple",
                        changes: changes,
                        source: "automated-2021-fix-strategy-v2",
                        reason: `Applied fix strategy: ${fixStrategy.substring(0, 100)}...`
                    });
                    
                    fs.writeFileSync(awardFilePath, JSON.stringify(awardData, null, 2));
                    
                    console.log(`     ✅ Applied: ${changes.join(', ')}`);
                    fixedCount++;
                } else {
                    console.log(`     ℹ️  No changes needed or applied`);
                }
                
                processedCount++;
                
            } catch (error) {
                console.log(`   ❌ ${awardNum}: Error - ${error.message}`);
                errorCount++;
            }
        }
    }
    
    console.log('\n📊 Fix Application Summary:');
    console.log(`   📁 Awards processed: ${processedCount}`);
    console.log(`   🔧 Awards fixed: ${fixedCount}`);
    console.log(`   📋 Need Toby consultation: ${needTobyCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ✅ Success rate: ${((processedCount - errorCount) / processedCount * 100).toFixed(1)}%`);
    
    // Generate a summary of what still needs attention
    console.log('\n🎯 Summary of items needing Toby consultation:');
    for (const category of ['recoverable', 'problematic', 'minor']) {
        if (!issuesData.categories[category]) continue;
        
        for (const item of issuesData.categories[category]) {
            const fixStrategy = item.fixStrategy || '';
            if (fixStrategy.includes("Ask Toby") || fixStrategy.includes("Check with Toby") || fixStrategy.includes("Follow up with Toby")) {
                console.log(`   📋 ${item.awardNum}: ${fixStrategy}`);
            }
        }
    }
    
} catch (error) {
    console.error('❌ Error applying 2021 fixes:', error.message);
    process.exit(1);
}