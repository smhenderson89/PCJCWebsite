const fs = require('fs');
const path = require('path');

// Path to the 2021 awards directory
const awardsDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2021/data/json');

console.log('🔧 Fixing 2021 source URLs from YYMMDD to YYYYMMDD format...');

// Function to convert YYMMDD to YYYYMMDD in URL
function fixSourceUrl(sourceUrl, awardNum) {
    if (!sourceUrl || !sourceUrl.includes('paccentraljc.org/')) {
        return sourceUrl;
    }
    
    // Extract the date part from current URL format
    // Expected format: https://www.paccentraljc.org/YYMMDD/awardNum.html
    const urlMatch = sourceUrl.match(/paccentraljc\.org\/(\d{6})\/(\d+\.html)/);
    
    if (urlMatch) {
        const yymmdd = urlMatch[1];
        const filename = urlMatch[2];
        
        // Convert YYMMDD to YYYYMMDD
        // For years 21 (2021), prepend "20"
        const yyyymmdd = '20' + yymmdd;
        
        // Construct new URL
        const newUrl = `https://www.paccentraljc.org/${yyyymmdd}/${filename}`;
        
        return newUrl;
    }
    
    return sourceUrl;
}

try {
    // Get all JSON files in the awards directory
    const files = fs.readdirSync(awardsDir).filter(file => file.endsWith('.json'));
    
    console.log(`\n📁 Found ${files.length} award files to process`);
    
    let processedCount = 0;
    let errorCount = 0;
    let fixedCount = 0;
    
    for (const filename of files) {
        try {
            const filePath = path.join(awardsDir, filename);
            const awardData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            const awardNum = awardData.awardNum || filename.replace('.json', '');
            const oldSourceUrl = awardData.sourceUrl;
            
            if (oldSourceUrl) {
                const newSourceUrl = fixSourceUrl(oldSourceUrl, awardNum);
                
                if (newSourceUrl !== oldSourceUrl) {
                    // Update the sourceUrl
                    awardData.sourceUrl = newSourceUrl;
                    
                    // Add change log entry
                    if (!awardData.changeLog) {
                        awardData.changeLog = [];
                    }
                    
                    awardData.changeLog.push({
                        timestamp: new Date().toISOString(),
                        field: "sourceUrl",
                        oldValue: oldSourceUrl,
                        newValue: newSourceUrl,
                        source: "automated-2021-source-url-correction",
                        reason: "Updated from YYMMDD to YYYYMMDD format to match actual website structure"
                    });
                    
                    // Write the updated file
                    fs.writeFileSync(filePath, JSON.stringify(awardData, null, 2));
                    
                    console.log(`   ✅ ${awardNum}: ${oldSourceUrl} → ${newSourceUrl}`);
                    fixedCount++;
                } else {
                    console.log(`   ℹ️  ${awardNum}: URL already in correct format`);
                }
            } else {
                console.log(`   ⚠️  ${awardNum}: No sourceUrl field found`);
            }
            
            processedCount++;
            
        } catch (error) {
            console.log(`   ❌ ${filename}: Error - ${error.message}`);
            errorCount++;
        }
    }
    
    console.log('\n📊 Source URL Fix Summary:');
    console.log(`   📁 Files processed: ${processedCount}`);
    console.log(`   🔧 URLs fixed: ${fixedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ✅ Success rate: ${((processedCount - errorCount) / processedCount * 100).toFixed(1)}%`);
    
    if (fixedCount > 0) {
        // Generate a report
        const reportPath = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2021/data/2021-source-url-fixes-report.json');
        const report = {
            metadata: {
                timestamp: new Date().toISOString(),
                year: "2021",
                purpose: "Source URL format correction from YYMMDD to YYYYMMDD",
                totalFiles: processedCount,
                fixedFiles: fixedCount,
                errorFiles: errorCount
            },
            changes: {
                format: "YYMMDD → YYYYMMDD",
                example: "211005 → 20211005",
                reason: "Match actual website structure with full year format"
            },
            summary: {
                success: true,
                filesFixed: fixedCount,
                completionRate: `${((fixedCount / processedCount) * 100).toFixed(1)}%`
            }
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📋 Report saved: ${reportPath}`);
    }
    
} catch (error) {
    console.error('❌ Error processing 2021 source URL fixes:', error.message);
    process.exit(1);
}