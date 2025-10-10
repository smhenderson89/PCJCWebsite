const fs = require('fs');
const path = require('path');

// File path
const issuesFilePath = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2021/data/2021-categorized-issues.json');

console.log('🧹 Cleaning up 2021-categorized-issues.json by removing fixed awards...\n');

try {
    const issuesData = JSON.parse(fs.readFileSync(issuesFilePath, 'utf8'));
    
    // Awards that were successfully fixed (from our report)
    const fixedAwards = new Set([
        // Recoverable - All 26 were fixed
        '20215301', '20215302', '20215303', '20215304', '20215305',
        '20215308', '20215309', '20215310', '20215311', '20215312',
        '20215313', '20215314', '20215315', '20215316', '20215317',
        '20215318', '20215319', '20215320', '20215321', '20215322',
        '20215323', '20215325', '20215327', '20215329', '20215330',
        '20215331',
        
        // Problematic - 6 out of 7 were fixed (keeping 20215256 for Toby)
        '20215306', '20215307', '20215324', '20215326', '20215328', '20215342',
        
        // Minor - 17 out of 19 were fixed (20215249 file not found, one undefined)
        '20215250', '20215251', '20215253', '20215254', '20215255',
        '20215257', '20215258', '20215332', '20215333', '20215334',
        '20215335', '20215336', '20215337', '20215338', '20215339',
        '20215340', '20215341'
    ]);
    
    // Awards that still need attention
    const stillNeedWork = new Set([
        '20215256', // Needs Toby consultation
        '20215249'  // File not found
    ]);
    
    let originalCount = 0;
    let removedCount = 0;
    let keptCount = 0;
    
    // Clean up each category
    for (const [categoryName, items] of Object.entries(issuesData.categories)) {
        if (!Array.isArray(items)) continue;
        
        console.log(`📋 Processing ${categoryName} category:`);
        const originalLength = items.length;
        originalCount += originalLength;
        
        // Filter out fixed awards
        const filteredItems = items.filter(item => {
            const awardNum = item.awardNum;
            
            if (fixedAwards.has(awardNum)) {
                console.log(`   ✅ Removing fixed award: ${awardNum}`);
                removedCount++;
                return false;
            } else if (stillNeedWork.has(awardNum)) {
                console.log(`   ⚠️  Keeping unfixed award: ${awardNum} - ${item.fixStrategy || 'No strategy'}`);
                keptCount++;
                return true;
            } else {
                console.log(`   ❓ Unknown status for award: ${awardNum} - keeping for safety`);
                keptCount++;
                return true;
            }
        });
        
        // Update the category
        issuesData.categories[categoryName] = filteredItems;
        
        console.log(`   📊 ${categoryName}: ${originalLength} → ${filteredItems.length} (removed ${originalLength - filteredItems.length})\n`);
    }
    
    // Update summary counts
    const newRecoverableCount = issuesData.categories.recoverable ? issuesData.categories.recoverable.length : 0;
    const newProblematicCount = issuesData.categories.problematic ? issuesData.categories.problematic.length : 0;
    const newMinorCount = issuesData.categories.minor ? issuesData.categories.minor.length : 0;
    const newPerfectCount = issuesData.categories.perfect ? issuesData.categories.perfect.length : 0;
    
    // Update metadata
    issuesData.summary = {
        ...issuesData.summary,
        recoverableIssues: newRecoverableCount,
        problematicFiles: newProblematicCount,
        minorIssues: newMinorCount,
        perfectFiles: newPerfectCount,
        lastCleanup: new Date().toISOString(),
        cleanupNote: "Removed successfully fixed awards on " + new Date().toISOString().split('T')[0]
    };
    
    // Add cleanup log entry
    issuesData.cleanupHistory = issuesData.cleanupHistory || [];
    issuesData.cleanupHistory.push({
        timestamp: new Date().toISOString(),
        action: "remove_fixed_awards",
        originalCount: originalCount,
        removedCount: removedCount,
        keptCount: keptCount,
        fixedAwardsList: Array.from(fixedAwards).sort()
    });
    
    // Save the cleaned up file
    fs.writeFileSync(issuesFilePath, JSON.stringify(issuesData, null, 2));
    
    console.log('📊 CLEANUP SUMMARY:');
    console.log(`   Original issues: ${originalCount}`);
    console.log(`   Fixed and removed: ${removedCount}`);
    console.log(`   Still need work: ${keptCount}`);
    console.log(`   Success rate: ${(removedCount/originalCount*100).toFixed(1)}%`);
    
    console.log('\n📋 REMAINING ISSUES BY CATEGORY:');
    console.log(`   Recoverable: ${newRecoverableCount}`);
    console.log(`   Problematic: ${newProblematicCount}`);
    console.log(`   Minor: ${newMinorCount}`);
    console.log(`   Perfect: ${newPerfectCount}`);
    
    if (keptCount > 0) {
        console.log('\n⚠️  REMAINING ITEMS NEEDING ATTENTION:');
        for (const [categoryName, items] of Object.entries(issuesData.categories)) {
            if (Array.isArray(items) && items.length > 0) {
                console.log(`\n   ${categoryName.toUpperCase()}:`);
                for (const item of items) {
                    console.log(`     📝 ${item.awardNum}: ${item.fixStrategy || 'No strategy defined'}`);
                }
            }
        }
    }
    
    console.log(`\n✅ Cleaned up categorized issues file saved to: ${issuesFilePath}`);
    console.log('🎉 2021 issues cleanup complete!');
    
} catch (error) {
    console.error('❌ Error cleaning up issues file:', error.message);
    process.exit(1);
}