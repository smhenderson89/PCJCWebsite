#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

const JSON_DIR = path.join(__dirname, '..', 'savedData', '2022', 'json');

// List of day-index JSON files to remove (these correspond to multi-award index pages)
const dayIndexJsonFiles = [
    '20220219.json',
    '20220224.json', 
    '20220319.json',
    '20220326.json',
    '20220405.json',
    '20220416.json',
    '20220508.json',
    '20220521.json',
    '20220618.json',
    '20220716.json',
    '20220906.json',
    '20220917.json',
    '20221004.json',
    '20221015.json',
    '20221119.json',
    '20221206.json',
    '20221217.json'
];

async function removeInvalidJsonFiles() {
    console.log('🚀 Starting Invalid 2022 JSON File Cleanup Process\n');
    
    console.log('📋 This will:');
    console.log('   1. 📁 Identify JSON files created for day-index pages');
    console.log('   2. 🗑️  Remove invalid JSON files (day-index pages should not have individual JSON)');
    console.log('   3. ✅ Generate cleanup report\n');

    const results = {
        removed: [],
        notFound: [],
        errors: []
    };

    console.log(`📁 Step 1: Processing ${dayIndexJsonFiles.length} invalid JSON files...\n`);

    for (let i = 0; i < dayIndexJsonFiles.length; i++) {
        const filename = dayIndexJsonFiles[i];
        const filePath = path.join(JSON_DIR, filename);
        const fileNumber = i + 1;
        
        console.log(`   📄 Processing ${fileNumber}/${dayIndexJsonFiles.length}: ${filename}`);
        
        try {
            // Check if file exists
            if (!await fs.pathExists(filePath)) {
                console.log(`      ⚠️  File not found (already removed?): ${filename}`);
                results.notFound.push(filename);
                continue;
            }

            // Remove the file
            await fs.remove(filePath);
            
            console.log(`      ✅ Removed: ${filename}`);
            results.removed.push(filename);

        } catch (error) {
            console.log(`      ❌ Error removing ${filename}: ${error.message}`);
            results.errors.push({ filename, error: error.message });
        }
    }

    console.log('\n✅ Step 2: Generating cleanup report...');

    // Generate summary
    console.log('\n📋 Invalid JSON File Cleanup Summary:');
    console.log(`   📄 Total files processed: ${dayIndexJsonFiles.length}`);
    console.log(`   ✅ Successfully removed: ${results.removed.length}`);
    console.log(`   ⚠️  Not found: ${results.notFound.length}`);
    console.log(`   ❌ Errors: ${results.errors.length}`);

    if (results.removed.length > 0) {
        console.log('\n🗑️  Removed Files:');
        results.removed.forEach(filename => {
            console.log(`   ${filename}`);
        });
    }

    if (results.notFound.length > 0) {
        console.log('\n⚠️  Files Not Found:');
        results.notFound.forEach(filename => {
            console.log(`   ${filename} (may have been already removed)`);
        });
    }

    if (results.errors.length > 0) {
        console.log('\n❌ Errors:');
        results.errors.forEach(({ filename, error }) => {
            console.log(`   ${filename}: ${error}`);
        });
    }

    // Save detailed report
    const reportPath = path.join(JSON_DIR, '2022-invalid-json-cleanup-report.json');
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            totalProcessed: dayIndexJsonFiles.length,
            removed: results.removed.length,
            notFound: results.notFound.length,
            errors: results.errors.length
        },
        results
    };

    await fs.writeJSON(reportPath, reportData, { spaces: 2 });
    console.log(`\n📊 Report saved to: ${reportPath}`);

    // Check remaining JSON count
    const remainingFiles = await fs.readdir(JSON_DIR);
    const remainingJsonFiles = remainingFiles.filter(f => f.endsWith('.json') && !f.includes('report'));
    console.log(`\n📈 Remaining valid JSON files: ${remainingJsonFiles.length}`);

    console.log('\n✅ 2022 Invalid JSON cleanup complete!');
    console.log('💡 Only individual award JSON files should remain (20225XXX.json format)');
}

// Run the cleanup process
removeInvalidJsonFiles().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});