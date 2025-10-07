const fs = require('fs-extra');
const path = require('path');

class JsonThumbnailCleaner2024 {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.jsonDir = path.join(this.baseDir, 'savedData', '2024', 'json');
        this.awardsToClean = ['20245350', '20245351']; // Awards with null thumbnails
    }

    async cleanNullThumbnails() {
        console.log('🧹 Cleaning Null Thumbnail References from 2024 JSON Files\n');
        console.log('📋 This will:');
        console.log('   • Remove "thumbnail": null entries');
        console.log('   • Keep only awards that actually have thumbnail files');
        console.log('   • Preserve all other data intact\n');

        let processed = 0;
        let cleaned = 0;
        const errors = [];

        for (const awardNum of this.awardsToClean) {
            try {
                processed++;
                console.log(`📄 Processing Award ${awardNum}...`);
                
                const jsonPath = path.join(this.jsonDir, `${awardNum}.json`);
                
                // Read the current JSON
                const jsonContent = await fs.readFile(jsonPath, 'utf8');
                const awardData = JSON.parse(jsonContent);
                
                // Check if thumbnail is null
                if (awardData.thumbnail === null) {
                    // Remove the thumbnail property entirely
                    delete awardData.thumbnail;
                    
                    // Write back the cleaned JSON
                    const cleanedJson = JSON.stringify(awardData, null, 2);
                    await fs.writeFile(jsonPath, cleanedJson, 'utf8');
                    
                    console.log(`   ✅ Removed null thumbnail reference`);
                    cleaned++;
                } else {
                    console.log(`   ℹ️  Thumbnail is not null, skipping`);
                }
                
            } catch (error) {
                const errorMsg = `Award ${awardNum}: ${error.message}`;
                errors.push(errorMsg);
                console.log(`   ❌ Error: ${errorMsg}`);
            }
        }

        // Summary
        console.log('\n📊 THUMBNAIL CLEANUP COMPLETE!');
        console.log('===============================');
        console.log(`📄 Total processed: ${processed}`);
        console.log(`🧹 Successfully cleaned: ${cleaned}`);
        console.log(`❌ Errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\n🚨 ERRORS:');
            errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        return {
            processed,
            cleaned,
            errors
        };
    }

    async verifyCleanup() {
        console.log('\n🔍 Verifying cleanup...');
        
        for (const awardNum of this.awardsToClean) {
            try {
                const jsonPath = path.join(this.jsonDir, `${awardNum}.json`);
                const jsonContent = await fs.readFile(jsonPath, 'utf8');
                const awardData = JSON.parse(jsonContent);
                
                if (awardData.hasOwnProperty('thumbnail')) {
                    console.log(`   ⚠️  Award ${awardNum} still has thumbnail property: ${awardData.thumbnail}`);
                } else {
                    console.log(`   ✅ Award ${awardNum} thumbnail property removed`);
                }
                
            } catch (error) {
                console.log(`   ❌ Error verifying ${awardNum}: ${error.message}`);
            }
        }
    }
}

async function cleanNullThumbnails() {
    console.log('🚀 Starting 2024 Null Thumbnail Cleanup Process\n');
    
    try {
        const cleaner = new JsonThumbnailCleaner2024();
        const results = await cleaner.cleanNullThumbnails();
        await cleaner.verifyCleanup();
        
        console.log('\n🎉 CLEANUP COMPLETE!');
        console.log(`✅ Successfully cleaned ${results.cleaned} JSON files`);
        console.log('🧹 Null thumbnail references have been removed');
        
        return results;
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
}

if (require.main === module) {
    cleanNullThumbnails().catch(console.error);
}

module.exports = { cleanNullThumbnails };