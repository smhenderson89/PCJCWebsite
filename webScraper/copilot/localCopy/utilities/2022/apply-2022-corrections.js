const fs = require('fs');
const path = require('path');

// Path to the consolidated issues file and awards directory
const issuesFilePath = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2022/data/errorChecking/2022-consolidated-issues.json');
const awardsDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2022/data/json');

console.log('🔧 Applying corrections to 2022 awards based on consolidated issues...');

try {
    // Read the consolidated issues file
    const issuesData = JSON.parse(fs.readFileSync(issuesFilePath, 'utf8'));
    
    let correctionCount = 0;
    let errorCount = 0;
    
    // Process recoverable issues (date/location corrections)
    console.log('\n📅 Processing recoverable issues (date/location corrections):');
    
    const recoverableCorrections = {
        "20225262": { date: "2022-10-04", location: "San Francisco" },
        "20225263": { date: "2022-10-04", location: "San Francisco" },
        "20225347": { date: "2022-10-15", location: "Filoli Historic House Monthly" },
        "20225348": { date: "2022-10-15", location: "Filoli Historic House Monthly" },
        "20225349": { date: "2022-10-15", location: "Filoli Historic House Monthly" },
        "20225350": { date: "2022-10-15", location: "Filoli Historic House Monthly" }
    };
    
    for (const [awardId, corrections] of Object.entries(recoverableCorrections)) {
        try {
            const awardFilePath = path.join(awardsDir, `${awardId}.json`);
            
            if (fs.existsSync(awardFilePath)) {
                const awardData = JSON.parse(fs.readFileSync(awardFilePath, 'utf8'));
                
                let changed = false;
                if (corrections.date && (!awardData.date || awardData.date === null)) {
                    awardData.date = corrections.date;
                    changed = true;
                    console.log(`   ✅ ${awardId}: Set date to ${corrections.date}`);
                }
                
                if (corrections.location && (!awardData.location || awardData.location === null)) {
                    awardData.location = corrections.location;
                    changed = true;
                    console.log(`   ✅ ${awardId}: Set location to ${corrections.location}`);
                }
                
                if (changed) {
                    fs.writeFileSync(awardFilePath, JSON.stringify(awardData, null, 2));
                    correctionCount++;
                }
            } else {
                console.log(`   ❌ ${awardId}: Award file not found`);
                errorCount++;
            }
        } catch (error) {
            console.log(`   ❌ ${awardId}: Error processing - ${error.message}`);
            errorCount++;
        }
    }
    
    // Process problematic issues (award/display corrections)
    console.log('\n🏆 Processing problematic issues (award/display corrections):');
    
    const problematicCorrections = {
        "20225303": { display: false }, // Not a display
        "20225318": { award: "AQ", awardpoints: "N/A" }, // Award Quality
        "20225404": { award: "CBR", awardpoints: "N/A" }, // Certificate of Botanical Recognition
        "20225422": { award: "AQ", awardpoints: "N/A" } // Award Quality
    };
    
    for (const [awardId, corrections] of Object.entries(problematicCorrections)) {
        try {
            const awardFilePath = path.join(awardsDir, `${awardId}.json`);
            
            if (fs.existsSync(awardFilePath)) {
                const awardData = JSON.parse(fs.readFileSync(awardFilePath, 'utf8'));
                
                let changed = false;
                
                if (corrections.display !== undefined && awardData.display !== corrections.display) {
                    awardData.display = corrections.display;
                    changed = true;
                    console.log(`   ✅ ${awardId}: Set display to ${corrections.display}`);
                }
                
                if (corrections.award && (!awardData.award || awardData.award === null || awardData.award === "")) {
                    awardData.award = corrections.award;
                    changed = true;
                    console.log(`   ✅ ${awardId}: Set award to ${corrections.award}`);
                }
                
                if (corrections.awardpoints && (!awardData.awardpoints || awardData.awardpoints === null)) {
                    awardData.awardpoints = corrections.awardpoints;
                    changed = true;
                    console.log(`   ✅ ${awardId}: Set awardpoints to ${corrections.awardpoints}`);
                }
                
                if (changed) {
                    fs.writeFileSync(awardFilePath, JSON.stringify(awardData, null, 2));
                    correctionCount++;
                }
            } else {
                console.log(`   ❌ ${awardId}: Award file not found`);
                errorCount++;
            }
        } catch (error) {
            console.log(`   ❌ ${awardId}: Error processing - ${error.message}`);
            errorCount++;
        }
    }
    
    // Note items that need manual review
    console.log('\n⚠️  Items requiring manual review:');
    console.log('   • 20225353: Missing genus/species data - needs source HTML review');
    console.log('   • 20225420: Not a display, check with Toby for more info');
    
    console.log('\n📊 Correction Summary:');
    console.log(`   ✅ Successfully corrected: ${correctionCount} awards`);
    console.log(`   ❌ Errors encountered: ${errorCount} awards`);
    console.log(`   ⚠️  Manual review needed: 2 awards`);
    
    if (correctionCount > 0) {
        console.log('\n🎯 Next steps:');
        console.log('   1. Run analysis again to verify corrections');
        console.log('   2. Address remaining manual review items');
        console.log('   3. Update consolidated issues status');
    }
    
} catch (error) {
    console.error('❌ Error applying corrections:', error.message);
    process.exit(1);
}