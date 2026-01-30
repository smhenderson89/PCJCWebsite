/**
 * 2024 Missing Data Repair Script
 * Repairs missing descriptions and exhibitor information for specific award ranges
 * Awards 20245286-20245310: Missing descriptions
 * Awards 20245377-20245405: Missing exhibitor and/or description
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Paths
const htmlPath = path.join(__dirname, '../../paccentraljc.org/awards/2024/html');
const jsonPath = path.join(__dirname, '../../paccentraljc.org/awards/2024/data/json');

/**
 * Extract description from HTML content
 * @param {string} htmlContent - Raw HTML content
 * @returns {string|null} - Extracted description or null if not found
 */
function extractDescriptionFromHtml(htmlContent) {
    // Use regex to find the description section
    const descriptionMatch = htmlContent.match(/<B><FONT SIZE="\+1">Description<\/FONT><\/B><FONT SIZE="\+1">:\s*([\s\S]*?)<\/FONT>/i);
    
    if (descriptionMatch) {
        let description = descriptionMatch[1];
        
        // Clean up HTML entities and tags
        description = description
            .replace(/<[^>]*>/g, ' ') // Remove HTML tags
            .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with space
            .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
            .trim();
            
        return description || null;
    }
    
    // Fallback: look for any text after "Description:" 
    const fallbackMatch = htmlContent.match(/Description[:\s]*([^<]*(?:<[^>]*>[^<]*)*)/i);
    if (fallbackMatch) {
        let description = fallbackMatch[1]
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        return description || null;
    }
    
    return null;
}

/**
 * Extract exhibitor from HTML content
 * @param {string} htmlContent - Raw HTML content
 * @returns {string|null} - Extracted exhibitor or null if not found
 */
function extractExhibitorFromHtml(htmlContent) {
    // Look for exhibitor pattern in various formats
    const patterns = [
        /Exhibitor[:\s]*([^<\n\r]+)/i,
        /Exhibited by[:\s]*([^<\n\r]+)/i,
        /Owner[:\s]*([^<\n\r]+)/i,
        // Pattern for new format: after award type/points, before "Award 2024xxxx"
        /(FCC|AM|HCC|CHM|JC|AD|CCE|CCM|CBM|SM|PC|AQ|TGC)\s+\d+[\s\r\n]*<BR[^>]*>[\s\r\n]*([^<\n\r]+)[\s\r\n]*<P>/i,
        // Alternative pattern: after award, before paragraph
        /(FCC|AM|HCC|CHM|JC|AD|CCE|CCM|CBM|SM|PC|AQ|TGC)\s+\d+[\s\r\n]*<BR[^>]*>[\s\r\n]*([^<\n\r]+?)(?=[\s\r\n]*<P|[\s\r\n]*<CENTER)/i
    ];
    
    for (const pattern of patterns) {
        const match = htmlContent.match(pattern);
        if (match) {
            // For award-based patterns, use the second capture group
            const exhibitorText = pattern.source.includes('FCC|AM|HCC') ? match[2] : match[1];
            return exhibitorText.replace(/&nbsp;/g, ' ').trim();
        }
    }
    
    return null;
}

/**
 * Repair missing data for a specific award number
 * @param {string} awardNum - Award number to repair
 * @returns {boolean} - True if repair was successful
 */
function repairAwardData(awardNum) {
    const htmlFile = path.join(htmlPath, `${awardNum}.html`);
    const jsonFile = path.join(jsonPath, `${awardNum}.json`);
    
    // Check if both files exist
    if (!fs.existsSync(htmlFile)) {
        console.log(`❌ HTML file not found: ${awardNum}.html`);
        return false;
    }
    
    if (!fs.existsSync(jsonFile)) {
        console.log(`❌ JSON file not found: ${awardNum}.json`);
        return false;
    }
    
    try {
        // Read files
        const htmlContent = fs.readFileSync(htmlFile, 'utf8');
        const jsonData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        
        let updated = false;
        
        // Extract and update description if missing
        if (!jsonData.measurements || !jsonData.measurements.description || jsonData.measurements.description.trim() === '') {
            const description = extractDescriptionFromHtml(htmlContent);
            if (description) {
                if (!jsonData.measurements) {
                    jsonData.measurements = {};
                }
                jsonData.measurements.description = description;
                updated = true;
                console.log(`✅ Updated description for ${awardNum}`);
            } else {
                console.log(`⚠️  Could not extract description for ${awardNum}`);
            }
        }
        
        // Extract and update exhibitor if missing
        if (!jsonData.exhibitor || jsonData.exhibitor.trim() === '') {
            const exhibitor = extractExhibitorFromHtml(htmlContent);
            if (exhibitor) {
                jsonData.exhibitor = exhibitor;
                updated = true;
                console.log(`✅ Updated exhibitor for ${awardNum}: ${exhibitor}`);
            } else {
                console.log(`⚠️  Could not extract exhibitor for ${awardNum}`);
            }
        }
        
        // Save updated JSON if changes were made
        if (updated) {
            fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2));
            console.log(`💾 Saved updates for ${awardNum}`);
            return true;
        } else {
            console.log(`ℹ️  No updates needed for ${awardNum}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error processing ${awardNum}:`, error.message);
        return false;
    }
}

/**
 * Generate award number ranges
 */
function generateAwardRange(start, end) {
    const awards = [];
    for (let i = start; i <= end; i++) {
        awards.push(i.toString());
    }
    return awards;
}

/**
 * Main repair function
 */
function runRepairs() {
    console.log('🔧 Starting 2024 Awards Data Repair...\n');
    
    // Define problematic award ranges
    const missingDescriptions = generateAwardRange(20245286, 20245310);
    const missingExhibitorOrDescription = generateAwardRange(20245377, 20245405);
    
    let totalRepaired = 0;
    let totalProcessed = 0;
    
    console.log('📝 Repairing awards with missing descriptions (20245286-20245310)...');
    for (const awardNum of missingDescriptions) {
        totalProcessed++;
        if (repairAwardData(awardNum)) {
            totalRepaired++;
        }
    }
    
    console.log('\n👤 Repairing awards with missing exhibitor/description (20245377-20245405)...');
    for (const awardNum of missingExhibitorOrDescription) {
        totalProcessed++;
        if (repairAwardData(awardNum)) {
            totalRepaired++;
        }
    }
    
    console.log(`\n📊 Repair Summary:`);
    console.log(`   Total processed: ${totalProcessed}`);
    console.log(`   Total repaired: ${totalRepaired}`);
    console.log(`   Success rate: ${((totalRepaired / totalProcessed) * 100).toFixed(1)}%`);
}

// Run the repairs if this script is executed directly
if (require.main === module) {
    runRepairs();
}

module.exports = {
    extractDescriptionFromHtml,
    extractExhibitorFromHtml,
    repairAwardData,
    runRepairs
};