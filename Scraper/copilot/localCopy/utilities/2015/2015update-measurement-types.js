/**
 * Update measurement type for 2015 JSON files
 * Changes "type" to "Pouch&SynselPal" for files containing SYNSW, SYNSL, PCHW, PCHL measurements
 * Leaves other files unchanged
 */

const fs = require('fs');
const path = require('path');

// Path to the 2015 JSON data directory
const jsonDataPath = path.join(__dirname, '../../paccentraljc.org/awards/2015/data/json');

/**
 * Check if a JSON object contains synsepal and pouch measurements
 * @param {Object} data - The JSON data object
 * @returns {boolean} - True if contains SYNSW, SYNSL, PCHW, PCHL measurements
 */
function hasSynsepalPouchMeasurements(data) {
    if (!data.measurements) return false;
    
    const measurements = data.measurements;
    return measurements.hasOwnProperty('SYNSW') && 
           measurements.hasOwnProperty('SYNSL') && 
           measurements.hasOwnProperty('PCHW') && 
           measurements.hasOwnProperty('PCHL');
}

/**
 * Check if this is a display/special award that should be categorized as "Other"
 * @param {Object} data - The JSON data object
 * @returns {boolean} - True if this is a display or special award
 */
function isDisplayOrSpecialAward(data) {
    if (!data.genus) return false;
    
    // Check if genus is "Display" or similar indicators
    return data.genus.toLowerCase() === "display" || 
           data.genus.toLowerCase().includes("display");
}

/**
 * Update measurement types for all files to use the two main categories
 */
function updateMeasurementTypes() {
    try {
        // Read all JSON files in the directory
        const files = fs.readdirSync(jsonDataPath).filter(file => file.endsWith('.json'));
        
        let updatedFiles = [];
        let skippedFiles = [];
        
        files.forEach(filename => {
            const filePath = path.join(jsonDataPath, filename);
            
            try {
                // Read and parse JSON file
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (!data.measurements) {
                    skippedFiles.push(filename);
                    console.log(`- Skipped ${filename} - no measurements object`);
                    return;
                }
                
                let needsUpdate = false;
                let newType = '';
                
                // Check if this is a display or special award
                if (isDisplayOrSpecialAward(data)) {
                    if (data.measurements.type !== "Other") {
                        data.measurements.type = "Other";
                        newType = "Other";
                        needsUpdate = true;
                    }
                }
                // Check if file has synsepal and pouch measurements
                else if (hasSynsepalPouchMeasurements(data)) {
                    if (data.measurements.type !== "Pouch&SynselPal") {
                        data.measurements.type = "Pouch&SynselPal";
                        newType = "Pouch&SynselPal";
                        needsUpdate = true;
                    }
                } else {
                    // All other files should be "Lip&LateralSepal"
                    if (data.measurements.type !== "Lip&LateralSepal") {
                        data.measurements.type = "Lip&LateralSepal";
                        newType = "Lip&LateralSepal";
                        needsUpdate = true;
                    }
                }
                
                if (needsUpdate) {
                    // Write back to file with pretty formatting
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                    updatedFiles.push(filename);
                    console.log(`✓ Updated ${filename} - type changed to "${newType}"`);
                } else {
                    skippedFiles.push(filename);
                    console.log(`- Skipped ${filename} - already correctly categorized`);
                }
                
            } catch (error) {
                console.error(`Error processing ${filename}:`, error.message);
            }
        });
        
        console.log(`\n=== Summary ===`);
        console.log(`Updated files: ${updatedFiles.length}`);
        console.log(`Skipped files: ${skippedFiles.length}`);
        
        if (updatedFiles.length > 0) {
            console.log(`\nUpdated files:`, updatedFiles.sort());
        }
        
    } catch (error) {
        console.error('Error reading directory:', error.message);
    }
}

/**
 * Verify the updates by checking which files have which measurement types
 */
function verifyUpdates() {
    try {
        const files = fs.readdirSync(jsonDataPath).filter(file => file.endsWith('.json'));
        
        let pouchSynselPalFiles = [];
        let lipLateralSepalFiles = [];
        let otherFiles = [];
        let unexpectedTypes = [];
        
        files.forEach(filename => {
            const filePath = path.join(jsonDataPath, filename);
            
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (data.measurements && data.measurements.type) {
                    const type = data.measurements.type;
                    
                    if (type === "Pouch&SynselPal") {
                        pouchSynselPalFiles.push(filename);
                    } else if (type === "Lip&LateralSepal") {
                        lipLateralSepalFiles.push(filename);
                    } else if (type === "Other") {
                        otherFiles.push(filename);
                    } else {
                        unexpectedTypes.push({file: filename, type: type});
                    }
                }
                
            } catch (error) {
                console.error(`Error verifying ${filename}:`, error.message);
            }
        });
        
        console.log(`\n=== Verification Results ===`);
        console.log(`Pouch&SynselPal files: ${pouchSynselPalFiles.length}`);
        console.log(`Lip&LateralSepal files: ${lipLateralSepalFiles.length}`);
        console.log(`Other files: ${otherFiles.length}`);
        console.log(`Unexpected types: ${unexpectedTypes.length}`);
        
        if (pouchSynselPalFiles.length > 0) {
            console.log(`\nPouch&SynselPal files:`, pouchSynselPalFiles.sort());
        }
        
        if (otherFiles.length > 0) {
            console.log(`\nOther files:`, otherFiles.sort());
        }
        
        if (unexpectedTypes.length > 0) {
            console.log(`\nUnexpected types:`, unexpectedTypes);
        }
        
    } catch (error) {
        console.error('Error during verification:', error.message);
    }
}

// Export functions for use in other modules
module.exports = {
    updateMeasurementTypes,
    verifyUpdates,
    hasSynsepalPouchMeasurements,
    isDisplayOrSpecialAward
};

// Run the update when script is executed directly
if (require.main === module) {
    console.log('Updating measurement types for 2015 JSON files to three main categories...\n');
    console.log('Categories: "Pouch&SynselPal", "Lip&LateralSepal", and "Other"\n');
    updateMeasurementTypes();
    
    console.log('\nRunning verification...');
    verifyUpdates();
}