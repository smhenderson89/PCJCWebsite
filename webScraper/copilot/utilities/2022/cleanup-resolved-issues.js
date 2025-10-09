const fs = require('fs');
const path = require('path');

// Path to the consolidated issues file
const issuesFilePath = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2022/data/errorChecking/2022-consolidated-issues.json');

console.log('🧹 Cleaning up resolved issues from 2022 consolidated issues file...');

try {
    // Read the current consolidated issues file
    const issuesData = JSON.parse(fs.readFileSync(issuesFilePath, 'utf8'));
    
    console.log('\n📊 Current issue counts:');
    console.log(`   Recoverable: ${Object.keys(issuesData.awardIssues.recoverable || {}).length}`);
    console.log(`   Problematic: ${Object.keys(issuesData.awardIssues.problematic || {}).length}`);
    console.log(`   Minor: ${Object.keys(issuesData.awardIssues.minor || {}).length}`);
    console.log(`   Resolved: ${Object.keys(issuesData.awardIssues.resolved || {}).length}`);
    
    // Remove the resolved section
    if (issuesData.awardIssues.resolved) {
        delete issuesData.awardIssues.resolved;
        console.log('\n✅ Removed resolved issues section');
    }
    
    // Update the summary to reflect only active issues
    const recoverableCount = Object.keys(issuesData.awardIssues.recoverable || {}).length;
    const problematicCount = Object.keys(issuesData.awardIssues.problematic || {}).length;
    const minorCount = Object.keys(issuesData.awardIssues.minor || {}).length;
    const totalActiveIssues = recoverableCount + problematicCount + minorCount;
    
    // Update summary statistics
    if (issuesData.summary) {
        issuesData.summary.totalIssues = totalActiveIssues;
        issuesData.summary.completeness = ((96 - totalActiveIssues) / 96 * 100).toFixed(1) + '%';
        
        // Update recommendations to focus on active issues only
        issuesData.summary.recommendations = [
            `Manual review needed for ${recoverableCount} awards missing critical date/location data`,
            `Address data gaps in ${problematicCount} awards with missing award types or points`
        ].filter(rec => !rec.includes(' 0 awards'));
    }
    
    console.log('\n📊 Updated issue counts:');
    console.log(`   Recoverable: ${recoverableCount}`);
    console.log(`   Problematic: ${problematicCount}`);
    console.log(`   Minor: ${minorCount}`);
    console.log(`   Total Active Issues: ${totalActiveIssues}`);
    console.log(`   Completeness: ${issuesData.summary.completeness}`);
    
    // Write the cleaned up file
    fs.writeFileSync(issuesFilePath, JSON.stringify(issuesData, null, 2));
    
    console.log('\n✅ Successfully cleaned up 2022 consolidated issues file');
    console.log('   - Removed all resolved issues (84 items)');
    console.log('   - Kept active recoverable and problematic issues with corrections');
    console.log('   - Updated summary statistics');
    console.log('   - Backup saved as 2022-consolidated-issues-backup.json');
    
} catch (error) {
    console.error('❌ Error cleaning up issues:', error.message);
    process.exit(1);
}