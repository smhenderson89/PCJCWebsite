const fs = require('fs');
const path = require('path');

// Configuration
const HTML_DIR = path.join(__dirname, '../../paccentraljc.org/awards/2015/html');

console.log('🧹 Starting 2015 Duplicate File Cleanup Process...\n');

function findDuplicateFiles() {
    const files = fs.readdirSync(HTML_DIR);
    const duplicatePairs = [];
    
    // Find files matching YYYYMMDD pattern (both with and without -index)
    const datePattern = /^(2015\d{4})\.html$/;
    const indexPattern = /^(2015\d{4})-index\.html$/;
    
    const dateFiles = files.filter(file => datePattern.test(file));
    const indexFiles = files.filter(file => indexPattern.test(file));
    
    console.log(`📄 Found ${dateFiles.length} YYYYMMDD.html files`);
    console.log(`📄 Found ${indexFiles.length} YYYYMMDD-index.html files\n`);
    
    // Match pairs
    for (const dateFile of dateFiles) {
        const dateMatch = dateFile.match(datePattern);
        if (dateMatch) {
            const dateStr = dateMatch[1];
            const correspondingIndexFile = `${dateStr}-index.html`;
            
            if (indexFiles.includes(correspondingIndexFile)) {
                duplicatePairs.push({
                    dateStr: dateStr,
                    originalFile: dateFile,
                    indexFile: correspondingIndexFile,
                    originalPath: path.join(HTML_DIR, dateFile),
                    indexPath: path.join(HTML_DIR, correspondingIndexFile)
                });
            }
        }
    }
    
    return duplicatePairs;
}

function compareFiles(file1Path, file2Path) {
    try {
        const content1 = fs.readFileSync(file1Path, 'utf8');
        const content2 = fs.readFileSync(file2Path, 'utf8');
        
        // Remove whitespace differences for comparison
        const normalized1 = content1.replace(/\s+/g, ' ').trim();
        const normalized2 = content2.replace(/\s+/g, ' ').trim();
        
        return normalized1 === normalized2;
    } catch (error) {
        console.error(`Error comparing files: ${error.message}`);
        return false;
    }
}

function cleanupDuplicates() {
    try {
        const duplicatePairs = findDuplicateFiles();
        
        if (duplicatePairs.length === 0) {
            console.log('✅ No duplicate pairs found to clean up');
            return;
        }
        
        console.log(`🔍 Found ${duplicatePairs.length} potential duplicate pairs to verify:\n`);
        
        let identicalCount = 0;
        let differentCount = 0;
        let deletedCount = 0;
        let errorCount = 0;
        
        for (const pair of duplicatePairs) {
            console.log(`📝 Checking ${pair.dateStr}:`);
            console.log(`   Original: ${pair.originalFile}`);
            console.log(`   Index:    ${pair.indexFile}`);
            
            // Compare file contents
            const areIdentical = compareFiles(pair.originalPath, pair.indexPath);
            
            if (areIdentical) {
                console.log(`   ✅ Files are identical - safe to delete original`);
                
                try {
                    // Delete the original file (without -index)
                    fs.unlinkSync(pair.originalPath);
                    console.log(`   🗑️  Deleted: ${pair.originalFile}`);
                    
                    deletedCount++;
                    identicalCount++;
                } catch (deleteError) {
                    console.log(`   ❌ Error deleting ${pair.originalFile}: ${deleteError.message}`);
                    errorCount++;
                }
            } else {
                console.log(`   ⚠️  Files are different - keeping both`);
                differentCount++;
            }
            
            console.log('');
        }
        
        console.log('='.repeat(60));
        console.log('🧹 DUPLICATE FILE CLEANUP SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`\n🎯 RESULTS:`);
        console.log(`   Total duplicate pairs found: ${duplicatePairs.length}`);
        console.log(`   Identical pairs: ${identicalCount}`);
        console.log(`   Different pairs (kept both): ${differentCount}`);
        console.log(`   Files successfully deleted: ${deletedCount}`);
        console.log(`   Errors: ${errorCount}`);
        
        if (deletedCount > 0) {
            console.log(`\n✅ Cleanup complete! Removed ${deletedCount} duplicate files`);
            console.log(`📁 Remaining files use consistent -index naming convention`);
        } else {
            console.log(`\n⚠️  No files were deleted`);
        }
        
        // Create cleanup report
        const report = {
            cleanupDate: new Date().toISOString(),
            year: 2015,
            type: 'duplicate-file-cleanup',
            totalPairs: duplicatePairs.length,
            identicalPairs: identicalCount,
            differentPairs: differentCount,
            filesDeleted: deletedCount,
            errors: errorCount,
            deletedFiles: duplicatePairs
                .filter(pair => fs.existsSync(pair.indexPath) && !fs.existsSync(pair.originalPath))
                .map(pair => pair.originalFile)
        };
        
        const reportPath = path.join(path.dirname(HTML_DIR), 'data', 'duplicate-cleanup-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📋 Cleanup report saved to: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ Error in cleanup process:', error.message);
        process.exit(1);
    }
}

// Run the cleanup process
cleanupDuplicates();