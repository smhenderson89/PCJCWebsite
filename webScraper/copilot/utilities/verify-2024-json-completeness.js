const fs = require('fs-extra');
const path = require('path');

class JsonCompletenessVerifier2024 {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.year = '2024';
        this.awardsDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year);
        this.htmlDir = path.join(this.awardsDir, 'html');
        this.imagesDir = path.join(this.awardsDir, 'images');
        this.thumbnailsDir = path.join(this.awardsDir, 'images', 'thumbnail');
        this.jsonDir = path.join(this.baseDir, 'savedData', this.year, 'json');
    }

    async verifyCompleteness() {
        console.log('🔍 Verifying 2024 JSON Data Completeness\n');
        console.log('📋 This will check:');
        console.log('   • HTML files vs JSON files count');
        console.log('   • Each JSON file has valid image references');
        console.log('   • Image files actually exist');
        console.log('   • Thumbnail references are correct\n');

        // Get all award HTML files (excluding index pages)
        const htmlFiles = await this.getAwardHtmlFiles();
        console.log(`📄 Found ${htmlFiles.length} award HTML files`);

        // Get all JSON files
        const jsonFiles = await this.getJsonFiles();
        console.log(`📊 Found ${jsonFiles.length} JSON files`);

        // Verify counts match
        const countMatch = htmlFiles.length === jsonFiles.length;
        console.log(`🔢 Count Match: ${countMatch ? '✅ YES' : '❌ NO'}`);
        
        if (!countMatch) {
            console.log(`   HTML: ${htmlFiles.length}, JSON: ${jsonFiles.length}`);
            
            // Find missing files
            const htmlSet = new Set(htmlFiles);
            const jsonSet = new Set(jsonFiles);
            
            const missingJson = htmlFiles.filter(h => !jsonSet.has(h));
            const extraJson = jsonFiles.filter(j => !htmlSet.has(j));
            
            if (missingJson.length > 0) {
                console.log(`   Missing JSON files: ${missingJson.join(', ')}`);
            }
            if (extraJson.length > 0) {
                console.log(`   Extra JSON files: ${extraJson.join(', ')}`);
            }
        }

        console.log('\n🖼️  Verifying Image References...');

        let validImageRefs = 0;
        let invalidImageRefs = 0;
        let validThumbnailRefs = 0;
        let invalidThumbnailRefs = 0;
        let nullThumbnails = 0;
        const imageIssues = [];
        const thumbnailIssues = [];

        // Check each JSON file
        for (const awardNum of jsonFiles) {
            try {
                const jsonPath = path.join(this.jsonDir, `${awardNum}.json`);
                const jsonContent = await fs.readFile(jsonPath, 'utf8');
                const awardData = JSON.parse(jsonContent);

                // Check photo reference
                if (awardData.photo) {
                    const imageRelativePath = awardData.photo;
                    const fullImagePath = path.join(this.awardsDir, imageRelativePath);
                    
                    if (await fs.pathExists(fullImagePath)) {
                        validImageRefs++;
                    } else {
                        invalidImageRefs++;
                        imageIssues.push(`${awardNum}: ${imageRelativePath} (missing file)`);
                    }
                } else {
                    invalidImageRefs++;
                    imageIssues.push(`${awardNum}: null photo reference`);
                }

                // Check thumbnail reference
                if (awardData.thumbnail) {
                    const thumbnailRelativePath = awardData.thumbnail;
                    const fullThumbnailPath = path.join(this.awardsDir, thumbnailRelativePath);
                    
                    if (await fs.pathExists(fullThumbnailPath)) {
                        validThumbnailRefs++;
                    } else {
                        invalidThumbnailRefs++;
                        thumbnailIssues.push(`${awardNum}: ${thumbnailRelativePath} (missing file)`);
                    }
                } else {
                    nullThumbnails++;
                }

            } catch (error) {
                invalidImageRefs++;
                imageIssues.push(`${awardNum}: Error reading JSON - ${error.message}`);
            }
        }

        // Summary
        console.log('\n📊 VERIFICATION RESULTS');
        console.log('========================');
        console.log(`📄 HTML Files: ${htmlFiles.length}`);
        console.log(`📊 JSON Files: ${jsonFiles.length}`);
        console.log(`🔢 Count Match: ${countMatch ? '✅' : '❌'}`);
        console.log('');
        console.log('🖼️  Image References:');
        console.log(`   ✅ Valid: ${validImageRefs}`);
        console.log(`   ❌ Invalid: ${invalidImageRefs}`);
        console.log('');
        console.log('🖼️  Thumbnail References:');
        console.log(`   ✅ Valid: ${validThumbnailRefs}`);
        console.log(`   ❌ Invalid: ${invalidThumbnailRefs}`);
        console.log(`   🚫 Null: ${nullThumbnails}`);

        if (imageIssues.length > 0) {
            console.log('\n🚨 IMAGE ISSUES:');
            imageIssues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue}`);
            });
        }

        if (thumbnailIssues.length > 0) {
            console.log('\n🚨 THUMBNAIL ISSUES:');
            thumbnailIssues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue}`);
            });
        }

        // Overall status
        const allGood = countMatch && invalidImageRefs === 0 && invalidThumbnailRefs === 0;
        console.log(`\n🎯 Overall Status: ${allGood ? '✅ PERFECT' : '⚠️  ISSUES FOUND'}`);

        return {
            htmlCount: htmlFiles.length,
            jsonCount: jsonFiles.length,
            countMatch,
            validImageRefs,
            invalidImageRefs,
            validThumbnailRefs,
            invalidThumbnailRefs,
            nullThumbnails,
            imageIssues,
            thumbnailIssues,
            allGood
        };
    }

    async getAwardHtmlFiles() {
        try {
            const files = await fs.readdir(this.htmlDir);
            return files
                .filter(f => f.endsWith('.html'))
                .filter(f => f.match(/^20245\d{3}\.html$/)) // Only individual awards
                .map(f => f.replace('.html', ''))
                .sort();
        } catch (error) {
            console.error('Error reading HTML directory:', error);
            return [];
        }
    }

    async getJsonFiles() {
        try {
            const files = await fs.readdir(this.jsonDir);
            return files
                .filter(f => f.endsWith('.json'))
                .map(f => f.replace('.json', ''))
                .sort();
        } catch (error) {
            console.error('Error reading JSON directory:', error);
            return [];
        }
    }
}

async function verifyJsonCompleteness() {
    console.log('🚀 Starting 2024 JSON Completeness Verification\n');
    
    try {
        const verifier = new JsonCompletenessVerifier2024();
        const results = await verifier.verifyCompleteness();
        
        if (results.allGood) {
            console.log('\n🎉 VERIFICATION COMPLETE - ALL GOOD!');
            console.log('✅ All HTML files have corresponding JSON files');
            console.log('✅ All JSON files have valid image references');
            console.log('✅ All image files exist and are accessible');
        } else {
            console.log('\n⚠️  VERIFICATION COMPLETE - ISSUES FOUND');
            console.log('Please review the issues listed above');
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Error during verification:', error);
    }
}

if (require.main === module) {
    verifyJsonCompleteness().catch(console.error);
}

module.exports = { verifyJsonCompleteness };