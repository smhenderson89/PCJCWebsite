/**
 * 2026 Image Validation Script
 * Check that all 2026 awards have corresponding image files saved locally
 */

const fs = require('fs');
const path = require('path');

// Path to the 2026 JSON data directory
const jsonDataPath = path.join(__dirname, '../../paccentraljc.org/awards/2026/data/json');
// Path to the 2026 images directory
const imagesPath = path.join(__dirname, '../../paccentraljc.org/awards/2026/images');

/**
 * Main image checking function
 */
function checkAllImages() {
    console.log('🖼️  2026 IMAGE VALIDATION CHECK');
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

    console.log(`📋 Found ${jsonFiles.length} JSON files to check images for`);
    console.log(`📁 Images directory: ${imagesPath}\n`);

    const results = {
        totalFiles: jsonFiles.length,
        validImages: 0,
        missingImages: 0,
        invalidPaths: 0,
        errors: [],
        checked: 0
    };

    for (const [index, file] of jsonFiles.entries()) {
        const filePath = path.join(jsonDataPath, file);
        
        try {
            const jsonContent = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(jsonContent);
            
            console.log(`📄 [${index + 1}/${jsonFiles.length}] Checking ${file}...`);
            
            // Check if photo field exists
            if (!data.photo) {
                console.log(`   ❌ No photo field found`);
                results.invalidPaths++;
                results.errors.push({
                    file: file,
                    awardNum: data.awardNum || 'Unknown',
                    issue: 'Missing photo field'
                });
                continue;
            }
            
            // Expected image filename should be AWARDNUM.jpg
            const expectedImageName = `${data.awardNum}.jpg`;
            const expectedPhotoPath = `images/${expectedImageName}`;
            
            // Check if photo field matches expected format
            if (data.photo !== expectedPhotoPath) {
                console.log(`   ⚠️  Photo path mismatch: has '${data.photo}', expected '${expectedPhotoPath}'`);
                results.errors.push({
                    file: file,
                    awardNum: data.awardNum || 'Unknown',
                    issue: `Photo path mismatch: has '${data.photo}', expected '${expectedPhotoPath}'`,
                    expectedPath: expectedPhotoPath,
                    actualPath: data.photo
                });
            }
            
            // Check if the actual image file exists
            const actualImagePath = path.join(imagesPath, expectedImageName);
            
            if (fs.existsSync(actualImagePath)) {
                console.log(`   ✅ Image found: ${expectedImageName}`);
                results.validImages++;
            } else {
                console.log(`   ❌ Image missing: ${expectedImageName}`);
                results.missingImages++;
                results.errors.push({
                    file: file,
                    awardNum: data.awardNum || 'Unknown',
                    issue: 'Image file not found',
                    expectedImage: expectedImageName,
                    expectedPath: actualImagePath
                });
            }
            
            results.checked++;
            
        } catch (error) {
            console.log(`📄 [${index + 1}/${jsonFiles.length}] ${file} - Parse error: ${error.message}`);
            results.errors.push({
                file: file,
                issue: `JSON parse error: ${error.message}`
            });
        }
    }

    // Print summary
    console.log('\n' + '=' .repeat(80));
    console.log('📊 2026 IMAGE VALIDATION SUMMARY');
    console.log('=' .repeat(80));
    console.log(`📈 PROCESSING STATS:`);
    console.log(`   Total files: ${results.totalFiles}`);
    console.log(`   Awards checked: ${results.checked}`);
    console.log(`   Valid images found: ${results.validImages}`);
    console.log(`   Missing images: ${results.missingImages}`);
    console.log(`   Invalid photo paths: ${results.invalidPaths}`);
    console.log(`   Files with errors: ${results.errors.length}`);
    
    if (results.checked > 0) {
        const imageSuccessRate = ((results.validImages / results.checked) * 100).toFixed(1);
        console.log(`   Image success rate: ${imageSuccessRate}%`);
    }

    if (results.errors.length > 0) {
        console.log(`\n⚠️  ISSUES FOUND:`);
        results.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.file} (${error.awardNum || 'Unknown'}): ${error.issue}`);
            if (error.expectedPath) {
                console.log(`      Expected: ${error.expectedPath}`);
            }
            if (error.actualPath) {
                console.log(`      Actual: ${error.actualPath}`);
            }
            if (error.expectedImage) {
                console.log(`      Missing image: ${error.expectedImage}`);
            }
        });
    }

    // Save detailed report
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportPath = path.join(reportsDir, '2026-image-check-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalFiles: results.totalFiles,
            awardsChecked: results.checked,
            validImages: results.validImages,
            missingImages: results.missingImages,
            invalidPaths: results.invalidPaths,
            imageSuccessRate: results.checked > 0 ? ((results.validImages / results.checked) * 100).toFixed(1) + '%' : 'N/A'
        },
        errors: results.errors
    }, null, 2));

    console.log(`\n📊 Detailed report saved: ${reportPath}`);
    
    if (results.missingImages === 0 && results.invalidPaths === 0 && results.errors.length === 0) {
        console.log('\n🎉 ALL IMAGES ARE VALID! No issues found.');
    } else {
        console.log(`\n⚠️  ${results.missingImages + results.invalidPaths} issues found that should be reviewed.`);
    }
}

// Run the image check if this script is executed directly
if (require.main === module) {
    checkAllImages();
}

module.exports = { checkAllImages };