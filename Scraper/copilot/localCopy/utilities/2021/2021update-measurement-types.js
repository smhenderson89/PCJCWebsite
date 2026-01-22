/**
 * Update measurement type for 2021 JSON files
 * First adds missing SYNSW, SYNSL, PCHW, PCHL measurements from HTML files if needed
 * Then changes "type" to "Pouch&SynselPal" for files containing those measurements
 * Leaves other files unchanged
 */

const fs = require('fs');
const path = require('path');

// Path to the 2021 JSON data directory
const jsonDataPath = path.join(__dirname, '../../paccentraljc.org/awards/2021/data/json');
const htmlDataPath = path.join(__dirname, '../../paccentraljc.org/awards/2021/html');

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
    if (!data.genus && !data.award) return false;
    
    // Check if genus is "Display" or similar indicators
    if (data.genus && (data.genus.toLowerCase() === "display" || 
        data.genus.toLowerCase().includes("display"))) {
        return true;
    }
    
    // Check for display-related award types
    if (data.award) {
        const award = data.award.toLowerCase();
        return award.includes("show trophy") ||
               award === "sm" ||  // Silver Medal
               award === "bm" ||  // Bronze Medal  
               award === "gm" ||  // Gold Medal
               award === "st" ||  // Show Trophy
               award === "aq" ||  // Quality Award (display)
               award.includes("display") ||
               award.includes("trophy");
    }
    
    // Check if species indicates a trophy/display award
    if (data.species && data.species.toLowerCase().includes("trophy")) {
        return true;
    }
    
    return false;
}

/**
 * Extract measurements from HTML file
 * @param {string} htmlFilePath - Path to the HTML file
 * @returns {Object|null} - Extracted measurements or null if not found
 */
function extractMeasurementsFromHTML(htmlFilePath) {
    try {
        if (!fs.existsSync(htmlFilePath)) {
            return null;
        }
        
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        
        // Extract SYNSW, SYNSL, PCHW, PCHL measurements using regex
        const synswMatch = htmlContent.match(/SYNSW<\/TD>[\s\S]*?<FONT SIZE="\+1">([^<]+)<\/FONT>/);
        const synslMatch = htmlContent.match(/SYNSL<\/TD>[\s\S]*?<FONT SIZE="\+1">([^<]+)<\/FONT>/);
        const pchwMatch = htmlContent.match(/PCHW<\/TD>[\s\S]*?<FONT SIZE="\+1">([^<]+)<\/FONT>/);
        const pchlMatch = htmlContent.match(/PCHL<\/TD>[\s\S]*?<FONT SIZE="\+1">([^<]+)<\/FONT>/);
        
        if (synswMatch && synslMatch && pchwMatch && pchlMatch) {
            return {
                SYNSW: parseFloat(synswMatch[1]),
                SYNSL: parseFloat(synslMatch[1]), 
                PCHW: parseFloat(pchwMatch[1]),
                PCHL: parseFloat(pchlMatch[1])
            };
        }
        
        return null;
    } catch (error) {
        console.error(`Error extracting measurements from HTML: ${error.message}`);
        return null;
    }
}

/**
 * Add missing synsepal and pouch measurements to JSON file if they exist in HTML
 * @param {Object} data - The JSON data object
 * @param {string} filename - The filename (e.g., "20212301.json")
 * @returns {boolean} - True if measurements were added
 */
function addMissingMeasurements(data, filename) {
    // Skip if already has synsepal/pouch measurements
    if (hasSynsepalPouchMeasurements(data)) {
        return false;
    }
    
    // Get corresponding HTML file
    const awardNum = filename.replace('.json', '');
    const htmlFilePath = path.join(htmlDataPath, `${awardNum}.html`);
    
    // Extract measurements from HTML
    const measurements = extractMeasurementsFromHTML(htmlFilePath);
    
    if (measurements && data.measurements) {
        data.measurements.SYNSW = measurements.SYNSW;
        data.measurements.SYNSL = measurements.SYNSL;
        data.measurements.PCHW = measurements.PCHW;
        data.measurements.PCHL = measurements.PCHL;
        
        console.log(`  → Added missing measurements: SYNSW: ${measurements.SYNSW}, SYNSL: ${measurements.SYNSL}, PCHW: ${measurements.PCHW}, PCHL: ${measurements.PCHL}`);
        return true;
    }
    
    return false;
}

/**
 * Update measurement types for all files to use the three main categories
 * First adds missing measurements, then categorizes properly
 */
function updateMeasurementTypes() {
    try {
        // Read all JSON files in the directory
        const files = fs.readdirSync(jsonDataPath).filter(file => file.endsWith('.json'));
        
        let updatedFiles = [];
        let skippedFiles = [];
        let measurementsAdded = [];
        
        console.log('Phase 1: Adding missing synsepal/pouch measurements...\n');
        
        files.forEach(filename => {
            const filePath = path.join(jsonDataPath, filename);
            
            try {
                // Read and parse JSON file
                let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                let fileModified = false;
                
                if (!data.measurements) {
                    skippedFiles.push(filename);
                    console.log(`- Skipped ${filename} - no measurements object`);
                    return;
                }
                
                // Try to add missing measurements first
                if (addMissingMeasurements(data, filename)) {
                    measurementsAdded.push(filename);
                    fileModified = true;
                    console.log(`✓ Added measurements to ${filename}`);
                }
                
                // Save file if measurements were added
                if (fileModified) {
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                }
                
            } catch (error) {
                console.error(`Error processing ${filename}:`, error.message);
            }
        });
        
        console.log(`\nPhase 2: Updating measurement types...\n`);
        
        // Now categorize all files
        files.forEach(filename => {
            const filePath = path.join(jsonDataPath, filename);
            
            try {
                // Re-read the file (in case measurements were added)
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                if (!data.measurements) {
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
        console.log(`Measurements added to: ${measurementsAdded.length} files`);
        console.log(`Type updated: ${updatedFiles.length} files`);
        console.log(`Skipped: ${skippedFiles.length} files`);
        
        if (measurementsAdded.length > 0) {
            console.log(`\nFiles with added measurements:`, measurementsAdded.sort());
        }
        
        if (updatedFiles.length > 0) {
            console.log(`\nFiles with updated types:`, updatedFiles.sort());
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
    isDisplayOrSpecialAward,
    extractMeasurementsFromHTML,
    addMissingMeasurements
};

// Run the update when script is executed directly
if (require.main === module) {
    console.log('Updating 2021 JSON files: Adding missing measurements and categorizing types...\n');
    console.log('Categories: "Pouch&SynselPal", "Lip&LateralSepal", and "Other"\n');
    updateMeasurementTypes();
    
    console.log('\nRunning verification...');
    verifyUpdates();
}