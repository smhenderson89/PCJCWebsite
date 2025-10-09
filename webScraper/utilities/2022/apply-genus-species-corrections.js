const fs = require('fs');
const path = require('path');

// Path to the awards directory
const awardsDir = path.join(__dirname, '../../copilot/localCopy/paccentraljc.org/awards/2022/data/json');

console.log('🔧 Applying final genus/species corrections from source HTML...');

const genusSpeciesCorrections = {
    "20225303": { genus: "Schoenorchis", species: "gemmata" },
    "20225353": { genus: "Laeliocattleya", species: "Good Days" },
    "20225420": { genus: "Paphiopedilum", species: "Toni Semple" }
};

let correctionCount = 0;

for (const [awardId, corrections] of Object.entries(genusSpeciesCorrections)) {
    try {
        const awardFilePath = path.join(awardsDir, `${awardId}.json`);
        
        if (fs.existsSync(awardFilePath)) {
            const awardData = JSON.parse(fs.readFileSync(awardFilePath, 'utf8'));
            
            let changed = false;
            
            if (corrections.genus && (!awardData.genus || awardData.genus === "" || awardData.genus === null)) {
                awardData.genus = corrections.genus;
                changed = true;
                console.log(`   ✅ ${awardId}: Set genus to "${corrections.genus}"`);
            }
            
            if (corrections.species && (!awardData.species || awardData.species === "" || awardData.species === null)) {
                awardData.species = corrections.species;
                changed = true;
                console.log(`   ✅ ${awardId}: Set species to "${corrections.species}"`);
            }
            
            if (changed) {
                // Add to change log
                if (!awardData.changeLog) {
                    awardData.changeLog = [];
                }
                
                awardData.changeLog.push({
                    timestamp: new Date().toISOString(),
                    field: "genus/species",
                    oldValue: "empty",
                    newValue: `${corrections.genus} ${corrections.species}`,
                    source: "manual-correction-from-html",
                    reason: "Extracted genus and species from source HTML file"
                });
                
                fs.writeFileSync(awardFilePath, JSON.stringify(awardData, null, 2));
                correctionCount++;
            }
        } else {
            console.log(`   ❌ ${awardId}: Award file not found`);
        }
    } catch (error) {
        console.log(`   ❌ ${awardId}: Error processing - ${error.message}`);
    }
}

console.log(`\n✅ Successfully applied genus/species corrections to ${correctionCount} awards`);

// Verify the corrections
console.log('\n🔍 Verification:');
for (const awardId of Object.keys(genusSpeciesCorrections)) {
    const awardFilePath = path.join(awardsDir, `${awardId}.json`);
    if (fs.existsSync(awardFilePath)) {
        const awardData = JSON.parse(fs.readFileSync(awardFilePath, 'utf8'));
        console.log(`   ${awardId}: ${awardData.genus || 'null'} ${awardData.species || 'null'}`);
    }
}