/**
 * 2022 Fix JSON Photo References
 * Update JSON files to reference the corrected image filenames
 */

const fs = require('fs');
const path = require('path');

// Paths
const jsonDataPath = path.join(__dirname, '../../paccentraljc.org/awards/2022/data/json');
const imagesPath = path.join(__dirname, '../../paccentraljc.org/awards/2022/images');

/**
 * Check if a file exists (case-insensitive for image extensions)
 * @param {string} filePath - Path to check
 * @returns {string|null} - Actual filename if exists, null otherwise
 */
function findImageFile(basePath, awardNum) {
    const possibleExtensions = ['jpg', 'jpeg', 'JPG', 'JPEG'];
    
    for (const ext of possibleExtensions) {
        const fullPath = path.join(basePath, `${awardNum}.${ext}`);
        if (fs.existsSync(fullPath)) {
            return `${awardNum}.${ext}`;
        }
    }
    
    return null;
}

/**
 * Fix photo reference in JSON data
 * @param {Object} jsonData - The JSON data object
 * @returns {Object} - Object with fixed data and change info
 */
function fixPhotoReference(jsonData) {
    if (!jsonData.photo || !jsonData.awardNum) {
        return { data: jsonData, changed: false, issue: 'Missing photo field or awardNum' };
    }

    const currentPhoto = jsonData.photo;
    const expectedPhotoPath = `images/${jsonData.awardNum}.jpg`;
    
    // Check if photo reference needs updating
    const needsUpdate = currentPhoto !== expectedPhotoPath;
    
    if (needsUpdate) {
        // Verify the correct image file exists
        const actualImageFile = findImageFile(imagesPath, jsonData.awardNum);
        
        if (actualImageFile) {
            const updatedData = {
                ...jsonData,
                photo: `images/${actualImageFile}`
            };
            
            return {
                data: updatedData,
                changed: true,
                oldPhoto: currentPhoto,
                newPhoto: `images/${actualImageFile}`,
                issue: null
            };
        } else {
            return {
                data: jsonData,
                changed: false,
                issue: `Image file not found for ${jsonData.awardNum}`
            };
        }
    }
    
    return { data: jsonData, changed: false, issue: null };
}

/**
 * Main function to fix JSON photo references
 */
function fixJsonPhotoReferences() {
    console.log('🔧 2022 FIX JSON PHOTO REFERENCES');
    console.log('=' .repeat(60));
    
    if (!fs.existsSync(jsonDataPath)) {
        console.error(`❌ JSON directory not found: ${jsonDataPath}`);
        return;
    }

    if (!fs.existsSync(imagesPath)) {
        console.error(`❌ Images directory not found: ${imagesPath}`);
        return;
    }

    const jsonFiles = fs.readdirSync(jsonDataPath)
        .filter(file => file.endsWith('.json'))
        .sort();

    if (jsonFiles.length === 0) {
        console.error('❌ No JSON files found');
        return;
    }

    console.log(`📋 Found ${jsonFiles.length} JSON files to check\n`);

    const results = {
        totalFiles: jsonFiles.length,
        updated: 0,
        alreadyCorrect: 0,
        errors: [],
        updates: []
    };

    for (const [index, file] of jsonFiles.entries()) {
        const filePath = path.join(jsonDataPath, file);
        
        try {
            console.log(`📄 [${index + 1}/${jsonFiles.length}] Checking ${file}...`);
            
            const jsonContent = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(jsonContent);
            
            const fixResult = fixPhotoReference(jsonData);
            
            if (fixResult.issue) {
                console.log(`   ⚠️  ${fixResult.issue}`);
                results.errors.push({
                    file: file,
                    awardNum: jsonData.awardNum || 'Unknown',
                    issue: fixResult.issue
                });
            } else if (fixResult.changed) {
                console.log(`   📝 Updating photo reference:`);
                console.log(`      Old: ${fixResult.oldPhoto}`);
                console.log(`      New: ${fixResult.newPhoto}`);
                
                // Write the updated JSON file
                fs.writeFileSync(filePath, JSON.stringify(fixResult.data, null, 2));
                
                results.updated++;
                results.updates.push({
                    file: file,
                    awardNum: jsonData.awardNum,
                    oldPhoto: fixResult.oldPhoto,
                    newPhoto: fixResult.newPhoto
                });
                
                console.log(`   ✅ Updated successfully`);
            } else {
                console.log(`   ✅ Already correct`);
                results.alreadyCorrect++;
            }
            
        } catch (error) {
            console.log(`📄 [${index + 1}/${jsonFiles.length}] ${file} - Error: ${error.message}`);
            results.errors.push({
                file: file,
                issue: `Processing error: ${error.message}`
            });
        }
    }

    // Print summary
    console.log('\n' + '=' .repeat(80));
    console.log('📊 2022 JSON PHOTO REFERENCE FIX SUMMARY');
    console.log('=' .repeat(80));
    console.log(`📈 PROCESSING STATS:`);
    console.log(`   Total files checked: ${results.totalFiles}`);
    console.log(`   Files updated: ${results.updated}`);
    console.log(`   Already correct: ${results.alreadyCorrect}`);
    console.log(`   Errors: ${results.errors.length}`);

    if (results.updates.length > 0) {
        console.log(`\n📝 UPDATES MADE:`);
        results.updates.forEach((update, index) => {
            console.log(`   ${index + 1}. ${update.file} (${update.awardNum}):`);
            console.log(`      ${update.oldPhoto} → ${update.newPhoto}`);
        });
    }

    if (results.errors.length > 0) {
        console.log(`\n⚠️  ISSUES FOUND:`);
        results.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.file} (${error.awardNum || 'Unknown'}): ${error.issue}`);
        });
    }

    // Save detailed report
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportPath = path.join(reportsDir, '2022-json-photo-fix-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalFiles: results.totalFiles,
            filesUpdated: results.updated,
            alreadyCorrect: results.alreadyCorrect,
            errors: results.errors.length
        },
        updates: results.updates,
        errors: results.errors
    }, null, 2));

    console.log(`\n📊 Detailed report saved: ${reportPath}`);
    
    if (results.errors.length === 0 && results.updated > 0) {
        console.log('\n🎉 ALL JSON PHOTO REFERENCES FIXED SUCCESSFULLY!');
    } else if (results.updated === 0 && results.errors.length === 0) {
        console.log('\n✨ All JSON photo references were already correct!');
    } else {
        console.log(`\n⚠️  ${results.errors.length} issues encountered. Check report for details.`);
    }
}

// Run the JSON photo reference fix if this script is executed directly
if (require.main === module) {
    fixJsonPhotoReferences();
}

module.exports = { fixJsonPhotoReferences };