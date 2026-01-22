const fs = require('fs');
const path = require('path');

// Path to the 2021 awards directory
const awardsDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2021/data/json');

console.log('🔍 Verifying 2021 source URL format corrections...');

try {
    const files = fs.readdirSync(awardsDir).filter(file => file.endsWith('.json'));
    
    let correctFormat = 0;
    let incorrectFormat = 0;
    const incorrectFiles = [];
    
    console.log(`\n📁 Checking ${files.length} award files...`);
    
    for (const filename of files) {
        const filePath = path.join(awardsDir, filename);
        const awardData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const sourceUrl = awardData.sourceUrl;
        const awardNum = awardData.awardNum || filename.replace('.json', '');
        
        if (sourceUrl) {
            // Check if URL matches the YYYYMMDD/award.html pattern
            const correctPattern = /paccentraljc\.org\/2021\d{4}\/\d+\.html/;
            
            if (correctPattern.test(sourceUrl)) {
                correctFormat++;
                console.log(`   ✅ ${awardNum}: ${sourceUrl}`);
            } else {
                incorrectFormat++;
                incorrectFiles.push({ awardNum, sourceUrl });
                console.log(`   ❌ ${awardNum}: ${sourceUrl} (incorrect format)`);
            }
        } else {
            incorrectFormat++;
            incorrectFiles.push({ awardNum, sourceUrl: 'MISSING' });
            console.log(`   ❌ ${awardNum}: No sourceUrl field`);
        }
    }
    
    console.log('\n📊 Verification Results:');
    console.log(`   ✅ Correct format: ${correctFormat} files`);
    console.log(`   ❌ Incorrect format: ${incorrectFormat} files`);
    console.log(`   📈 Success rate: ${(correctFormat / (correctFormat + incorrectFormat) * 100).toFixed(1)}%`);
    
    if (incorrectFiles.length > 0) {
        console.log('\n⚠️  Files with incorrect format:');
        incorrectFiles.forEach(file => {
            console.log(`     ${file.awardNum}: ${file.sourceUrl}`);
        });
    }
    
    // Sample verification of date conversion
    console.log('\n🔍 Sample date conversion verification:');
    const sampleFiles = files.slice(0, 3);
    
    for (const filename of sampleFiles) {
        const filePath = path.join(awardsDir, filename);
        const awardData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const sourceUrl = awardData.sourceUrl;
        const date = awardData.date;
        const awardNum = awardData.awardNum;
        
        if (sourceUrl && date) {
            const urlDateMatch = sourceUrl.match(/paccentraljc\.org\/(\d{8})\//);
            if (urlDateMatch) {
                const urlDate = urlDateMatch[1]; // YYYYMMDD from URL
                console.log(`   ${awardNum}: Date: "${date}" | URL Date: ${urlDate}`);
            }
        }
    }
    
} catch (error) {
    console.error('❌ Error verifying source URLs:', error.message);
    process.exit(1);
}