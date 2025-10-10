const fs = require('fs');
const path = require('path');

// Paths
const awardsDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2019/data/json');

console.log('🔧 Converting 2019 source URLs from simple to date-based format...\n');

// Helper function to convert date to YYYYMMDD format
function convertDateToYYYYMMDD(dateString) {
    try {
        // Handle various date formats
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return null;
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}${month}${day}`;
    } catch (error) {
        return null;
    }
}

// Function to convert simple URL to date-based URL
function convertToDateBasedUrl(awardNum, dateString) {
    const dateCode = convertDateToYYYYMMDD(dateString);
    if (!dateCode) {
        return null;
    }
    
    return `https://www.paccentraljc.org/${dateCode}/${awardNum}.html`;
}

async function fixSourceUrls() {
    try {
        const files = fs.readdirSync(awardsDir).filter(file => file.endsWith('.json'));
        
        console.log(`📊 Processing ${files.length} award files...\n`);
        
        let processedCount = 0;
        let fixedCount = 0;
        let errorCount = 0;
        
        for (const file of files) {
            const filePath = path.join(awardsDir, file);
            const awardNum = file.replace(/\.json$/, '');
            
            try {
                const awardData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                let changed = false;
                
                console.log(`   📄 ${awardNum}: Checking source URL...`);
                
                // Check current URL format
                if (awardData.sourceUrl) {
                    const currentUrl = awardData.sourceUrl;
                    
                    // Check if it's in the simple format (needs conversion)
                    const simpleFormatRegex = /^https:\/\/www\.paccentraljc\.org\/\d+\.html$/;
                    
                    if (simpleFormatRegex.test(currentUrl) && awardData.date) {
                        // Convert to date-based format
                        const newUrl = convertToDateBasedUrl(awardNum, awardData.date);
                        
                        if (newUrl) {
                            const oldUrl = awardData.sourceUrl;
                            awardData.sourceUrl = newUrl;
                            
                            console.log(`     🔧 Fixed: ${oldUrl} → ${newUrl}`);
                            
                            // Add correction record
                            if (!awardData.corrections) {
                                awardData.corrections = [];
                            }
                            
                            awardData.corrections.push({
                                timestamp: new Date().toISOString(),
                                field: "sourceUrl",
                                oldValue: oldUrl,
                                newValue: newUrl,
                                source: "automated-2019-url-standardization",
                                reason: "Converted from simple to date-based URL format"
                            });
                            
                            changed = true;
                            fixedCount++;
                        } else {
                            console.log(`     ⚠️  Could not parse date: ${awardData.date}`);
                            errorCount++;
                        }
                    } else {
                        console.log(`     ✅ URL already in correct format or different pattern`);
                    }
                } else {
                    console.log(`     ⚠️  No sourceUrl field found`);
                }
                
                // Save changes if any were made
                if (changed) {
                    // Add change log entry
                    if (!awardData.changeLog) {
                        awardData.changeLog = [];
                    }
                    
                    awardData.changeLog.push({
                        timestamp: new Date().toISOString(),
                        action: "source-url-format-update",
                        changes: ["Updated sourceUrl to date-based format"],
                        script: "fix-2019-source-url-format.js"
                    });
                    
                    // Update last modified timestamp
                    awardData.lastModified = new Date().toISOString();
                    
                    // Write back to file
                    fs.writeFileSync(filePath, JSON.stringify(awardData, null, 2));
                }
                
                processedCount++;
                
            } catch (error) {
                console.log(`     ❌ Error processing ${awardNum}: ${error.message}`);
                errorCount++;
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 2019 SOURCE URL FORMAT CONVERSION SUMMARY');
        console.log('='.repeat(60));
        console.log(`\\n🎯 PROCESSING STATISTICS:`);
        console.log(`   Total files processed: ${processedCount}`);
        console.log(`   URLs converted: ${fixedCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`   Success rate: ${((processedCount-errorCount)/processedCount*100).toFixed(1)}%`);
        
        if (fixedCount > 0) {
            console.log(`\\n✅ Successfully converted ${fixedCount} source URLs to date-based format!`);
        } else {
            console.log(`\\n💡 No URLs needed conversion (all already in correct format).`);
        }
        
    } catch (error) {
        console.error('❌ Error in fix process:', error.message);
        process.exit(1);
    }
}

// Run the fix process
fixSourceUrls();