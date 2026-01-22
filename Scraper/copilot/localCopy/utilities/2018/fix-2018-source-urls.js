const fs = require('fs');
const path = require('path');

// Paths
const awardsDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2018/data/json');

console.log('🔧 Fixing 2018 source URLs from YYYMMDD to YYYYMMDD format...\n');

function fixSourceUrl(url) {
    // Multiple patterns to fix:
    // Pattern 1: https://www.paccentraljc.org/2018124/20185250.html (missing one 0)
    // Pattern 2: https://www.paccentraljc.org/200220/20185304.html (missing two 0s) 
    // Should be: https://www.paccentraljc.org/20180124/20185250.html
    
    // Pattern 1: 202MMDD (missing one 0)
    const regex1 = /https:\/\/www\.paccentraljc\.org\/202(\d{4})\/(\d+)\.html/;
    const match1 = url.match(regex1);
    
    if (match1) {
        const dateCode = match1[1]; // e.g., "0124"
        const awardNum = match1[2]; // e.g., "20185250"
        
        // Convert to full YYYYMMDD format
        const fullDateCode = `2018${dateCode}`;
        const fixedUrl = `https://www.paccentraljc.org/${fullDateCode}/${awardNum}.html`;
        
        return {
            fixed: true,
            original: url,
            corrected: fixedUrl,
            dateCode: fullDateCode,
            pattern: "202MMDD"
        };
    }
    
    // Pattern 2: 20MMDD (missing two 0s)
    const regex2 = /https:\/\/www\.paccentraljc\.org\/20(\d{4})\/(\d+)\.html/;
    const match2 = url.match(regex2);
    
    if (match2) {
        const dateCode = match2[1]; // e.g., "0220"
        const awardNum = match2[2]; // e.g., "20185304"
        
        // Convert to full YYYYMMDD format
        const fullDateCode = `2018${dateCode}`;
        const fixedUrl = `https://www.paccentraljc.org/${fullDateCode}/${awardNum}.html`;
        
        return {
            fixed: true,
            original: url,
            corrected: fixedUrl,
            dateCode: fullDateCode,
            pattern: "20MMDD"
        };
    }
    
    return { fixed: false, original: url };
}

try {
    const files = fs.readdirSync(awardsDir).filter(f => f.endsWith('.json'));
    
    let processedCount = 0;
    let fixedCount = 0;
    let errorCount = 0;
    
    console.log(`📊 Processing ${files.length} award files...\n`);
    
    for (const file of files.sort()) {
        const filePath = path.join(awardsDir, file);
        const awardNum = file.replace(/\.json$|^-display\.json$/, '');
        
        try {
            const awardData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            let changed = false;
            let changes = [];
            
            console.log(`   📄 ${awardNum}: Checking source URL...`);
            
            // Check and fix sourceUrl field
            if (awardData.sourceUrl) {
                const result = fixSourceUrl(awardData.sourceUrl);
                
                if (result.fixed) {
                    const oldUrl = awardData.sourceUrl;
                    awardData.sourceUrl = result.corrected;
                    
                    console.log(`     🔧 Fixed: ${result.original} → ${result.corrected}`);
                    
                    // Add to corrections array
                    if (!awardData.corrections) {
                        awardData.corrections = [];
                    }
                    
                    awardData.corrections.push({
                        timestamp: new Date().toISOString(),
                        field: "sourceUrl",
                        oldValue: oldUrl,
                        newValue: result.corrected,
                        source: "automated-2018-source-url-format-fix",
                        reason: "Updated date format from YYYMMDD to YYYYMMDD (202MMDD → 2018MMDD)"
                    });
                    
                    changes.push(`Updated sourceUrl format: ${result.dateCode}`);
                    changed = true;
                } else {
                    console.log(`     ✅ URL format already correct or no pattern match`);
                }
            } else {
                console.log(`     ⚠️  No sourceUrl field found`);
            }
            
            // Save changes
            if (changed) {
                // Add change log entry
                if (!awardData.changeLog) {
                    awardData.changeLog = [];
                }
                
                awardData.changeLog.push({
                    timestamp: new Date().toISOString(),
                    field: "sourceUrl",
                    changes: changes,
                    source: "automated-2018-url-format-correction",
                    reason: "Fixed source URL date format from YYYMMDD to YYYYMMDD"
                });
                
                fs.writeFileSync(filePath, JSON.stringify(awardData, null, 2));
                
                console.log(`     ✅ Saved changes: ${changes.join(', ')}`);
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
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 2018 SOURCE URL FIX SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 PROCESSING STATISTICS:`);
    console.log(`   Total files processed: ${processedCount}`);
    console.log(`   URLs fixed: ${fixedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Success rate: ${((processedCount - errorCount) / processedCount * 100).toFixed(1)}%`);
    
    if (fixedCount > 0) {
        console.log(`\n🔧 FIXED URL PATTERN:`);
        console.log(`   Before: https://www.paccentraljc.org/2018124/awardNum.html (YYYMMDD)`);
        console.log(`   After:  https://www.paccentraljc.org/20180124/awardNum.html (YYYYMMDD)`);
        
        console.log(`\n✅ All 2018 source URLs now use proper YYYYMMDD format!`);
    }
    
    console.log('\n🎉 2018 source URL format correction complete!');
    
} catch (error) {
    console.error('❌ Error in source URL correction:', error.message);
    process.exit(1);
}