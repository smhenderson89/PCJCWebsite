const fs = require('fs');
const path = require('path');

// Path to the awards directory and consolidated issues
const awardsDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2022/data/json');
const issuesFilePath = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2022/data/errorChecking/2022-consolidated-issues.json');

console.log('🔍 Verifying corrections applied to 2022 awards...');

try {
    const issuesData = JSON.parse(fs.readFileSync(issuesFilePath, 'utf8'));
    
    // Get all awards that had issues
    const allIssueAwards = {
        ...issuesData.awardIssues.recoverable,
        ...issuesData.awardIssues.problematic
    };
    
    let resolvedCount = 0;
    let stillNeedWorkCount = 0;
    const stillNeedWork = [];
    
    console.log('\n📋 Checking each award that had issues:');
    
    for (const [awardId, issueInfo] of Object.entries(allIssueAwards)) {
        const awardFilePath = path.join(awardsDir, `${awardId}.json`);
        
        if (!fs.existsSync(awardFilePath)) {
            console.log(`   ❌ ${awardId}: File not found`);
            stillNeedWork.push({ awardId, issues: ['File not found'] });
            stillNeedWorkCount++;
            continue;
        }
        
        const awardData = JSON.parse(fs.readFileSync(awardFilePath, 'utf8'));
        const remainingIssues = [];
        
        // Check each issue reported
        for (const issue of issueInfo.issues) {
            const fieldValue = awardData[issue.field];
            
            if (issue.type === 'missing_critical' && (fieldValue === null || fieldValue === undefined)) {
                remainingIssues.push(`${issue.field}: still missing`);
            } else if (issue.type === 'empty_string' && (fieldValue === null || fieldValue === undefined || fieldValue === '')) {
                remainingIssues.push(`${issue.field}: still empty`);
            } else if (issue.type === 'null_value' && fieldValue === null) {
                remainingIssues.push(`${issue.field}: still null`);
            }
        }
        
        if (remainingIssues.length === 0) {
            console.log(`   ✅ ${awardId}: All issues resolved`);
            resolvedCount++;
        } else {
            console.log(`   ⚠️  ${awardId}: ${remainingIssues.join(', ')}`);
            stillNeedWork.push({ awardId, issues: remainingIssues, correction: issueInfo.correction });
            stillNeedWorkCount++;
        }
    }
    
    console.log('\n📊 Verification Summary:');
    console.log(`   ✅ Fully resolved: ${resolvedCount} awards`);
    console.log(`   ⚠️  Still need work: ${stillNeedWorkCount} awards`);
    
    if (stillNeedWork.length > 0) {
        console.log('\n🎯 Remaining work needed:');
        for (const item of stillNeedWork) {
            console.log(`   • ${item.awardId}: ${item.issues.join(', ')}`);
            if (item.correction) {
                console.log(`     Correction notes: ${item.correction}`);
            }
        }
    }
    
    // Show current data for verification
    console.log('\n🔍 Sample verification - checking a few corrected awards:');
    const sampleAwards = ['20225262', '20225318', '20225404'];
    
    for (const awardId of sampleAwards) {
        const awardFilePath = path.join(awardsDir, `${awardId}.json`);
        if (fs.existsSync(awardFilePath)) {
            const awardData = JSON.parse(fs.readFileSync(awardFilePath, 'utf8'));
            console.log(`   ${awardId}:`);
            console.log(`     Date: ${awardData.date || 'null'}`);
            console.log(`     Location: ${awardData.location || 'null'}`);
            console.log(`     Award: ${awardData.award || 'null'}`);
            console.log(`     Points: ${awardData.awardpoints || 'null'}`);
        }
    }
    
} catch (error) {
    console.error('❌ Error verifying corrections:', error.message);
    process.exit(1);
}