const fs = require('fs');
const path = require('path');

const jsonDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2025/json';
const htmlDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2025/html';
const indexPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2025/html/2025.html';

// Location normalization mappings - these are considered the same location
const locationMappings = {
    'filoli historic house': 'filoli historic house monthly',
    'san francisco': 'san francisco monthly',
    'pos/gccs show': 'peninsula os/gold coast cymbidium show',
    'peninsula os/gold coast cymbidium show': 'pos/gccs show',
    'gold coast cymbidium society outreach': 'gold coast cymbidium society outreach',
    'pacific orchid exposition': 'pacific orchid exposition',
    'santa cruz orchid society show': 'santa cruz orchid society show'
};

function normalizeLocation(location) {
    const normalized = location.toLowerCase().trim();
    
    // Check if this location has a known mapping
    if (locationMappings[normalized]) {
        return locationMappings[normalized];
    }
    
    return normalized;
}

function areLocationsEquivalent(location1, location2) {
    const norm1 = normalizeLocation(location1);
    const norm2 = normalizeLocation(location2);
    
    return norm1 === norm2 || 
           locationMappings[norm1] === norm2 || 
           locationMappings[norm2] === norm1;
}

function extractLocationFromHtml(awardNum) {
    const htmlFilePath = path.join(htmlDir, `${awardNum}.html`);
    
    try {
        if (!fs.existsSync(htmlFilePath)) {
            return null;
        }
        
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        
        // Look for the pattern: Date - Location
        // Example: "January 7, 2025 - San Francisco"
        const dateLocationMatch = htmlContent.match(/([A-Za-z]+ \d+, \d{4}) - ([^<\n\r]+)/);
        
        if (dateLocationMatch && dateLocationMatch[2]) {
            return {
                date: dateLocationMatch[1].trim(),
                location: dateLocationMatch[2].trim()
            };
        }
        
        return null;
    } catch (error) {
        console.error(`Error reading HTML file for ${awardNum}:`, error.message);
        return null;
    }
}

function extractLocationFromIndex() {
    try {
        if (!fs.existsSync(indexPath)) {
            console.error('Index file not found:', indexPath);
            return {};
        }
        
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        const awardLocationMap = {};
        
        // Split content by table rows
        const rows = indexContent.split(/<TR[^>]*>/i);
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            
            // Look for location pattern in the first TD
            const locationMatch = row.match(/<TD[^>]*>.*?([A-Za-z]+ \d+ - [^<]+)/i);
            if (locationMatch) {
                const locationInfo = locationMatch[1].trim();
                
                // Extract all award links in this row
                const awardLinks = row.match(/HREF="[^"]*\/(\d+)\.html"/g);
                
                if (awardLinks) {
                    awardLinks.forEach(link => {
                        const awardNumMatch = link.match(/(\d+)\.html/);
                        if (awardNumMatch) {
                            const awardNum = awardNumMatch[1];
                            awardLocationMap[awardNum] = locationInfo;
                        }
                    });
                }
            }
        }
        
        return awardLocationMap;
    } catch (error) {
        console.error('Error reading index file:', error);
        return {};
    }
}

function determineAuthoritativeLocation(htmlLocationData, indexLocationData) {
    if (!htmlLocationData && !indexLocationData) {
        return null;
    }
    
    if (!htmlLocationData) {
        // Extract location from index
        const indexMatch = indexLocationData.match(/[A-Za-z]+ \d+ - (.+)/);
        return indexMatch ? indexMatch[1].trim() : indexLocationData;
    }
    
    if (!indexLocationData) {
        return htmlLocationData.location;
    }
    
    // Both sources available - check for conflicts
    const htmlLocation = htmlLocationData.location;
    const indexMatch = indexLocationData.match(/[A-Za-z]+ \d+ - (.+)/);
    const indexLocation = indexMatch ? indexMatch[1].trim() : indexLocationData;
    
    // If locations are equivalent, use the more complete name from index
    if (areLocationsEquivalent(htmlLocation, indexLocation)) {
        return indexLocation; // Index usually has more complete names like "Monthly"
    }
    
    // Real conflict - index overrules HTML
    console.log(`  ⚠️  Conflict detected - using index authority: "${indexLocation}" over HTML "${htmlLocation}"`);
    return indexLocation;
}

function populateLocations() {
    console.log('Starting location population for all 2025 JSON files...');
    
    let files = [];
    try {
        files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));
    } catch (error) {
        console.error('Error reading directory:', error);
        return;
    }

    console.log(`Found ${files.length} JSON files to process`);

    // Get location data from both sources
    console.log('Extracting location data from index page...');
    const indexLocationMap = extractLocationFromIndex();
    console.log(`Found ${Object.keys(indexLocationMap).length} awards in index page`);

    let statistics = {
        totalFiles: files.length,
        alreadyHaveLocation: 0,
        locationAdded: 0,
        locationUpdated: 0,
        conflictsResolved: 0,
        noLocationAvailable: 0,
        errors: 0
    };

    files.forEach(file => {
        const filePath = path.join(jsonDir, file);
        const awardNum = file.replace('.json', '');
        
        try {
            console.log(`\nProcessing ${file}...`);
            
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(fileContent);
            
            // Check current location status
            const currentLocation = jsonData.location;
            const hasLocation = currentLocation && typeof currentLocation === 'string' && currentLocation.trim() !== '';
            
            if (hasLocation) {
                console.log(`  ✓ Already has location: "${currentLocation}"`);
                statistics.alreadyHaveLocation++;
                return;
            }
            
            // Extract location from both sources
            const htmlLocationData = extractLocationFromHtml(awardNum);
            const indexLocationData = indexLocationMap[awardNum];
            
            console.log(`  HTML location: ${htmlLocationData ? htmlLocationData.location : 'Not found'}`);
            console.log(`  Index location: ${indexLocationData ? indexLocationData : 'Not found'}`);
            
            // Determine authoritative location
            const authoritativeLocation = determineAuthoritativeLocation(htmlLocationData, indexLocationData);
            
            if (!authoritativeLocation) {
                console.log(`  ❌ No location data available from any source`);
                statistics.noLocationAvailable++;
                return;
            }
            
            // Determine the type of update
            const isConflictResolution = htmlLocationData && indexLocationData && 
                !areLocationsEquivalent(htmlLocationData.location, indexLocationData.match(/[A-Za-z]+ \d+ - (.+)/)?.[1]?.trim() || indexLocationData);
            
            // Update the JSON
            const oldLocation = jsonData.location || '';
            jsonData.location = authoritativeLocation;
            
            // Add correction tracking
            if (!jsonData.corrections) {
                jsonData.corrections = [];
            }
            
            const correctionEntry = {
                timestamp: new Date().toISOString(),
                field: 'location',
                oldValue: oldLocation,
                newValue: authoritativeLocation,
                source: 'automated-location-population'
            };
            
            if (isConflictResolution) {
                correctionEntry.reason = `Conflict resolved: HTML page showed "${htmlLocationData.location}" but index page authority used "${authoritativeLocation}"`;
                correctionEntry.conflictResolution = true;
                statistics.conflictsResolved++;
            } else if (htmlLocationData && indexLocationData) {
                correctionEntry.reason = `Location populated from ${areLocationsEquivalent(htmlLocationData.location, authoritativeLocation) ? 'HTML page (equivalent to index)' : 'index page (more complete name)'}`;
            } else if (htmlLocationData) {
                correctionEntry.reason = 'Location populated from HTML page (only source available)';
            } else {
                correctionEntry.reason = 'Location populated from index page (only source available)';
            }
            
            jsonData.corrections.push(correctionEntry);
            
            // Write the updated JSON
            fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
            
            if (oldLocation.trim() === '') {
                console.log(`  ✅ Added location: "${authoritativeLocation}"`);
                statistics.locationAdded++;
            } else {
                console.log(`  ✅ Updated location: "${oldLocation}" → "${authoritativeLocation}"`);
                statistics.locationUpdated++;
            }
            
        } catch (error) {
            console.error(`  ❌ Error processing ${file}:`, error.message);
            statistics.errors++;
        }
    });

    // Print final statistics
    console.log('\n' + '='.repeat(60));
    console.log('LOCATION POPULATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total files processed: ${statistics.totalFiles}`);
    console.log(`Already had location: ${statistics.alreadyHaveLocation}`);
    console.log(`Locations added: ${statistics.locationAdded}`);
    console.log(`Locations updated: ${statistics.locationUpdated}`);
    console.log(`Conflicts resolved: ${statistics.conflictsResolved}`);
    console.log(`No location available: ${statistics.noLocationAvailable}`);
    console.log(`Errors: ${statistics.errors}`);
    console.log('='.repeat(60));
    
    const totalUpdated = statistics.locationAdded + statistics.locationUpdated;
    if (totalUpdated > 0) {
        console.log('\n✅ SUCCESS: Location data has been populated!');
        console.log('All changes have been logged in the "corrections" field of each JSON file.');
        console.log('You may want to run the analysis script again to verify the results.');
    }
    
    if (statistics.errors > 0) {
        console.log(`\n⚠️  WARNING: ${statistics.errors} files had errors and may need manual review.`);
    }
    
    if (statistics.noLocationAvailable > 0) {
        console.log(`\n❌ ${statistics.noLocationAvailable} files have no location data available from any source.`);
    }
}

populateLocations();