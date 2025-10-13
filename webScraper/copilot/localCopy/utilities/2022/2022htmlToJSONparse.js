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
 * @returns {string} - YYYYMMDD format like "20220215"
 */
function formatDateToYYYYMMDD(dateStr) {
    try {
        const date = new Date(dateStr);
        const year = date.getFullYear().toString();
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
    
    // console.log(`   🧠 Applying logic rules for award type: ${award}`);
    
    // Apply Display Award Logic (SC, ST, AQ, JC)
    if (isDisplayAward || isSpecialAward) {
        // console.log(`   📋 Display/Special award logic for ${award}`);
        
        // Set isDisplay flag per DisplayAwardFlag logic
        extractedData.isDisplay = true;
        // console.log(`   🏆 Set isDisplay to true for ${award} award`);
        
        // Set plant fields per logic rules for display awards
        if (!extractedData.genus || extractedData.genus === '') {
            extractedData.genus = 'Display';
            // console.log(`   🌸 Set genus to 'Display' for ${award} award`);
        }
        if (!extractedData.species || extractedData.species === '') {
            extractedData.species = 'Award';
            // console.log(`   🌸 Set species to 'Award' for ${award} award`);
        }
        if (!extractedData.clone || extractedData.clone === '') {
            extractedData.clone = 'N/A';
        }
        
        // Always set cross to N/A for display/special awards per logic rules
        extractedData.cross = 'N/A';
        // console.log(`   🧬 Set cross to 'N/A' for ${award} award`);
        
        // Set measurement type and fields to N/A per logic rules
        if (extractedData.measurements) {
            if (!extractedData.measurements.type || extractedData.measurements.type === '') {
                extractedData.measurements.type = award === 'AQ' ? 'Award Qualifying' : 'Display';
                // console.log(`   📏 Set measurement type to '${extractedData.measurements.type}'`);
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
            
            // console.log(`   📏 Set measurement fields to 'N/A' for ${award} award`);
        }
    }
    // Note: isDisplay is only set to true for display awards, omitted for plant awards
    
    // Apply No Point Award Logic  
    if (isNoPointAward) {
        // console.log(`   🔢 No-point award logic for ${award}`);
        
        if (extractedData.awardpoints === '' || extractedData.awardpoints === null || extractedData.awardpoints === 0) {
            extractedData.awardpoints = 'N/A';
            // console.log(`   🎯 Set award points to 'N/A' for ${award} award`);
        }
        
        // AQ awards get special treatment per logic rules
        if (award === 'AQ' && extractedData.measurements) {
            if (!extractedData.measurements.description || extractedData.measurements.description === '') {
                extractedData.measurements.description = 'Plant meets AQ standards';
                // console.log(`   📝 Set AQ description: 'Plant meets AQ standards'`);
            }
        }
    }
    
    // Enhanced photographer detection with fallback strategies
    if (!extractedData.photographer || extractedData.photographer === '' || extractedData.photographer === 'N/A') {
        // Keep as N/A
    }
    
    // Set cross to N/A if empty for all awards (not just display)
    if (!extractedData.cross || extractedData.cross === '') {
        extractedData.cross = 'N/A';
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
        extractedData.isDisplay = true;
        
        // Set measurement fields to N/A for display awards
        if (extractedData.measurements) {
            const measurementFields = ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LIPW', 'LSW', 'PCHW', 'SYNSL', 'SYNSW'];
            measurementFields.forEach(field => {
                if (!extractedData.measurements[field] || extractedData.measurements[field] === 0 || extractedData.measurements[field] === '') {
                    extractedData.measurements[field] = 'N/A';
                }
            });
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
 * Apply specific 2022 award fixes based on 2022logic.txt and orchidNameDecisionTree.json
 * 
 * UPDATED 2022 FIXES REFERENCE:
 * - Award 20225262: Missing Date (Oct 4, 2022), Location (San Francisco Monthly), SourceURL
 * - Award 20225263: Missing Date/Location - Check Source HTML
 * - Award 20225304: Missing Award - Award is "AD" (Award of Distinction), awardpoints N/A
 * - Award 20225347: Missing Date/Location - Check Source HTML
 * - Award 20225348: Missing Date/Location - Check Source HTML  
 * - Award 20225349: Missing Date/Location - Check Source HTML
 * - Award 20225350: Missing Date/Location - Check Source HTML
 * - Award 20225415: Display SC (Silver Certificate), genus/species/cross/clone N/A, isDisplay true
 * - Award 20225306: Cross is "Cymbidium Shirley May Walker x Cymbidium Bill Bailey"
 * - Award 20225308: Apply orchidNameDecisionTree.json rules for plant naming
 * - Award 20225329: Apply orchidNameDecisionTree.json rules for plant naming
 * - Award 20225334, 20225335: Apply orchidNameDecisionTree.json rules for plant naming
 * - Display awards: Set isDisplay=true, species fields to N/A if not specified
 * 
 * @param {Object} extractedData - The extracted award data
 * @returns {Object} - Modified award data with specific fixes
 */
function applySpecific2022Fixes(extractedData) {
    const awardNum = extractedData.awardNum;
    
    // Award 20225262 - Missing Date/Location fix
    if (awardNum === '20225262') {
        extractedData.date = 'October 4, 2022';
        extractedData.location = 'San Francisco Monthly';
        // Generate correct source URL based on date
        const yyyymmdd = formatDateToYYYYMMDD(extractedData.date);
        extractedData.sourceUrl = `https://www.paccentraljc.org/${yyyymmdd}/${awardNum}.html`;
    }
    
    // Award 20225263 - Missing Date/Location (extract from source HTML)
    if (awardNum === '20225263') {
        const dateLocation = extractDateLocationFromHtml(awardNum);
        if (dateLocation) {
            extractedData.date = dateLocation.date;
            extractedData.location = dateLocation.location;
            // Generate correct source URL based on date
            const yyyymmdd = formatDateToYYYYMMDD(extractedData.date);
            extractedData.sourceUrl = `https://www.paccentraljc.org/${yyyymmdd}/${awardNum}.html`;
        }
    }
    
    // Award 20225304 - Missing Award Info fix
    if (awardNum === '20225304') {
        extractedData.award = 'AD'; // Award of Distinction
        extractedData.awardpoints = 'N/A'; // No point value for AD
    }
    
    // Awards 20225347, 20225348, 20225349, 20225350 - Missing Date/Location (extract from source HTML)
    if (['20225347', '20225348', '20225349', '20225350'].includes(awardNum)) {
        const dateLocation = extractDateLocationFromHtml(awardNum);
        if (dateLocation) {
            extractedData.date = dateLocation.date;
            extractedData.location = dateLocation.location;
            // Generate correct source URL based on date
            const yyyymmdd = formatDateToYYYYMMDD(extractedData.date);
            extractedData.sourceUrl = `https://www.paccentraljc.org/${yyyymmdd}/${awardNum}.html`;
        }
    }
    
    // Award 20225415 - Display SC (Silver Certificate) fix
    if (awardNum === '20225415') {
        extractedData.award = 'SC'; // Silver Certificate
        extractedData.awardpoints = 'N/A';
        extractedData.isDisplay = true;
        extractedData.genus = 'N/A';
        extractedData.species = 'N/A';
        extractedData.cross = 'N/A';
        extractedData.clone = 'N/A';
        
        // Set measurement fields to N/A for display award
        if (extractedData.measurements) {
            const measurementFields = ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'PCHW'];
            measurementFields.forEach(field => {
                extractedData.measurements[field] = 'N/A';
            });
        }
    }
    
    // Award 20225306 - Cross fix
    if (awardNum === '20225306') {
        extractedData.cross = 'Cymbidium Shirley May Walker x Cymbidium Bill Bailey';
    }
    
    // Award 20225308 - Apply orchidNameDecisionTree.json rules
    if (awardNum === '20225308') {
        // Based on 2022logic.txt: Phalaenopsis Matthew Berry 'My Love' (Phalaenopsis schilleriana x Phalaenopsis leucorrhoda)
        extractedData.genus = 'Phalaenopsis';
        extractedData.species = 'Matthew Berry';
        extractedData.clone = 'My Love';
        extractedData.cross = 'Phalaenopsis schilleriana x Phalaenopsis leucorrhoda';
    }
    
    // Award 20225329 - Apply orchidNameDecisionTree.json rules  
    if (awardNum === '20225329') {
        // Based on 2022logic.txt: Paphiopedilum Wossner Black Wings 'Memoria Scott Collins' (Paphiopedilum rothschildianum 'Leo' x Paphiopedilum adductum 'Ace')
        extractedData.genus = 'Paphiopedilum';
        extractedData.species = 'Wossner Black Wings';
        extractedData.clone = 'Memoria Scott Collins';
        extractedData.cross = "Paphiopedilum rothschildianum 'Leo' x Paphiopedilum adductum 'Ace'";
    }
    
    // Awards 20225334, 20225335 - Apply orchidNameDecisionTree.json rules
    if (awardNum === '20225334') {
        // Re-do this award using orchidNameDecisionTree.json logic
        // Based on existing data: Cattleya purpurata x Cattleya tenebrosa 'Bentley'
        extractedData.genus = 'Cattleya';
        extractedData.species = 'Pacavia'; // Hybrid grex name (uppercase = hybrid/grex)
        extractedData.clone = 'Bentley';
        extractedData.cross = 'Cattleya purpurata x Cattleya tenebrosa';
    }
    
    if (awardNum === '20225335') {
        // Based on existing data: Cattleya purpurata x Cattleya tenebrosa 'Gracie'
        extractedData.genus = 'Cattleya';
        extractedData.species = 'Pacavia'; // Hybrid grex name (uppercase = hybrid/grex)
        extractedData.clone = 'Gracie';
        extractedData.cross = 'Cattleya purpurata x Cattleya tenebrosa';
    }
    
    // Award 20225336 - Add missing cross (extracted from HTML)
    if (awardNum === '20225336') {
        extractedData.cross = 'Vanda critata x Vanda tricolor var. suavis';
    }
    
    // Award 20225348 - Add missing cross (extracted from HTML)
    if (awardNum === '20225348') {
        extractedData.cross = 'Rhyncholaeliocattleya Waikiki Gold x Rhyncholaeliocattleya Vicky Nazareno';
    }
    
    // Award 20225349 - Add missing cross (extracted from HTML) 
    if (awardNum === '20225349') {
        extractedData.cross = 'Cattlianthe Blue Boy x Guarianthe bowringiana';
    }
    
    // Award 20225365 - Silver Certificate display award fix (existing)
    if (awardNum === '20225365') {
        extractedData.award = 'SC';
        extractedData.awardpoints = 'N/A';
        extractedData.isDisplay = true;
        
        // Add measurement fields for display award
        if (extractedData.measurements) {
            const measurementFields = ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'PCHW'];
            measurementFields.forEach(field => {
                extractedData.measurements[field] = 'N/A';
            });
        }
    }
    
    // Awards 20225256, 20225258 - Dendrobium cross fix (existing)
    if (awardNum === '20225256' || awardNum === '20225258') {
        extractedData.cross = "'Royal Blue' AM/AOS x 'Blues Brothers'";
    }
    
    // Award 20225297 - Cattleya x blossfeldiana fix (existing)
    if (awardNum === '20225297') {
        extractedData.genus = 'Cattleya';
        extractedData.species = 'x blossfeldiana';
        extractedData.clone = "'Estelle'";
        extractedData.cross = 'Cattleya rex x Cattleya luteola';
    }
    
    // Award 20225301 - Cattleya warscewiczii cross fix (existing)
    if (awardNum === '20225301') {
        extractedData.cross = "'La Florista' x 'Anita'";
    }
    
    // Award 20225358 - Paphiopedilum measurements "NM" fix (existing)
    if (awardNum === '20225358') {
        if (extractedData.measurements) {
            // Set all measurement fields to "NM" (not measured)
            const measurementFields = ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'PCHW', 'PCHL'];
            measurementFields.forEach(field => {
                if (!extractedData.measurements[field] || extractedData.measurements[field] === 0 || extractedData.measurements[field] === '') {
                    extractedData.measurements[field] = 'NM';
                }
            });
        }
    }
    
    // Apply display award logic for all display awards per 2022logic.txt
    // "Display awards (Show Trophy, ST, etc.) Put N/A for any species not specified. Any display awards should their value isDisplay set to true"
    const displayAwards = ['ST', 'SC', 'EEC', 'SHOW TROPHY', 'SILVER CERTIFICATE'];
    const isDisplayAward = displayAwards.includes(extractedData.award) || 
                          extractedData.award.includes('TROPHY') || 
                          extractedData.award.includes('CERTIFICATE') ||
                          awardNum.includes('-display');
                          
    if (isDisplayAward) {
        extractedData.isDisplay = true;
        
        // Set plant fields per 2022logic.txt: "Put N/A for any species not specified"
        if (!extractedData.genus || extractedData.genus === '' || extractedData.genus === 'Display') {
            extractedData.genus = 'Display';
        }
        if (!extractedData.species || extractedData.species === '' || extractedData.species === 'Display') {
            extractedData.species = 'Award';
        }
        if (!extractedData.clone || extractedData.clone === '') {
            extractedData.clone = 'N/A';
        }
        // Always set cross to N/A for display awards per logic
        extractedData.cross = 'N/A';
    }
    
    return extractedData;
}

/**
 * Extract date and location from HTML file for specific awards
 * @param {string} awardNum - The award number
 * @returns {Object} - Object with date and location, or null if not found
 */
function extractDateLocationFromHtml(awardNum) {
    try {
        const htmlPath = path.join(htmlDirectory, `${awardNum}.html`);
        
        if (!fs.existsSync(htmlPath)) {
            return null;
        }

        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const $ = cheerio.load(htmlContent);
        
        // Look for the date/location in the first table cell with FONT SIZE="+1"
        const mainFont = $('table').first().find('font[size="+1"]').first();
        
        if (mainFont.length > 0) {
            const htmlText = mainFont.html();
            const lines = htmlText
                .split(/<br[^>]*>/i)
                .map(line => cheerio.load(line).text().trim())
                .filter(line => line);

            // The first line should contain date and location
            if (lines.length > 0) {
                const firstLine = lines[0];
                
                // Parse different date/location formats
                // Format 1: "October 4, 2022 San Francisco Monthly"
                // Format 2: "October 15 Filoli Historic House Monthly"
                
                if (firstLine.includes(' - ')) {
                    // Standard format with dash separator
                    const parts = firstLine.split(' - ');
                    return {
                        date: parts[0].trim(),
                        location: parts.slice(1).join(' - ').trim()
                    };
                } else {
                    // Try to separate date from location
                    // Look for year (2022) or month patterns
                    const yearMatch = firstLine.match(/^([^0-9]*\d{1,2},?\s*\d{4})\s+(.+)$/);
                    if (yearMatch) {
                        return {
                            date: yearMatch[1].trim(),
                            location: yearMatch[2].trim()
                        };
                    }
                    
                    // Look for month + day pattern without year
                    const monthDayMatch = firstLine.match(/^([A-Z][a-z]+\s+\d{1,2})\s+(.+)$/);
                    if (monthDayMatch) {
                        return {
                            date: monthDayMatch[1].trim() + ', 2022', // Add year since we know it's 2022
                            location: monthDayMatch[2].trim()
                        };
                    }
                }
            }
        }
        
        return null;
    } catch (error) {
        console.log(`⚠️  Error extracting date/location from ${awardNum}.html: ${error.message}`);
        return null;
    }
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
                    const yyyymmdd = formatDateToYYYYMMDD(extractedData.date);
                    extractedData.sourceUrl = `https://www.paccentraljc.org/${yyyymmdd}/${awardNum}.html`;
                    
                    continue;
                }

                // Plant name with clone
                const plantMatch = line.match(/^([A-Z][a-z]+)\s+(.+?)\s+'([^']+)'$/);
                if (plantMatch) {
                    extractedData.genus = plantMatch[1];
                    extractedData.species = plantMatch[2].trim();
                    extractedData.clone = plantMatch[3];
                    continue;
                }

                // Plant name without clone
                const plantMatch2 = line.match(/^([A-Z][a-z]+)\s+([a-z][a-zA-Z\s]+)$/);
                if (plantMatch2 && !line.includes('by:')) {
                    extractedData.genus = plantMatch2[1];
                    extractedData.species = plantMatch2[2].trim();
                    continue;
                }

                // Cross/parentage (in parentheses)
                const crossMatch = line.match(/^\((.+)\)$/);
                if (crossMatch) {
                    extractedData.cross = crossMatch[1].trim();
                    continue;
                }

                // Handle "species" as cross value
                if (line.toLowerCase().trim() === 'species') {
                    extractedData.cross = 'species';
                    continue;
                }

                // Special award name mappings
                if (line.match(/^Show Trophy$/i)) {
                    extractedData.award = 'ST';
                    extractedData.awardpoints = 'N/A';
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
                    continue;
                }

                // Photographer
                const photographerMatch = line.match(/^Photographer:\s*(.+)$/i);
                if (photographerMatch) {
                    extractedData.photographer = photographerMatch[1].trim();
                    continue;
                }
            }
        }
        
        // Additional exhibitor extraction - sometimes it's after the main content
        if (!extractedData.exhibitor) {
            const exhibitorBodyMatch = bodyText.match(/Exhibited by[:\s]+([^\n\r<]+)/i);
            if (exhibitorBodyMatch) {
                extractedData.exhibitor = exhibitorBodyMatch[1].trim();
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
            } else {
                const titlePlantMatch2 = title.match(/([A-Z][a-zA-Z]+)\s+([a-zA-Z][a-zA-Z\s]+)/);
                if (titlePlantMatch2) {
                    extractedData.genus = titlePlantMatch2[1];
                    extractedData.species = titlePlantMatch2[2].trim();
                }
            }
        }

        // Enhanced photographer extraction with multiple strategies
        if (!extractedData.photographer || extractedData.photographer === '') {
            extractedData.photographer = extractPhotographerFromHtml(htmlContent, $);
        }

        // Extract measurements
        const measurementTable = $('table').eq(1).find('table').first();
        if (measurementTable.length > 0) {
            measurementTable.find('tr').each((i, row) => {
                const $row = $(row);
                const cells = $row.find('td');
                
                // Process pairs of cells (label, value, label, value)
                for (let j = 0; j < cells.length; j += 2) {
                    if (cells[j] && cells[j + 1]) {
                        const label = $(cells[j]).text().trim();
                        const value = $(cells[j + 1]).text().trim();
                        const numValue = parseFloat(value);
                        
                        if (!isNaN(numValue) && ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'LIPL'].includes(label)) {
                            extractedData.measurements[label] = numValue;
                        }
                    }
                }
            });
        }

        // Extract flower info (# flowers, buds, inflorescences) and store in measurements
        $('table').each((tableIndex, table) => {
            const $table = $(table);
            const tableText = $table.text();
            
            if (tableText.includes('flwrs') || tableText.includes('buds') || tableText.includes('infl')) {
                $table.find('tr').each((i, row) => {
                    const $row = $(row);
                    const cells = $row.find('td');
                    
                    for (let j = 0; j < cells.length; j += 2) {
                        if (cells[j] && cells[j + 1]) {
                            const label = $(cells[j]).text().trim();
                            const value = $(cells[j + 1]).text().trim();
                            const numValue = parseInt(value);
                            
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
        $('table').each((index, table) => {
            const $table = $(table);
            const tableText = $table.text();
            
            if (tableText.includes('Description:')) {
                const descText = $table.find('td').text().trim();
                const descMatch = descText.match(/Description\s*:\s*(.+)$/is);
                
                if (descMatch) {
                    extractedData.measurements.description = descMatch[1].trim();
                } else {
                    // Try to get text after "Description:" without regex
                    const parts = descText.split(/Description\s*:\s*/i);
                    if (parts.length > 1) {
                        extractedData.measurements.description = parts[1].trim();
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

        // Apply missing info logic rules based on award type
        const enhancedData = applyMissingInfoLogic(extractedData);
        
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
        .filter(file => !file.includes('-index.html')) // Skip index files
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
        
        results.processed++;
        
        try {
            const extractedData = extractFullAwardDataFromHtml(awardNum);
            
            if (extractedData) {
                const outputPath = path.join(jsonDirectory, `${awardNum}.json`);
                fs.writeFileSync(outputPath, JSON.stringify(extractedData, null, 2));
                
                results.successful++;
                results.successes.push({
                    awardNum,
                    plant: `${extractedData.genus} ${extractedData.species} ${extractedData.clone ? `'${extractedData.clone}'` : ''}`,
                    award: `${extractedData.award} ${extractedData.awardpoints}`,
                    exhibitor: extractedData.exhibitor
                });
            } else {
                results.failed++;
                results.failures.push({
                    awardNum,
                    reason: 'Extraction failed'
                });
            }
            
        } catch (error) {
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
 * Save analysis output to a JSON file based on year (matching 2023/2024/2025 format)
 * @param {Object} analysis - The analysis results object
 * @param {boolean} focusedMode - Whether focused or full analysis
 * @param {string} year - The year for the analysis (default: 2022)
 */
function saveAnalysisToFile(analysis, focusedMode, year = '2022') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const mode = focusedMode ? 'missing-data' : 'full-data';
    const filename = `${year}-${mode}-analysis-${timestamp}.json`;
    const outputPath = path.join(jsonDirectory, '..', filename);
    
    // Create structured JSON output matching previous years' format
    const jsonOutput = {
        metadata: {
            year: parseInt(year),
            analysisType: focusedMode ? 'missing-data' : 'full-data',
            timestamp: new Date().toISOString(),
            generatedBy: `${year}htmlToJSONparse.js`,
            logicReferenceUsed: 'logicReference/missingInfoLogic.json'
        },
        summary: {
            totalFiles: analysis.total,
            perfectFiles: analysis.perfect,
            filesWithIssues: analysis.withIssues,
            perfectPercentage: parseFloat(((analysis.perfect / analysis.total) * 100).toFixed(1)),
            issuesPercentage: parseFloat(((analysis.withIssues / analysis.total) * 100).toFixed(1))
        },
        issueBreakdown: {
            criticalIssues: analysis.critical.length,
            importantMissing: analysis.important.length,
            measurementIssues: analysis.measurements.length,
            descriptionOnly: analysis.descriptionOnly.length
        },
        awardsWithIssues: {
            critical: analysis.critical.map(issue => ({
                awardNum: issue.awardNum,
                filename: issue.filename,
                plant: issue.plant,
                exhibitor: issue.exhibitor,
                award: issue.award,
                severity: issue.severity,
                missingFields: issue.missingFields,
                issues: issue.issues,
                sourceUrl: issue.sourceUrl,
                htmlReference: issue.htmlReference
            })),
            important: analysis.important.map(issue => ({
                awardNum: issue.awardNum,
                filename: issue.filename,
                plant: issue.plant,
                exhibitor: issue.exhibitor,
                award: issue.award,
                severity: issue.severity,
                missingFields: issue.missingFields,
                issues: issue.issues,
                sourceUrl: issue.sourceUrl,
                htmlReference: issue.htmlReference
            })),
            measurements: analysis.measurements.map(issue => ({
                awardNum: issue.awardNum,
                filename: issue.filename,
                plant: issue.plant,
                exhibitor: issue.exhibitor,
                award: issue.award,
                severity: issue.severity,
                missingFields: issue.missingFields,
                issues: issue.issues,
                sourceUrl: issue.sourceUrl,
                htmlReference: issue.htmlReference
            })),
            descriptionOnly: analysis.descriptionOnly.map(issue => ({
                awardNum: issue.awardNum,
                filename: issue.filename,
                plant: issue.plant,
                exhibitor: issue.exhibitor,
                award: issue.award,
                severity: issue.severity,
                missingFields: issue.missingFields,
                issues: issue.issues,
                sourceUrl: issue.sourceUrl,
                htmlReference: issue.htmlReference
            }))
        },
        categorizedAwards: {
            // Group awards by award type for easier analysis
            byAwardType: {},
            byExhibitor: {},
            bySeverity: {
                critical: analysis.critical.map(i => i.awardNum),
                important: analysis.important.map(i => i.awardNum),
                measurements: analysis.measurements.map(i => i.awardNum),
                descriptionOnly: analysis.descriptionOnly.map(i => i.awardNum)
            }
        }
    };
    
    // Group by award type
    [...analysis.critical, ...analysis.important, ...analysis.measurements, ...analysis.descriptionOnly].forEach(issue => {
        const awardType = issue.award.split(' ')[0]; // Get first part of award (AM, HCC, etc.)
        if (!jsonOutput.categorizedAwards.byAwardType[awardType]) {
            jsonOutput.categorizedAwards.byAwardType[awardType] = [];
        }
        jsonOutput.categorizedAwards.byAwardType[awardType].push({
            awardNum: issue.awardNum,
            severity: issue.severity,
            missingFields: issue.missingFields
        });
    });
    
    // Group by exhibitor
    [...analysis.critical, ...analysis.important, ...analysis.measurements, ...analysis.descriptionOnly].forEach(issue => {
        const exhibitor = issue.exhibitor;
        if (!jsonOutput.categorizedAwards.byExhibitor[exhibitor]) {
            jsonOutput.categorizedAwards.byExhibitor[exhibitor] = [];
        }
        jsonOutput.categorizedAwards.byExhibitor[exhibitor].push({
            awardNum: issue.awardNum,
            severity: issue.severity,
            missingFields: issue.missingFields
        });
    });
    
    // Save to JSON file
    fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
    console.log(`💾 Analysis saved to JSON: ${outputPath}\n`);
    
    return outputPath;
}

/**
 * Consolidated Analysis Function - Run quality analysis on processed JSON files
 * @param {boolean} focusedMode - If true, only show files with missing data
 * @param {boolean} saveToFile - If true, save analysis to file (default: true)
 * @returns {Object} - Analysis results summary
 */
async function analyze2022Data(focusedMode = true, saveToFile = true) {
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

        // Save analysis to file if requested
        if (saveToFile) {
            saveAnalysisToFile(analysis, focusedMode, '2022');
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
    analyze2022Data,
    saveAnalysisToFile
};