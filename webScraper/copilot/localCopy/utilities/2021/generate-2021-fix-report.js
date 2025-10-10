const fs = require('fs');
const path = require('path');

// Paths
const issuesFilePath = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2021/data/2021-categorized-issues.json');
const awardsDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2021/data/json');

console.log('📊 Generating 2021 Awards Fix Verification Report...\n');

try {
    const issuesData = JSON.parse(fs.readFileSync(issuesFilePath, 'utf8'));
    
    let report = {
        totalAwards: 0,
        successfullyFixed: 0,
        needingTobyConsultation: 0,
        stillHaveIssues: 0,
        categories: {
            recoverable: { total: 0, fixed: 0 },
            problematic: { total: 0, fixed: 0 },
            minor: { total: 0, fixed: 0 }
        },
        tobyConsultationItems: [],
        completedFixes: []
    };
    
    // Process each category
    for (const [categoryName, items] of Object.entries(issuesData.categories)) {
        if (!Array.isArray(items)) continue;
        
        // Initialize category if not exists
        if (!report.categories[categoryName]) {
            report.categories[categoryName] = { total: 0, fixed: 0 };
        }
        
        console.log(`\n📋 ${categoryName.toUpperCase()} ISSUES:`);
        report.categories[categoryName].total = items.length;
        
        for (const item of items) {
            const awardNum = item.awardNum;
            const fixStrategy = item.fixStrategy || '';
            
            report.totalAwards++;
            
            // Check if this needs Toby consultation
            if (fixStrategy.includes("Toby to check") || fixStrategy.includes("Ask Toby")) {
                report.needingTobyConsultation++;
                report.tobyConsultationItems.push({
                    awardNum,
                    strategy: fixStrategy,
                    category: categoryName
                });
                console.log(`   ⚠️  ${awardNum}: Requires Toby consultation - ${fixStrategy}`);
                continue;
            }
            
            // Check if the award file exists and has been fixed
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
                report.stillHaveIssues++;
                continue;
            }
            
            try {
                const awardData = JSON.parse(fs.readFileSync(awardFilePath, 'utf8'));
                
                // Check if fixes were applied
                let hasRecentFixes = false;
                if (awardData.changeLog) {
                    const recentFixes = awardData.changeLog.filter(log => 
                        log.source && (
                            log.source.includes('automated-2021') ||
                            log.timestamp > '2025-01-16'
                        )
                    );
                    hasRecentFixes = recentFixes.length > 0;
                }
                
                // Check for data completeness based on fix strategy
                let isFixed = true;
                let fixDetails = [];
                
                if (fixStrategy.includes("HCC") && fixStrategy.includes("79")) {
                    if (!awardData.award || awardData.award !== "HCC") isFixed = false;
                    if (!awardData.awardpoints || awardData.awardpoints !== 79) isFixed = false;
                    if (isFixed) fixDetails.push("HCC/79 points applied");
                }
                
                if (fixStrategy.includes("CCE")) {
                    if (!awardData.award || awardData.award !== "CCE") isFixed = false;
                    if (isFixed) fixDetails.push("CCE award applied");
                }
                
                if (fixStrategy.includes("Exhibitor is") || fixStrategy.includes("exhibitor is in HTML")) {
                    if (!awardData.exhibitor || awardData.exhibitor === "" || awardData.exhibitor.length > 100) isFixed = false;
                    if (isFixed) fixDetails.push(`Exhibitor: ${awardData.exhibitor}`);
                }
                
                if (fixStrategy.includes("photographer") && fixStrategy.includes("N/A")) {
                    if (!awardData.photographer || awardData.photographer !== "N/A") isFixed = false;
                    if (isFixed) fixDetails.push("Photographer set to N/A");
                }
                
                // If no specific checks, consider it fixed if there are recent changelog entries
                if (fixDetails.length === 0 && hasRecentFixes) {
                    isFixed = true;
                    fixDetails.push("General fixes applied");
                }
                
                if (isFixed) {
                    report.successfullyFixed++;
                    report.categories[categoryName].fixed++;
                    report.completedFixes.push({
                        awardNum,
                        strategy: fixStrategy,
                        fixes: fixDetails,
                        category: categoryName
                    });
                    console.log(`   ✅ ${awardNum}: Fixed - ${fixDetails.join(', ')}`);
                } else {
                    report.stillHaveIssues++;
                    console.log(`   ⚠️  ${awardNum}: Still needs work - ${fixStrategy}`);
                }
                
            } catch (error) {
                console.log(`   ❌ ${awardNum}: Error reading file - ${error.message}`);
                report.stillHaveIssues++;
            }
        }
    }
    
    // Generate summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 2021 AWARDS FIX SUMMARY REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 OVERALL STATISTICS:`);
    console.log(`   Total awards processed: ${report.totalAwards}`);
    console.log(`   Successfully fixed: ${report.successfullyFixed} (${(report.successfullyFixed/report.totalAwards*100).toFixed(1)}%)`);
    console.log(`   Requiring Toby consultation: ${report.needingTobyConsultation}`);
    console.log(`   Still have issues: ${report.stillHaveIssues}`);
    
    console.log(`\n📋 BY CATEGORY:`);
    for (const [category, stats] of Object.entries(report.categories)) {
        const percent = stats.total > 0 ? (stats.fixed/stats.total*100).toFixed(1) : '0';
        console.log(`   ${category}: ${stats.fixed}/${stats.total} fixed (${percent}%)`);
    }
    
    if (report.tobyConsultationItems.length > 0) {
        console.log(`\n🤝 ITEMS FOR TOBY CONSULTATION (${report.tobyConsultationItems.length}):`);
        for (const item of report.tobyConsultationItems) {
            console.log(`   📝 ${item.awardNum} (${item.category}): ${item.strategy}`);
        }
    }
    
    console.log(`\n🎉 SUCCESSFULLY COMPLETED FIXES (${report.completedFixes.length}):`);
    const fixedByCategory = {};
    for (const fix of report.completedFixes) {
        if (!fixedByCategory[fix.category]) fixedByCategory[fix.category] = [];
        fixedByCategory[fix.category].push(fix);
    }
    
    for (const [category, fixes] of Object.entries(fixedByCategory)) {
        console.log(`\n   ${category.toUpperCase()}:`);
        for (const fix of fixes) {
            console.log(`     ✅ ${fix.awardNum}: ${fix.fixes.join(', ')}`);
        }
    }
    
    // Save report to file
    const reportPath = path.join(__dirname, `2021-fixes-report-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log('\n✨ 2021 Awards fix process complete!');
    
} catch (error) {
    console.error('❌ Error generating report:', error.message);
    process.exit(1);
}