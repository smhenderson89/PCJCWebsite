/**
 * 2022 Fix Photo Names Script
 * Rename image files from 2022XXXX-1_540.jpg or 2022XXXX_540.jpg to 2022XXXX.jpg
 */

const fs = require('fs');
const path = require('path');

// Path to the 2022 images directory
const imagesPath = path.join(__dirname, '../../paccentraljc.org/awards/2022/images');

/**
 * Main function to fix photo names
 */
function fixPhotoNames() {
    console.log('🔧 2022 FIX PHOTO NAMES');
    console.log('=' .repeat(60));
    console.log(`📁 Images directory: ${imagesPath}\n`);
    
    if (!fs.existsSync(imagesPath)) {
        console.error(`❌ Images directory not found: ${imagesPath}`);
        return;
    }

    const imageFiles = fs.readdirSync(imagesPath)
        .filter(file => file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg'))
        .sort();

    if (imageFiles.length === 0) {
        console.error('❌ No image files found');
        return;
    }

    console.log(`📋 Found ${imageFiles.length} image files to check\n`);

    const results = {
        totalFiles: imageFiles.length,
        renamed: 0,
        alreadyCorrect: 0,
        errors: []
    };

    const renameOperations = [];

    for (const [index, filename] of imageFiles.entries()) {
        console.log(`📸 [${index + 1}/${imageFiles.length}] Checking ${filename}...`);
        
        // Pattern 1: 2022XXXX-1_540.jpg
        const pattern1Match = filename.match(/^(2022\d{4})-1_540\.(jpg|jpeg)$/i);
        
        // Pattern 2: 2022XXXX_540.jpg  
        const pattern2Match = filename.match(/^(2022\d{4})_540\.(jpg|jpeg)$/i);
        
        if (pattern1Match) {
            const awardNum = pattern1Match[1];
            const newFilename = `${awardNum}.jpg`;
            const oldPath = path.join(imagesPath, filename);
            const newPath = path.join(imagesPath, newFilename);
            
            if (fs.existsSync(newPath) && newPath !== oldPath) {
                console.log(`   ⚠️  Target filename already exists: ${newFilename}`);
                results.errors.push({
                    originalFile: filename,
                    targetFile: newFilename,
                    issue: 'Target filename already exists'
                });
            } else {
                renameOperations.push({
                    oldPath: oldPath,
                    newPath: newPath,
                    oldName: filename,
                    newName: newFilename,
                    pattern: 'Pattern 1 (-1_540)'
                });
                console.log(`   ✅ Will rename to: ${newFilename} (${pattern1Match[0]} → ${awardNum}.jpg)`);
            }
        } else if (pattern2Match) {
            const awardNum = pattern2Match[1];
            const newFilename = `${awardNum}.jpg`;
            const oldPath = path.join(imagesPath, filename);
            const newPath = path.join(imagesPath, newFilename);
            
            if (fs.existsSync(newPath) && newPath !== oldPath) {
                console.log(`   ⚠️  Target filename already exists: ${newFilename}`);
                results.errors.push({
                    originalFile: filename,
                    targetFile: newFilename,
                    issue: 'Target filename already exists'
                });
            } else {
                renameOperations.push({
                    oldPath: oldPath,
                    newPath: newPath,
                    oldName: filename,
                    newName: newFilename,
                    pattern: 'Pattern 2 (_540)'
                });
                console.log(`   ✅ Will rename to: ${newFilename} (${pattern2Match[0]} → ${awardNum}.jpg)`);
            }
        } else {
            console.log(`   ➡️  Already correct format or different pattern`);
            results.alreadyCorrect++;
        }
    }

    // Perform the rename operations
    if (renameOperations.length > 0) {
        console.log(`\n🔄 Performing ${renameOperations.length} rename operations...\n`);
        
        for (const [index, operation] of renameOperations.entries()) {
            try {
                console.log(`📝 [${index + 1}/${renameOperations.length}] Renaming ${operation.oldName} → ${operation.newName}`);
                fs.renameSync(operation.oldPath, operation.newPath);
                console.log(`   ✅ Success (${operation.pattern})`);
                results.renamed++;
                
            } catch (error) {
                console.log(`   ❌ Failed: ${error.message}`);
                results.errors.push({
                    originalFile: operation.oldName,
                    targetFile: operation.newName,
                    issue: `Rename failed: ${error.message}`
                });
            }
        }
    } else {
        console.log('\n📋 No rename operations needed');
    }

    // Print summary
    console.log('\n' + '=' .repeat(80));
    console.log('📊 2022 PHOTO NAME FIX SUMMARY');
    console.log('=' .repeat(80));
    console.log(`📈 PROCESSING STATS:`);
    console.log(`   Total files checked: ${results.totalFiles}`);
    console.log(`   Files renamed: ${results.renamed}`);
    console.log(`   Already correct: ${results.alreadyCorrect}`);
    console.log(`   Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
        console.log(`\n⚠️  ERRORS:`);
        results.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.originalFile} → ${error.targetFile}: ${error.issue}`);
        });
    }

    // Save detailed report
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportPath = path.join(reportsDir, '2022-photo-rename-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalFiles: results.totalFiles,
            filesRenamed: results.renamed,
            alreadyCorrect: results.alreadyCorrect,
            errors: results.errors.length
        },
        renameOperations: renameOperations.map(op => ({
            oldName: op.oldName,
            newName: op.newName,
            pattern: op.pattern
        })),
        errors: results.errors
    }, null, 2));

    console.log(`\n📊 Detailed report saved: ${reportPath}`);
    
    if (results.errors.length === 0 && results.renamed > 0) {
        console.log('\n🎉 ALL PHOTO NAMES FIXED SUCCESSFULLY!');
    } else if (results.renamed === 0) {
        console.log('\n✨ All photo names were already in correct format!');
    } else {
        console.log(`\n⚠️  ${results.errors.length} issues encountered. Check report for details.`);
    }
}

// Run the photo name fix if this script is executed directly
if (require.main === module) {
    fixPhotoNames();
}

module.exports = { fixPhotoNames };
