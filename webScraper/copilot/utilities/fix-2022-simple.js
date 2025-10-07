#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

class Simple2022Fixes {
    constructor() {
        this.jsonDir = path.join(__dirname, '..', 'savedData', '2022', 'json');
    }

    async run() {
        console.log('🔧 Running Simple 2022 Data Fixes\n');
        
        // Fix the specific problematic files
        const problematicFiles = [
            '20225303-display.json',
            '20225318.json', 
            '20225414-display.json',
            '20225415-display.json',
            '20225421-display.json'
        ];

        for (const fileName of problematicFiles) {
            await this.fixFile(fileName);
        }

        console.log('\n✅ Simple fixes complete! Run analysis again to see improvements.');
    }

    async fixFile(fileName) {
        const filePath = path.join(this.jsonDir, fileName);
        
        try {
            const data = await fs.readJSON(filePath);
            console.log(`🔧 Fixing ${fileName}`);

            let modified = false;

            // Fix display awards - they shouldn't have plant measurements
            if (fileName.includes('-display.json') || data.display === true) {
                console.log('   🎨 Cleaning display award data...');
                
                // Display awards should have minimal measurement data
                const cleanMeasurements = {
                    type: data.measurements?.type || '',
                    numFlowers: data.measurements?.numFlowers || 0,
                    numBuds: data.measurements?.numBuds || 0,
                    description: data.measurements?.description || ''
                };
                
                // Remove plant-specific measurements that don't apply to displays
                data.measurements = cleanMeasurements;
                
                // For display awards, genus/species/clone/cross are not relevant
                // unless it's a botanical display (keep existing if present)
                
                modified = true;
                console.log('     ✅ Cleaned display measurements');
            }

            // Fix 20225318.json specifically (AQ award issue already seems resolved)
            if (fileName === '20225318.json') {
                console.log('   🎯 Checking AQ award...');
                if (!data.award || data.award === '') {
                    data.award = 'AQ';
                    data.awardpoints = null; // AQ awards don't have points
                    modified = true;
                    console.log('     ✅ Fixed AQ award type');
                }
            }

            if (modified) {
                await fs.writeJSON(filePath, data, { spaces: 2 });
                console.log(`   💾 Updated ${fileName}`);
            } else {
                console.log(`   ✨ ${fileName} already in good condition`);
            }

        } catch (error) {
            console.log(`   ❌ Error fixing ${fileName}: ${error.message}`);
        }
    }
}

// Run the simple fixes
const fixer = new Simple2022Fixes();
fixer.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});