#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

const BASE_DIR = path.join(__dirname, '..', 'localCopy', 'paccentraljc.org', 'awards', '2022', 'html');

// List of day-index files (identified as YYYYMMDD format with calendar dates)
const dayIndexFiles = [
    '20220219.html',
    '20220224.html', 
    '20220319.html',
    '20220326.html',
    '20220405.html',
    '20220416.html',
    '20220508.html',
    '20220521.html',
    '20220618.html',
    '20220716.html',
    '20220906.html',
    '20220917.html',
    '20221004.html',
    '20221015.html',
    '20221119.html',
    '20221206.html',
    '20221217.html'
];

function extractDateFromFilename(filename) {
    // Extract date from filename like 20220219.html
    const match = filename.match(/^(\d{4})(\d{2})(\d{2})\.html$/);
    if (match) {
        const [, year, month, day] = match;
        return `${year}-${month}-${day}`;
    }
    return null;
}

function extractLocationFromTitle(htmlContent) {
    try {
        const $ = cheerio.load(htmlContent);
        const title = $('title').text().trim();
        
        // Extract location from title like "February 24, 2022 - Pacific Orchid Exposition"
        const locationMatch = title.match(/\d{4}\s*-\s*(.+)$/);
        if (locationMatch) {
            return locationMatch[1].trim()
                .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .toLowerCase();
        }
        return 'unknown-location';
    } catch (error) {
        console.log(`   ⚠️  Could not extract location: ${error.message}`);
        return 'unknown-location';
    }
}

async function renameDayIndexPages() {
    console.log('🚀 Starting 2022 Day Index Page Renaming Process\n');
    
    console.log('📋 This will:');
    console.log('   1. 📁 Identify day-specific index HTML files');
    console.log('   2. 📄 Extract date and location information');
    console.log('   3. 🔄 Rename files to format: YYYY-MM-DD-location-index.html');
    console.log('   4. ✅ Generate renaming report\n');

    const results = {
        successful: [],
        failed: [],
        skipped: []
    };

    console.log(`📁 Step 1: Processing ${dayIndexFiles.length} day-index files...\n`);

    for (let i = 0; i < dayIndexFiles.length; i++) {
        const filename = dayIndexFiles[i];
        const filePath = path.join(BASE_DIR, filename);
        const fileNumber = i + 1;
        
        console.log(`   📄 Processing ${fileNumber}/${dayIndexFiles.length}: ${filename}`);
        
        try {
            // Check if file exists
            if (!await fs.pathExists(filePath)) {
                console.log(`      ⚠️  File not found: ${filename}`);
                results.skipped.push({ filename, reason: 'File not found' });
                continue;
            }

            // Read HTML content to extract location
            const htmlContent = await fs.readFile(filePath, 'utf8');
            
            // Extract date from filename
            const dateStr = extractDateFromFilename(filename);
            if (!dateStr) {
                console.log(`      ❌ Could not parse date from filename: ${filename}`);
                results.failed.push({ filename, reason: 'Could not parse date' });
                continue;
            }

            // Extract location from title
            const location = extractLocationFromTitle(htmlContent);
            
            // Create new filename
            const newFilename = `${dateStr}-${location}-index.html`;
            const newFilePath = path.join(BASE_DIR, newFilename);
            
            // Check if target already exists
            if (await fs.pathExists(newFilePath)) {
                console.log(`      ⚠️  Target already exists: ${newFilename}`);
                results.skipped.push({ filename, newFilename, reason: 'Target exists' });
                continue;
            }

            // Rename the file
            await fs.move(filePath, newFilePath);
            
            console.log(`      ✅ Renamed: ${filename} → ${newFilename}`);
            results.successful.push({ 
                oldFilename: filename, 
                newFilename, 
                dateStr, 
                location 
            });

        } catch (error) {
            console.log(`      ❌ Error processing ${filename}: ${error.message}`);
            results.failed.push({ filename, reason: error.message });
        }
    }

    console.log('\n✅ Step 2: Generating renaming report...');

    // Generate summary
    console.log('\n📋 Day Index Page Renaming Summary:');
    console.log(`   📄 Total files processed: ${dayIndexFiles.length}`);
    console.log(`   ✅ Successfully renamed: ${results.successful.length}`);
    console.log(`   ⚠️  Skipped: ${results.skipped.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}`);

    if (results.successful.length > 0) {
        console.log('\n📝 Successfully Renamed Files:');
        results.successful.forEach(({ oldFilename, newFilename, dateStr, location }) => {
            console.log(`   ${oldFilename} → ${newFilename}`);
        });
    }

    if (results.skipped.length > 0) {
        console.log('\n⚠️  Skipped Files:');
        results.skipped.forEach(({ filename, newFilename, reason }) => {
            console.log(`   ${filename}: ${reason}`);
        });
    }

    if (results.failed.length > 0) {
        console.log('\n❌ Failed Files:');
        results.failed.forEach(({ filename, reason }) => {
            console.log(`   ${filename}: ${reason}`);
        });
    }

    // Save detailed report
    const reportPath = path.join(BASE_DIR, '2022-day-index-renaming-report.json');
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            totalProcessed: dayIndexFiles.length,
            successful: results.successful.length,
            skipped: results.skipped.length,
            failed: results.failed.length
        },
        results
    };

    await fs.writeJSON(reportPath, reportData, { spaces: 2 });
    console.log(`\n📊 Report saved to: ${reportPath}`);

    console.log('\n✅ 2022 Day Index Page renaming complete!');
}

// Run the renaming process
renameDayIndexPages().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});