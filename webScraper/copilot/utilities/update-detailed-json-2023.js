const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

class DetailedJsonUpdater2023 {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.year = '2023';
        this.awardsDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year);
        this.htmlDir = path.join(this.awardsDir, 'html');
        this.imagesDir = path.join(this.awardsDir, 'images');
        this.jsonDir = path.join(this.baseDir, 'savedData', this.year, 'json');
        
        // Ensure JSON directory exists
        fs.ensureDirSync(this.jsonDir);
    }

    async updateAllDetailedJsonFiles() {
        console.log('🚀 Starting 2023 Detailed JSON Files Update\n');
        console.log('📋 This will extract structured 2023 orchid award data:');
        console.log('   • Award details (number, type, points)');
        console.log('   • Orchid taxonomy (genus, species, clone, cross)');
        console.log('   • Event info (location, date, exhibitor, photographer)');
        console.log('   • Measurements (detailed morphometric data)');
        console.log('   • Photo references\n');

        // Get all HTML files
        const htmlFiles = await this.getHtmlFiles();
        console.log(`📊 Found ${htmlFiles.length} award HTML files to process\n`);

        let processed = 0;
        let successful = 0;
        let failed = 0;
        const errors = [];

        for (const awardNumber of htmlFiles) {
            try {
                processed++;
                console.log(`📄 Processing ${processed}/${htmlFiles.length}: Award ${awardNumber}`);
                
                const detailedData = await this.extractDetailedAwardData(awardNumber);
                await this.saveDetailedJsonFile(awardNumber, detailedData);
                
                successful++;
                console.log(`   ✅ Saved: ${awardNumber}.json`);
                
            } catch (error) {
                failed++;
                const errorMsg = `Award ${awardNumber}: ${error.message}`;
                errors.push(errorMsg);
                console.log(`   ❌ Failed: ${errorMsg}`);
            }
        }

        // Summary
        console.log('\n📊 2023 DETAILED UPDATE COMPLETE!');
        console.log('==================================');
        console.log(`📄 Total processed: ${processed}`);
        console.log(`✅ Successful: ${successful}`);
        console.log(`❌ Failed: ${failed}`);
        
        if (errors.length > 0) {
            console.log('\n🚨 ERRORS:');
            errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        return {
            processed,
            successful,
            failed,
            errors
        };
    }

    async getHtmlFiles() {
        try {
            const files = await fs.readdir(this.htmlDir);
            return files
                .filter(f => f.endsWith('.html'))
                .filter(f => f.match(/^20235\d{3}\.html$/)) // Only individual awards
                .map(f => f.replace('.html', ''))
                .sort();
        } catch (error) {
            console.error('Error reading HTML directory:', error);
            return [];
        }
    }

    async extractDetailedAwardData(awardNumber) {
        const htmlPath = path.join(this.htmlDir, `${awardNumber}.html`);
        const htmlContent = await fs.readFile(htmlPath, 'utf8');
        const $ = cheerio.load(htmlContent);

        // Get raw text for parsing
        const rawText = $('body').text().replace(/\s+/g, ' ').trim();

        // Check if corresponding image exists
        const imagePath = path.join(this.imagesDir, `${awardNumber}.jpg`);
        const imageExists = await fs.pathExists(imagePath);

        return {
            awardNum: awardNumber,
            award: this.extractAwardType(rawText),
            awardpoints: this.extractAwardPoints(rawText),
            location: this.extractLocation(rawText),
            date: this.extractDate(rawText),
            genus: this.extractGenus(rawText),
            species: this.extractSpecies(rawText),
            clone: this.extractClone(rawText),
            cross: this.extractCross(rawText),
            exhibitor: this.extractExhibitor(rawText),
            photographer: this.extractPhotographer(rawText),
            photo: imageExists ? `images/${awardNumber}.jpg` : null,
            awardphoto: this.extractAwardPhotoReference(rawText),
            measurements: this.extractMeasurements(rawText),
            
            // Metadata
            scrapedDate: new Date().toISOString(),
            sourceUrl: `https://www.paccentraljc.org/awards/${awardNumber}`,
            htmlReference: `localCopy/paccentraljc.org/awards/2023/html/${awardNumber}.html`,
            year: 2023
        };
    }

    extractAwardType(text) {
        // Look for award types: AM, HCC, SC, JC, etc.
        const awardMatch = text.match(/\b(AM|HCC|SC|JC|PC|FCC|CBR|CHM|AD|AQ)\b/i);
        return awardMatch ? awardMatch[1].toUpperCase() : null;
    }

    extractAwardPoints(text) {
        // Look for points (usually after award type)
        const pointsMatch = text.match(/\b(?:AM|HCC|SC|JC|PC|FCC|CBR|CHM|AD|AQ)\s+(\d+)/i);
        return pointsMatch ? parseInt(pointsMatch[1]) : null;
    }

    extractLocation(text) {
        // Extract location from beginning of text (2023 format)
        // Look for patterns like "Jan 20 - Peninsula Orchid Society Show"
        const locationMatch = text.match(/\w+\s+\d{1,2}\s+-\s*([^A-Z\n]+?)(?:\s+[A-Z][a-z]+\s+[a-z]+|$)/);
        if (locationMatch) {
            return locationMatch[1].trim();
        }
        
        // Alternative pattern for 2023
        const altMatch = text.match(/\d{4}\s*-\s*([^A-Z\n]+?)(?:[A-Z]|$)/);
        if (altMatch) {
            return altMatch[1].trim();
        }
        
        return null;
    }

    extractDate(text) {
        // Look for date patterns in 2023 format
        const dateMatch = text.match(/([A-Za-z]+\s+\d{1,2},?\s+2023)/);
        if (dateMatch) return dateMatch[1];
        
        // Alternative format: "Jan 20 - "
        const altMatch = text.match(/([A-Za-z]+\s+\d{1,2})\s+-/);
        if (altMatch) return `${altMatch[1]}, 2023`;
        
        return null;
    }

    extractGenus(text) {
        // Extract genus from orchid name pattern - improved to handle various formats
        // Look for pattern: Genus species 'clone' or Genus Species 'clone'
        const genusMatch = text.match(/\b([A-Z][a-z]+)\s+[A-Za-z]+(?:\s+[x×]|\s+')/);
        if (genusMatch) return genusMatch[1];
        
        // Alternative: look for just Genus followed by a space and capital letter
        const altMatch = text.match(/\b([A-Z][a-z]+)\s+[A-Z]/);
        return altMatch ? altMatch[1] : null;
    }

    extractSpecies(text) {
        // Extract species from orchid name pattern - improved to handle various formats
        // Look for pattern: Genus species 'clone' or Genus Species 'clone' 
        const speciesMatch = text.match(/\b[A-Z][a-z]+\s+([A-Za-z]+)(?:\s+[x×]|\s+')/);
        if (speciesMatch) return speciesMatch[1];
        
        // Alternative: look for second word after genus
        const altMatch = text.match(/\b[A-Z][a-z]+\s+([A-Z][a-z]+)/);
        return altMatch ? altMatch[1] : null;
    }

    extractClone(text) {
        // Extract clone name (text in single quotes)
        const cloneMatch = text.match(/'([^']+)'/);
        return cloneMatch ? cloneMatch[1] : null;
    }

    extractCross(text) {
        // Extract cross information (text in parentheses)
        const crossMatch = text.match(/\(([^)]+)\)/);
        if (crossMatch) {
            const crossText = crossMatch[1];
            // Clean up cross text
            return crossText.replace(/\s+x\s+/, ' × ').trim();
        }
        return null;
    }

    extractExhibitor(text) {
        // Look for "Exhibited by:" pattern
        const exhibitorMatch = text.match(/Exhibited\s+by:\s*([^\n\r]+?)(?:\s+Photographer|$)/i);
        return exhibitorMatch ? exhibitorMatch[1].trim() : null;
    }

    extractPhotographer(text) {
        // Look for "Photographer:" pattern
        const photographerMatch = text.match(/Photographer:\s*([^\n\r]+?)(?:\s+Award|$)/i);
        return photographerMatch ? photographerMatch[1].trim() : null;
    }

    extractAwardPhotoReference(text) {
        // This might need specific logic based on how award photos are referenced
        return null;
    }

    extractMeasurements(text) {
        const measurements = {
            type: null,
            NS: null,
            NSV: null,
            DSL: null,
            DSW: null,
            PETL: null,
            PETW: null,
            numFlowers: null,
            numBuds: null,
            numInflorescences: null,
            description: null
        };

        // Determine measurement type based on available measurements
        if (text.includes('LSW') || text.includes('LSL') || text.includes('LIPW') || text.includes('LIPL')) {
            measurements.type = "Lip&LateralSepal";
            measurements.LSW = this.extractMeasurement(text, 'LSW');
            measurements.LSL = this.extractMeasurement(text, 'LSL');
            measurements.LIPW = this.extractMeasurement(text, 'LIPW');
            measurements.LIPL = this.extractMeasurement(text, 'LIPL');
        } else if (text.includes('PCHW') || text.includes('SYNSL') || text.includes('SYNSW')) {
            measurements.type = "Pouch&Sepal";
            measurements.PCHW = this.extractMeasurement(text, 'PCHW');
            measurements.SYNSL = this.extractMeasurement(text, 'SYNSL');
            measurements.SYNSW = this.extractMeasurement(text, 'SYNSW');
        } else if (text.includes('NS ') || text.includes('DSL') || text.includes('PETL')) {
            measurements.type = "Lip&LateralSepal"; // Default assumption
        }

        // Extract common measurements
        measurements.NS = this.extractMeasurement(text, 'NS');
        measurements.NSV = this.extractMeasurement(text, 'NSV');
        measurements.DSL = this.extractMeasurement(text, 'DSL');
        measurements.DSW = this.extractMeasurement(text, 'DSW');
        measurements.PETL = this.extractMeasurement(text, 'PETL');
        measurements.PETW = this.extractMeasurement(text, 'PETW');

        // Extract flower/bud/inflorescence counts
        measurements.numFlowers = this.extractCount(text, 'flwrs');
        measurements.numBuds = this.extractCount(text, 'buds');
        measurements.numInflorescences = this.extractCount(text, 'infl');

        // Extract description (the detailed botanical description)
        measurements.description = this.extractBotanicalDescription(text);

        return measurements;
    }

    extractMeasurement(text, measurementCode) {
        const regex = new RegExp(`${measurementCode}\\s+(\\d+(?:\\.\\d+)?)`, 'i');
        const match = text.match(regex);
        return match ? parseFloat(match[1]) : null;
    }

    extractCount(text, countType) {
        const regex = new RegExp(`#\\s*${countType}\\s+(\\d+)`, 'i');
        const match = text.match(regex);
        return match ? parseInt(match[1]) : null;
    }

    extractBotanicalDescription(text) {
        // Look for "Description:" section
        const descMatch = text.match(/Description:\s*([^.]+(?:\.[^A-Z][^.]*)*\.)/);
        if (descMatch) {
            let description = descMatch[1].trim();
            // Clean up and limit length
            if (description.length > 2000) {
                description = description.substring(0, 2000) + '...';
            }
            return description;
        }
        return null;
    }

    async saveDetailedJsonFile(awardNumber, awardData) {
        const jsonPath = path.join(this.jsonDir, `${awardNumber}.json`);
        
        // Pretty print JSON with 2-space indentation
        const jsonContent = JSON.stringify(awardData, null, 2);
        
        await fs.writeFile(jsonPath, jsonContent, 'utf8');
    }
}

async function updateDetailed2023JsonFiles() {
    console.log('🚀 Starting 2023 Detailed JSON Files Update Process\n');
    
    try {
        const updater = new DetailedJsonUpdater2023();
        const results = await updater.updateAllDetailedJsonFiles();
        
        console.log('\n🎉 2023 DETAILED JSON UPDATE COMPLETE!');
        console.log(`✅ Successfully updated ${results.successful} JSON files with detailed structure`);
        
        if (results.failed > 0) {
            console.log(`⚠️  ${results.failed} files had issues`);
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Error during 2023 detailed JSON update:', error);
    }
}

if (require.main === module) {
    updateDetailed2023JsonFiles().catch(console.error);
}

module.exports = { updateDetailed2023JsonFiles };