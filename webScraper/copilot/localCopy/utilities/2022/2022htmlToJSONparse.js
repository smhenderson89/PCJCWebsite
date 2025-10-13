const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const jsonDirectory = path.resolve(path.join(__dirname, '../../paccentraljc.org/awards/2022/data/json'));
const htmlDirectory = path.resolve(path.join(__dirname, '../../paccentraljc.org/awards/2022/html'));
const logicPath = path.resolve(path.join(__dirname, '../logicReference/missingInfoLogic.json'));

// Load the logic reference for edge cases
const missingInfoLogic = JSON.parse(fs.readFileSync(logicPath, 'utf-8'));

/**
 * Convert date string to YYMMDD format for source URL
 * @param {string} dateStr - Date string like "February 15, 2022"
 * @returns {string} - YYMMDD format like "250215"
 */
function formatDateToYYMMDD(dateStr) {
    try {
        const date = new Date(dateStr);
        const year = date.getFullYear().toString().slice(-2); // Get last 2 digits
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    } catch (error) {
        console.log(`⚠️  Date formatting error: ${dateStr} - ${error.message}`);
        return '250000'; // Default fallback
    }
}

/**
 * Apply missing info logic rules based on award type
 */
function applyMissingInfoLogic(extractedData) {
    const award = extractedData.award;
    
    // Check if this is a display/special award (SC, ST, AQ, JC)
    const isDisplayAward = missingInfoLogic.awardCategories.display_awards.includes(award);
    const isSpecialAward = ['AQ', 'JC'].includes(award);
    const isNoPointAward = missingInfoLogic.awardCategories.no_point_value_awards.includes(award);
    
    console.log(`   🧠 Applying logic rules for award type: ${award}`);
    
    // Apply Display Award Logic (SC, ST, AQ, JC)
    if (isDisplayAward || isSpecialAward) {
        console.log(`   📋 Display/Special award logic for ${award}`);
        
        // Set isDisplay flag per DisplayAwardFlag logic
        extractedData.isDisplay = true;
        console.log(`   🏆 Set isDisplay to true for ${award} award`);
        
        // Set plant fields per logic rules for display awards
        if (!extractedData.genus || extractedData.genus === '') {
            extractedData.genus = 'Display';
            console.log(`   🌸 Set genus to 'Display' for ${award} award`);
        }
        if (!extractedData.species || extractedData.species === '') {
            extractedData.species = 'Award';
            console.log(`   🌸 Set species to 'Award' for ${award} award`);
        }
        if (!extractedData.clone || extractedData.clone === '') {
            extractedData.clone = 'N/A';
        }
        
        // Always set cross to N/A for display/special awards per logic rules
        extractedData.cross = 'N/A';
        console.log(`   🧬 Set cross to 'N/A' for ${award} award`);
        
        // Set measurement type and fields to N/A per logic rules
        if (extractedData.measurements) {
            if (!extractedData.measurements.type || extractedData.measurements.type === '') {
                extractedData.measurements.type = award === 'AQ' ? 'Award Qualifying' : 'Display';
                console.log(`   📏 Set measurement type to '${extractedData.measurements.type}'`);
            }
            
            // Set all measurement fields to N/A per logic rules
            const measurementFields = ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LIPW', 'LSW', 'PCHW', 'SYNSL', 'SYNSW'];
            measurementFields.forEach(field => {
                if (!extractedData.measurements[field] || extractedData.measurements[field] === 0) {
                    extractedData.measurements[field] = 'N/A';
                }
            });
            
            // Set flower counts to N/A for display awards
            if (extractedData.measurements.numFlowers === 0) extractedData.measurements.numFlowers = 'N/A';
            if (extractedData.measurements.numBuds === 0) extractedData.measurements.numBuds = 'N/A';
            if (extractedData.measurements.numInflorescences === 0) extractedData.measurements.numInflorescences = 'N/A';
            
            console.log(`   📏 Set measurement fields to 'N/A' for ${award} award`);
        }
    }
    // Note: isDisplay is only set to true for display awards, omitted for plant awards
    
    // Apply No Point Award Logic  
    if (isNoPointAward) {
        console.log(`   🔢 No-point award logic for ${award}`);
        
        if (extractedData.awardpoints === '' || extractedData.awardpoints === null || extractedData.awardpoints === 0) {
            extractedData.awardpoints = 'N/A';
            console.log(`   🎯 Set award points to 'N/A' for ${award} award`);
        }
        
        // AQ awards get special treatment per logic rules
        if (award === 'AQ' && extractedData.measurements) {
            if (!extractedData.measurements.description || extractedData.measurements.description === '') {
                extractedData.measurements.description = 'Plant meets AQ standards';
                console.log(`   📝 Set AQ description: 'Plant meets AQ standards'`);
            }
        }
    }
    
    // Enhanced photographer detection with fallback strategies
    if (!extractedData.photographer || extractedData.photographer === '' || extractedData.photographer === 'N/A') {
        console.log(`   📷 Photographer field empty, keeping as 'N/A'`);
    }
    
    // Set cross to N/A if empty for all awards (not just display)
    if (!extractedData.cross || extractedData.cross === '') {
        extractedData.cross = 'N/A';
        console.log(`   🧬 Set empty cross field to 'N/A'`);
    }
    
    // Apply specific award fixes from 2022logic.txt FIRST (before general logic)
    extractedData = applySpecific2022Fixes(extractedData);
    
    // Re-check award categories after specific fixes
    const updatedAward = extractedData.award;
    const updatedIsDisplayAward = missingInfoLogic.awardCategories.display_awards.includes(updatedAward);
    const updatedIsSpecialAward = ['AQ', 'JC'].includes(updatedAward);
    const updatedIsNoPointAward = missingInfoLogic.awardCategories.no_point_value_awards.includes(updatedAward);
    
    // Apply updated display award logic if the award was changed by specific fixes
    if (updatedIsDisplayAward && !extractedData.isDisplay) {
        console.log(`   🔄 Re-applying display award logic for updated award: ${updatedAward}`);
        extractedData.isDisplay = true;
        
        // Set measurement fields to N/A for display awards
        if (extractedData.measurements) {
            const measurementFields = ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LIPW', 'LSW', 'PCHW', 'SYNSL', 'SYNSW'];
            measurementFields.forEach(field => {
                if (!extractedData.measurements[field] || extractedData.measurements[field] === 0 || extractedData.measurements[field] === '') {
                    extractedData.measurements[field] = 'N/A';
                }
            });
            console.log(`   📏 Set measurement fields to 'N/A' for updated ${updatedAward} award`);
        }
    }
    
    // Add metadata about logic application
    extractedData.logicApplied = {
        timestamp: new Date().toISOString(),
        rules: 'logicReference/missingInfoLogic.json',
        awardCategory: updatedIsDisplayAward ? 'display' : (updatedIsSpecialAward ? 'special' : (updatedIsNoPointAward ? 'no-point' : 'point-based'))
    };
    
    return extractedData;
}

/**
 * Apply specific 2022 award fixes based on 2022logic.txt
 * 
 * SPECIFIC 2022 FIXES REFERENCE:
 * - Award 20225365: Silver Certificate display award -> SC, N/A points, isDisplay=true
 * - Awards 20225256,20225258: Dendrobium cross -> 'Royal Blue' AM/AOS x 'Blues Brothers'
 * - Award 20225297: Cattleya x blossfeldiana 'Estelle' -> Cattleya rex x Cattleya luteola
 * - Award 20225301: Cattleya warscewiczii cross -> 'La Florista' x 'Anita'
 * - Award 20225358: Paphiopedilum measurements -> Set all to "NM" (not measured)
 * 
 * @param {Object} extractedData - The extracted award data
 * @returns {Object} - Modified award data with specific fixes
 */
function applySpecific2022Fixes(extractedData) {
    const awardNum = extractedData.awardNum;
    console.log(`   🔧 Checking for specific 2022 fixes for award: ${awardNum}`);
    
    // Award 20225365 - Silver Certificate display award fix
    if (awardNum === '20225365') {
        console.log(`   🏆 Applying specific fix for 20225365: SC display award`);
        extractedData.award = 'SC';
        extractedData.awardpoints = 'N/A';
        extractedData.isDisplay = true;
        
        // Add measurement fields for display award
        if (extractedData.measurements) {
            const measurementFields = ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'PCHW'];
            measurementFields.forEach(field => {
                extractedData.measurements[field] = 'N/A';
            });
            console.log(`   📏 Set measurement fields to 'N/A' for SC display award`);
        }
        
        console.log(`   ✅ Fixed 20225365: award=SC, awardpoints=N/A, isDisplay=true, measurements=N/A`);
    }
    
    // Awards 20225256, 20225258 - Dendrobium cross fix
    if (awardNum === '20225256' || awardNum === '20225258') {
        console.log(`   🧬 Applying cross fix for ${awardNum}: Dendrobium victoriae-reginae`);
        extractedData.cross = "'Royal Blue' AM/AOS x 'Blues Brothers'";
        console.log(`   ✅ Fixed ${awardNum}: cross='Royal Blue' AM/AOS x 'Blues Brothers'`);
    }
    
    // Award 20225297 - Cattleya x blossfeldiana fix
    if (awardNum === '20225297') {
        console.log(`   🧬 Applying specific fix for 20225297: Cattleya x blossfeldiana`);
        extractedData.genus = 'Cattleya';
        extractedData.species = 'x blossfeldiana';
        extractedData.clone = "'Estelle'";
        extractedData.cross = 'Cattleya rex x Cattleya luteola';
        console.log(`   ✅ Fixed 20225297: genus=Cattleya, species=x blossfeldiana, clone='Estelle', cross=Cattleya rex x Cattleya luteola`);
    }
    
    // Award 20225301 - Cattleya warscewiczii cross fix
    if (awardNum === '20225301') {
        console.log(`   🧬 Applying cross fix for 20225301: Cattleya warscewiczii`);
        extractedData.cross = "'La Florista' x 'Anita'";
        console.log(`   ✅ Fixed 20225301: cross='La Florista' x 'Anita'`);
    }
    
    // Award 20225358 - Paphiopedilum measurements "NM" fix
    if (awardNum === '20225358') {
        console.log(`   📏 Applying measurement fix for 20225358: NM (not measured)`);
        if (extractedData.measurements) {
            // Set all measurement fields to "NM" (not measured)
            const measurementFields = ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'PCHW', 'PCHL'];
            measurementFields.forEach(field => {
                if (!extractedData.measurements[field] || extractedData.measurements[field] === 0 || extractedData.measurements[field] === '') {
                    extractedData.measurements[field] = 'NM';
                }
            });
            console.log(`   ✅ Fixed 20225358: Set measurement fields to 'NM' (not measured)`);
        }
    }
    
    return extractedData;
}

/**
 * Enhanced photographer extraction from HTML
 */
function extractPhotographerFromHtml(htmlContent, $) {
    // Try multiple strategies to find photographer
    const strategies = [
        () => $('td:contains("Photographer")').next().text().trim(),
        () => $('td:contains("Photography")').next().text().trim(),
        () => $('b:contains("Photographer")').parent().text().replace(/Photographer:?\s*/i, '').trim(),
        () => {
            // Look for "Photo by" or "Photographer:" in body text
            const bodyText = $('body').text();
            const photoMatch = bodyText.match(/(?:Photo by|Photographer:?)\s*([A-Za-z\s]+?)(?:\n|$|\.)/i);
            return photoMatch ? photoMatch[1].trim() : '';
        }
    ];
    
    for (const strategy of strategies) {
        try {
            const result = strategy();
            if (result && result !== '' && !result.toLowerCase().includes('unknown')) {
                console.log(`   📷 Found photographer: "${result}"`);
                return result;
            }
        } catch (e) {
            continue;
        }
    }
    
    return 'N/A';
}

function extractFullAwardDataFromHtml(awardNum) {
    const htmlPath = path.join(htmlDirectory, `${awardNum}.html`);
    
    if (!fs.existsSync(htmlPath)) {
        console.log(`  ❌ HTML file not found: ${awardNum}.html`);
        return null;
    }

    try {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const $ = cheerio.load(htmlContent);
        
        const extractedData = {
            awardNum: awardNum,
            award: '',
            awardpoints: null,
            location: '',
            date: '',
            genus: '',
            species: '',
            clone: '',
            cross: '',
            exhibitor: '',
            photographer: '',
            photo: `images/${awardNum}.jpg`,
            measurements: {
                type: '',
                numFlowers: 0,
                numBuds: 0,
                numInflorescences: 0,
                description: ''
            },
            scrapedDate: new Date().toISOString(),
            sourceUrl: '', // Will be set after we extract the date
            htmlReference: `localCopy/paccentraljc.org/awards/2022/html/${awardNum}.html`,
            year: 2022
        };

        // Extract from main content area - use the full body text approach
        const bodyText = $('body').text();
        
        // Also try the font-specific approach
        const mainFont = $('table').first().find('font[size="+1"]').first();
        
        if (mainFont.length > 0) {
            const htmlText = mainFont.html();
            const lines = htmlText
                .split(/<br[^>]*>/i)
                .map(line => cheerio.load(line).text().trim())
                .filter(line => line && !line.includes('Award '));

            // Process each line
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Date and location (first line)
                if (i === 0 && line.includes(' - ')) {
                    const parts = line.split(' - ');
                    extractedData.date = parts[0].trim();
                    extractedData.location = parts.slice(1).join(' - ').trim();
                    
                    // Generate correct source URL based on extracted date
                    const yymmdd = formatDateToYYMMDD(extractedData.date);
                    extractedData.sourceUrl = `https://www.paccentraljc.org/${yymmdd}/${awardNum}.html`;
                    
                    continue;
                }

                // Plant name with clone
                const plantMatch = line.match(/^([A-Z][a-z]+)\s+(.+?)\s+'([^']+)'$/);
                if (plantMatch) {
                    extractedData.genus = plantMatch[1];
                    extractedData.species = plantMatch[2].trim();
                    extractedData.clone = plantMatch[3];
                    console.log(`   🌸 Plant: ${extractedData.genus} ${extractedData.species} '${extractedData.clone}'`);
                    continue;
                }

                // Plant name without clone
                const plantMatch2 = line.match(/^([A-Z][a-z]+)\s+([a-z][a-zA-Z\s]+)$/);
                if (plantMatch2 && !line.includes('by:')) {
                    extractedData.genus = plantMatch2[1];
                    extractedData.species = plantMatch2[2].trim();
                    console.log(`   🌸 Plant: ${extractedData.genus} ${extractedData.species}`);
                    continue;
                }

                // Cross/parentage (in parentheses)
                const crossMatch = line.match(/^\((.+)\)$/);
                if (crossMatch) {
                    extractedData.cross = crossMatch[1].trim();
                    console.log(`   🧬 Cross: (${extractedData.cross})`);
                    continue;
                }

                // Handle "species" as cross value
                if (line.toLowerCase().trim() === 'species') {
                    extractedData.cross = 'species';
                    console.log(`   🧬 Cross: species (natural species)`);
                    continue;
                }

                // Special award name mappings
                if (line.match(/^Show Trophy$/i)) {
                    extractedData.award = 'ST';
                    extractedData.awardpoints = 'N/A';
                    console.log(`   🏆 Award: ST (Show Trophy)`);
                    continue;
                }

                // Award and points (separate) - expanded to include CCE, ST, SC, EEC
                const awardMatch = line.match(/^(AM|HCC|CCM|CCE|FCC|AQ|CBR|JC|AD|CHM|ST|SC|EEC)\s+(\d+)$/i);
                if (awardMatch) {
                    extractedData.award = awardMatch[1].toUpperCase();
                    extractedData.awardpoints = parseInt(awardMatch[2]);
                    continue;
                }

                // Award without points - expanded to include AQ and special awards
                const awardOnlyMatch = line.match(/^(JC|CBR|CHM|AQ|ST)$/i);
                if (awardOnlyMatch) {
                    extractedData.award = awardOnlyMatch[1].toUpperCase();
                    extractedData.awardpoints = 'N/A';
                    continue;
                }

                // Exhibitor
                const exhibitorMatch = line.match(/^Exhibited by:\s*(.+)$/i);
                if (exhibitorMatch) {
                    extractedData.exhibitor = exhibitorMatch[1].trim();
                    console.log(`   👤 Exhibitor: "${extractedData.exhibitor}"`);
                    continue;
                }

                // Photographer
                const photographerMatch = line.match(/^Photographer:\s*(.+)$/i);
                if (photographerMatch) {
                    extractedData.photographer = photographerMatch[1].trim();
                    console.log(`   📷 Photographer: "${extractedData.photographer}"`);
                    continue;
                }
                
                console.log(`   ❓ Unmatched line: "${line}"`);
            }
        }
        
        // Additional exhibitor extraction - sometimes it's after the main content
        if (!extractedData.exhibitor) {
            console.log(`\n🔍 Exhibitor not found in main content, checking full body...`);
            const exhibitorBodyMatch = bodyText.match(/Exhibited by[:\s]+([^\n\r<]+)/i);
            if (exhibitorBodyMatch) {
                extractedData.exhibitor = exhibitorBodyMatch[1].trim();
                console.log(`   👤 Found exhibitor in body: "${extractedData.exhibitor}"`);
            }
        }

        // Enhanced plant name extraction from title if main content failed
        if (!extractedData.genus) {
            const title = $('title').text().trim();
            const titlePlantMatch1 = title.match(/([A-Z][a-zA-Z]+)\s+([a-zA-Z][a-zA-Z\s]+?)\s+'([^']+)'/);
            if (titlePlantMatch1) {
                extractedData.genus = titlePlantMatch1[1];
                extractedData.species = titlePlantMatch1[2].trim();
                extractedData.clone = titlePlantMatch1[3];
                console.log(`   🌸 Extracted from title: ${extractedData.genus} ${extractedData.species} '${extractedData.clone}'`);
            } else {
                const titlePlantMatch2 = title.match(/([A-Z][a-zA-Z]+)\s+([a-zA-Z][a-zA-Z\s]+)/);
                if (titlePlantMatch2) {
                    extractedData.genus = titlePlantMatch2[1];
                    extractedData.species = titlePlantMatch2[2].trim();
                    console.log(`   🌸 Extracted from title: ${extractedData.genus} ${extractedData.species}`);
                }
            }
        }

        // Enhanced photographer extraction with multiple strategies
        if (!extractedData.photographer || extractedData.photographer === '') {
            extractedData.photographer = extractPhotographerFromHtml(htmlContent, $);
        }

        // Extract measurements
        console.log(`\n📏 Looking for measurements table...`);
        const measurementTable = $('table').eq(1).find('table').first();
        if (measurementTable.length > 0) {
            console.log(`✅ Found measurements table`);
            measurementTable.find('tr').each((i, row) => {
                const $row = $(row);
                const cells = $row.find('td');
                
                // Process pairs of cells (label, value, label, value)
                for (let j = 0; j < cells.length; j += 2) {
                    if (cells[j] && cells[j + 1]) {
                        const label = $(cells[j]).text().trim();
                        const value = $(cells[j + 1]).text().trim();
                        const numValue = parseFloat(value);
                        
                        console.log(`   📊 ${label}: "${value}" (${numValue})`);
                        
                        if (!isNaN(numValue) && ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'LIPL'].includes(label)) {
                            extractedData.measurements[label] = numValue;
                        }
                    }
                }
            });
        } else {
            console.log(`❌ No measurements table found`);
        }

        // Extract flower info (# flowers, buds, inflorescences) and store in measurements
        console.log(`\n🌺 Looking for flower information...`);
        // Look for the table that contains "# flwrs", "# buds", "# infl"
        $('table').each((tableIndex, table) => {
            const $table = $(table);
            const tableText = $table.text();
            
            if (tableText.includes('flwrs') || tableText.includes('buds') || tableText.includes('infl')) {
                console.log(`✅ Found flower info table at index ${tableIndex}`);
                
                $table.find('tr').each((i, row) => {
                    const $row = $(row);
                    const cells = $row.find('td');
                    
                    for (let j = 0; j < cells.length; j += 2) {
                        if (cells[j] && cells[j + 1]) {
                            const label = $(cells[j]).text().trim();
                            const value = $(cells[j + 1]).text().trim();
                            const numValue = parseInt(value);
                            
                            console.log(`   🌼 ${label}: "${value}" (${numValue})`);
                            
                            if (!isNaN(numValue)) {
                                if (label.includes('flwrs')) extractedData.measurements.numFlowers = numValue;
                                if (label.includes('buds')) extractedData.measurements.numBuds = numValue;
                                if (label.includes('infl')) extractedData.measurements.numInflorescences = numValue;
                            }
                        }
                    }
                });
                return false; // Break out of each loop after finding the table
            }
        });

        // Extract description from the last table and store in measurements object
        console.log(`\n📝 Looking for description...`);
        // Find the table with "Description:" in it
        $('table').each((index, table) => {
            const $table = $(table);
            const tableText = $table.text();
            
            if (tableText.includes('Description:')) {
                console.log(`   📝 Found description in table ${index}`);
                const descText = $table.find('td').text().trim();
                const descMatch = descText.match(/Description\s*:\s*(.+)$/is);
                
                if (descMatch) {
                    extractedData.measurements.description = descMatch[1].trim();
                    console.log(`✅ Description: "${extractedData.measurements.description.substring(0, 100)}..."`);
                } else {
                    // Try to get text after "Description:" without regex
                    const parts = descText.split(/Description\s*:\s*/i);
                    if (parts.length > 1) {
                        extractedData.measurements.description = parts[1].trim();
                        console.log(`✅ Description (split method): "${extractedData.measurements.description.substring(0, 100)}..."`);
                    }
                }
                return false; // Break out of each loop
            }
        });

        // Set measurement type based on what measurements we have
        const measurementFields = ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'LIPL'];
        const foundMeasurements = measurementFields.filter(field => extractedData.measurements[field] !== undefined && extractedData.measurements[field] !== 0);
        
        if (foundMeasurements.length > 0) {
            // Check if we have lip measurements
            const hasLipMeasurements = ['LIPW', 'LIPL'].some(field => extractedData.measurements[field] !== undefined && extractedData.measurements[field] !== 0);
            const hasSepalMeasurements = ['NS', 'NSV', 'LSW', 'LSL'].some(field => extractedData.measurements[field] !== undefined && extractedData.measurements[field] !== 0);
            
            if (hasLipMeasurements && hasSepalMeasurements) {
                extractedData.measurements.type = 'Lip&LateralSepal';
            } else if (hasLipMeasurements) {
                extractedData.measurements.type = 'Lip';
            } else if (hasSepalMeasurements) {
                extractedData.measurements.type = 'LateralSepal';
            } else {
                extractedData.measurements.type = 'General';
            }
        } else {
            extractedData.measurements.type = 'N/A';
        }

        console.log(`\n🧠 APPLYING MISSING INFO LOGIC...`);
        // Apply missing info logic rules based on award type
        const enhancedData = applyMissingInfoLogic(extractedData);

        console.log(`\n✅ Extraction complete for ${awardNum}`);
        console.log(`   🌸 Plant: ${enhancedData.genus} ${enhancedData.species} ${enhancedData.clone ? `'${enhancedData.clone}'` : ''}`);
        console.log(`   🎯 Award: ${enhancedData.award} ${enhancedData.awardpoints}`);
        console.log(`   👤 Exhibitor: ${enhancedData.exhibitor}`);
        console.log(`   📷 Photographer: ${enhancedData.photographer}`);
        console.log(`   🧬 Cross: ${enhancedData.cross}`);
        console.log(`   📏 Measurement Type: ${enhancedData.measurements.type}`);
        
        return enhancedData;

    } catch (error) {
        console.log(`  ❌ Error extracting data from ${awardNum}.html: ${error.message}`);
        return null;
    }
}

function processAll2022Files() {
    console.log('🚀 PROCESSING ALL 2022 HTML FILES TO JSON (Enhanced with Logic Reference)');
    console.log('='.repeat(80));
    
    // Ensure JSON directory exists
    if (!fs.existsSync(jsonDirectory)) {
        fs.mkdirSync(jsonDirectory, { recursive: true });
        console.log(`📁 Created JSON directory: ${jsonDirectory}`);
    }
    
    // Get all HTML files, excluding summary pages (20220xxx are summary pages, 20225xxx are individual awards)
    const htmlFiles = fs.readdirSync(htmlDirectory)
        .filter(file => file.endsWith('.html') && file !== '2022.html')
        .filter(file => !file.match(/^20220/)) // Skip summary pages like 20220120.html
        .sort();
    
    console.log(`📄 Found ${htmlFiles.length} HTML files to process`);
    console.log(`🧠 Using logic reference: ${logicPath}\n`);
    
    const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        successes: [],
        failures: []
    };
    
    htmlFiles.forEach((htmlFile, index) => {
        const awardNum = path.basename(htmlFile, '.html');
        console.log(`\n📋 [${index + 1}/${htmlFiles.length}] Processing ${awardNum}...`);
        
        results.processed++;
        
        try {
            const extractedData = extractFullAwardDataFromHtml(awardNum);
            
            if (extractedData) {
                const outputPath = path.join(jsonDirectory, `${awardNum}.json`);
                fs.writeFileSync(outputPath, JSON.stringify(extractedData, null, 2));
                
                console.log(`✅ Success: ${awardNum}.json created`);
                
                results.successful++;
                results.successes.push({
                    awardNum,
                    plant: `${extractedData.genus} ${extractedData.species} ${extractedData.clone ? `'${extractedData.clone}'` : ''}`,
                    award: `${extractedData.award} ${extractedData.awardpoints}`,
                    exhibitor: extractedData.exhibitor
                });
            } else {
                console.log(`❌ Failed: Could not extract data from ${awardNum}.html`);
                results.failed++;
                results.failures.push({
                    awardNum,
                    reason: 'Extraction failed'
                });
            }
            
        } catch (error) {
            console.log(`❌ Error: ${awardNum} - ${error.message}`);
            results.failed++;
            results.failures.push({
                awardNum,
                reason: error.message
            });
        }
    });
    
    // Generate processing report
    const reportPath = path.join(jsonDirectory, '../2022-enhanced-processing-report.json');
    const report = {
        timestamp: new Date().toISOString(),
        logicReferenceUsed: logicPath,
        summary: {
            totalProcessed: results.processed,
            successful: results.successful,
            failed: results.failed,
            successRate: `${(results.successful/results.processed*100).toFixed(1)}%`
        },
        successes: results.successes,
        failures: results.failures
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 ENHANCED PROCESSING COMPLETE');
    console.log(`📊 Success Rate: ${(results.successful/results.processed*100).toFixed(1)}% (${results.successful}/${results.processed})`);
    console.log(`🧠 Logic Reference Applied: ${path.basename(logicPath)}`);
    console.log(`📋 Report saved: ${reportPath}`);
    
    return results;
}

function testSingleFile(awardNum) {
    console.log(`🧪 TESTING ENHANCED PARSER FOR AWARD ${awardNum}`);
    console.log('='.repeat(60));
    
    const result = extractFullAwardDataFromHtml(awardNum);
    
    if (result) {
        console.log('\n🎉 EXTRACTION SUCCESSFUL!');
        console.log('📄 Generated JSON:');
        console.log(JSON.stringify(result, null, 2));
    } else {
        console.log('\n❌ EXTRACTION FAILED');
    }
    
    return result;
}

// Run based on command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--all') {
        // Process all files
        processAll2022Files();
    } else if (args[0] === '--analyze' || args[0] === '--analysis') {
        // Run data quality analysis
        analyze2022Data(true);
    } else if (args[0] === '--full-analysis') {
        // Run comprehensive analysis (shows all files)
        analyze2022Data(false);
    } else if (args[0] === '--test' && args[1]) {
        // Test single file
        const testAward = args[1];
        testSingleFile(testAward);
    } else {
        // Test single file (backward compatibility)
        const testAward = args[0];
        testSingleFile(testAward);
    }
}

/**
 * Consolidated Analysis Function - Run quality analysis on processed JSON files
 * @param {boolean} focusedMode - If true, only show files with missing data
 * @returns {Object} - Analysis results summary
 */
async function analyze2022Data(focusedMode = true) {
    console.log(focusedMode ? '🔍 2022 AWARDS - MISSING DATA ANALYSIS' : '📊 2022 AWARDS - FULL DATA ANALYSIS');
    console.log('='.repeat(80));

    const requiredFields = {
        critical: ['awardNum', 'award', 'awardpoints', 'date', 'location', 'genus', 'species', 'exhibitor'],
        important: ['photographer', 'cross'],
        optional: ['clone']
    };

    const requiredMeasurements = {
        measurementFields: ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'LIPL']
    };

    function categorizeIssues(data, awardNum) {
        const issues = {
            awardNum,
            filename: `${awardNum}.json`,
            plant: `${data.genus || 'Unknown'} ${data.species || 'Unknown'} ${data.clone ? `'${data.clone}'` : ''}`.trim(),
            exhibitor: data.exhibitor || 'Unknown',
            award: `${data.award || 'Missing'} ${data.awardpoints || ''}`.trim(),
            sourceUrl: data.sourceUrl || 'N/A',
            htmlReference: data.htmlReference || 'N/A',
            severity: 'none',
            issues: [],
            missingFields: []
        };

        // Check critical fields
        const criticalMissing = [];
        requiredFields.critical.forEach(field => {
            if (!data[field] || data[field] === '' || data[field] === null) {
                criticalMissing.push(field);
            }
        });

        if (criticalMissing.length > 0) {
            issues.severity = 'critical';
            issues.issues.push(`Missing critical: ${criticalMissing.join(', ')}`);
            issues.missingFields = criticalMissing;
            return issues;
        }

        // Check for display/special awards first
        const isDisplayOrSpecialAward = ['SC', 'ST', 'AQ', 'JC', 'CBR', 'CHM'].includes(data.award);

        // Check important fields
        const importantMissing = [];
        requiredFields.important.forEach(field => {
            if (!data[field] || data[field] === '' || 
                (data[field] === 'N/A' && !(field === 'cross' && isDisplayOrSpecialAward))) {
                importantMissing.push(field);
            }
        });

        if (importantMissing.length > 0) {
            issues.severity = 'important';
            issues.issues.push(`Missing important: ${importantMissing.join(', ')}`);
            issues.missingFields = importantMissing;
            return issues;
        }

        // Check measurements
        const measurementMissing = [];
        if (!data.measurements || !data.measurements.description || data.measurements.description === '') {
            measurementMissing.push('description');
        }

        const hasAnyMeasurements = requiredMeasurements.measurementFields.some(field => 
            data.measurements && data.measurements[field] !== undefined && data.measurements[field] !== null && 
            data.measurements[field] !== '' && !isNaN(data.measurements[field])
        );

        const hasAcceptableNAMeasurements = isDisplayOrSpecialAward && 
            requiredMeasurements.measurementFields.some(field => 
                data.measurements && data.measurements[field] === 'N/A'
            );

        const hasAcceptableNMMeasurements = requiredMeasurements.measurementFields.some(field => 
            data.measurements && data.measurements[field] === 'NM'
        );

        if (!hasAnyMeasurements && !hasAcceptableNAMeasurements && !hasAcceptableNMMeasurements) {
            measurementMissing.push('no_measurement_data');
        }

        if (measurementMissing.length > 0) {
            issues.severity = 'measurements';
            issues.issues.push(`Missing measurements: ${measurementMissing.join(', ')}`);
            issues.missingFields = measurementMissing;
            return issues;
        }

        issues.severity = 'none';
        return issues;
    }

    try {
        const files = fs.readdirSync(jsonDirectory).filter(f => f.endsWith('.json'));
        console.log(`📊 Analyzing ${files.length} JSON files for missing data...`);

        const analysis = {
            total: files.length,
            perfect: 0,
            withIssues: 0,
            critical: [],
            important: [],
            measurements: [],
            descriptionOnly: []
        };

        for (const file of files) {
            const filePath = path.join(jsonDirectory, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const awardNum = path.basename(file, '.json');
            const issues = categorizeIssues(data, awardNum);

            if (issues.severity === 'none') {
                analysis.perfect++;
            } else {
                analysis.withIssues++;
                analysis[issues.severity].push(issues);
            }
        }

        // Print summary
        console.log(`\n📈 SUMMARY:`);
        console.log(`   Total Files: ${analysis.total}`);
        console.log(`   Perfect Files: ${analysis.perfect} (${((analysis.perfect / analysis.total) * 100).toFixed(1)}%)`);
        console.log(`   Files with Missing Data: ${analysis.withIssues} (${((analysis.withIssues / analysis.total) * 100).toFixed(1)}%)`);

        if (focusedMode && analysis.withIssues === 0) {
            console.log(`\n🎉 ALL FILES ARE PERFECT! No missing data found.`);
            return analysis;
        }

        if (!focusedMode || analysis.withIssues > 0) {
            console.log(`\n🚨 BREAKDOWN OF MISSING DATA:`);
            console.log(`   Critical Issues: ${analysis.critical.length}`);
            console.log(`   Important Missing: ${analysis.important.length}`);
            console.log(`   Measurement Issues: ${analysis.measurements.length}`);
            console.log(`   Description Only: ${analysis.descriptionOnly.length}`);

            // Show detailed issues
            if (analysis.critical.length > 0) {
                console.log(`\n🚨 CRITICAL MISSING DATA (${analysis.critical.length}):\n`);
                analysis.critical.forEach((issue, i) => {
                    console.log(`${i + 1}. ${issue.awardNum} - ${issue.plant}`);
                    console.log(`   Award: ${issue.award}`);
                    console.log(`   Exhibitor: ${issue.exhibitor}`);
                    console.log(`   Missing: ${issue.missingFields.join(', ')}`);
                    console.log(`   Source: ${issue.sourceUrl}`);
                    console.log(`   Local HTML: ${issue.htmlReference}`);
                });
            }

            if (analysis.important.length > 0) {
                console.log(`\n⚠️  IMPORTANT MISSING DATA (${analysis.important.length}):\n`);
                analysis.important.forEach((issue, i) => {
                    console.log(`${i + 1}. ${issue.awardNum} - ${issue.plant}`);
                    console.log(`   Award: ${issue.award}`);
                    console.log(`   Exhibitor: ${issue.exhibitor}`);
                    console.log(`   Missing: ${issue.missingFields.join(', ')}`);
                    console.log(`   Source: ${issue.sourceUrl}`);
                    console.log(`   Local HTML: ${issue.htmlReference}`);
                });
            }

            if (analysis.measurements.length > 0) {
                console.log(`\n📏 MEASUREMENT ISSUES (${analysis.measurements.length}):\n`);
                analysis.measurements.forEach((issue, i) => {
                    console.log(`${i + 1}. ${issue.awardNum} - ${issue.plant}`);
                    console.log(`   Award: ${issue.award}`);
                    console.log(`   Exhibitor: ${issue.exhibitor}`);
                    console.log(`   Missing: ${issue.missingFields.join(', ')}`);
                    console.log(`   Source: ${issue.sourceUrl}`);
                    console.log(`   Local HTML: ${issue.htmlReference}`);
                });
            }
        }

        return analysis;

    } catch (error) {
        console.error('❌ Error during analysis:', error);
        throw error;
    }
}

module.exports = {
    extractFullAwardDataFromHtml,
    processAll2022Files,
    testSingleFile,
    applyMissingInfoLogic,
    analyze2022Data
};