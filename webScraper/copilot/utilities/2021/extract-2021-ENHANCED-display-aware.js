#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

class Enhanced2021Extractor {
    constructor() {
        this.year = '2021';
        this.htmlDir = path.join(__dirname, '..', '..', 'localCopy', 'paccentraljc.org', 'awards', this.year, 'html');
        this.jsonDir = path.join(__dirname, '..', '..', 'localCopy', 'paccentraljc.org', 'awards', this.year, 'data', 'json');
        this.results = {
            processed: [],
            displayAwards: [],
            errors: [],
            summary: {
                successful: 0,
                displays: 0,
                failed: 0,
                total: 0
            }
        };
    }

    async run() {
        console.log('🚀 Starting ENHANCED 2021 Awards JSON Extraction with Display Detection\n');
        
        console.log('📋 This will:');
        console.log('   1. 📁 Scan all individual award HTML files');
        console.log('   2. 🔍 Extract award data using ENHANCED parsing logic (based on 2023 methods)');
        console.log('   3. 🏆 Identify and properly handle display awards');
        console.log('   4. 📷 Extract photographer information');
        console.log('   5. 📏 Improve measurement extraction');
        console.log('   6. 📄 Create properly named JSON files (-display.json for displays)');
        console.log('   7. ✅ Generate extraction report\n');

        // Get all individual award HTML files (exclude day-index pages)
        const allFiles = await fs.readdir(this.htmlDir);
        const awardFiles = allFiles.filter(file => 
            file.endsWith('.html') && 
            file.match(/^20215\d{3}\.html$/) // Only individual awards (20215XXX)
        );

        this.results.summary.total = awardFiles.length;
        console.log(`📁 Step 1: Found ${awardFiles.length} award HTML files to process\n`);

        console.log('🔍 Step 2: Extracting ENHANCED award data from HTML files...');
        
        for (let i = 0; i < awardFiles.length; i++) {
            const fileName = awardFiles[i];
            const awardNumber = fileName.replace('.html', '');
            const filePath = path.join(this.htmlDir, fileName);
            
            console.log(`   📄 Processing ${i + 1}/${awardFiles.length}: ${fileName}`);
            
            try {
                const awardData = await this.extractEnhancedAwardData(filePath, awardNumber);
                
                if (awardData) {
                    // Determine if this is a display award
                    const isDisplay = this.isDisplayAward(awardData);
                    
                    // Set appropriate filename
                    const jsonFileName = isDisplay ? `${awardNumber}-display.json` : `${awardNumber}.json`;
                    const jsonPath = path.join(this.jsonDir, jsonFileName);
                    
                    // Add display field if it's a display
                    if (isDisplay) {
                        awardData.display = true;
                        this.results.summary.displays++;
                    }
                    
                    // Save JSON file
                    await fs.writeFile(jsonPath, JSON.stringify(awardData, null, 2));
                    
                    this.results.processed.push({
                        awardNumber,
                        fileName,
                        isDisplay,
                        jsonFileName,
                        status: 'success',
                        data: awardData
                    });
                    
                    if (isDisplay) {
                        this.results.displayAwards.push({
                            awardNumber,
                            type: awardData.award || 'Display',
                            exhibitor: awardData.exhibitor
                        });
                    }
                    
                    this.results.summary.successful++;
                    const displayLabel = isDisplay ? ' (Display)' : '';
                    console.log(`      ✅ Enhanced: ${jsonFileName}${displayLabel}`);
                } else {
                    throw new Error('No data extracted');
                }
                
            } catch (error) {
                console.log(`      ❌ Error: ${error.message}`);
                this.results.errors.push({
                    awardNumber,
                    fileName,
                    error: error.message
                });
                this.results.summary.failed++;
            }
        }

        // Clean up old files that might conflict
        await this.cleanupOldFiles();

        // Generate summary and report
        await this.generateReport();
    }

    async extractEnhancedAwardData(filePath, awardNumber) {
        const content = await fs.readFile(filePath, 'utf8');
        const $ = cheerio.load(content);
        
        // Initialize award data structure (matching 2023 format)
        const awardData = {
            awardNum: awardNumber,
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
            photo: `images/${awardNumber}.jpg`,
            measurements: {},
            scrapedDate: new Date().toISOString(),
            sourceUrl: `https://www.paccentraljc.org/awards/${awardNumber}`,
            htmlReference: `localCopy/paccentraljc.org/awards/${this.year}/html/${awardNumber}.html`,
            year: parseInt(this.year)
        };

        // Extract from the main font section (more precise targeting)
        const mainFont = $('table').first().find('font[size="+1"]').first();
        
        if (mainFont.length === 0) {
            throw new Error('Main content section not found');
        }

        // Get the HTML content and split by <BR> tags
        const htmlContent = mainFont.html();
        const lines = htmlContent
            .split(/<br[^>]*>/i)
            .map(line => cheerio.load(line).text().trim())
            .filter(line => line && !line.includes('Award '));

        // Process each line with improved parsing
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // 1. Extract date and location (first line pattern)
            if (i === 0 && line.includes(' - ')) {
                const parts = line.split(' - ');
                if (parts.length >= 2) {
                    awardData.date = parts[0].trim();
                    awardData.location = parts.slice(1).join(' - ').trim();
                }
                continue;
            }

            // 2. Extract plant name (genus species 'clone') - handle display awards differently
            if (line.toLowerCase().includes('display')) {
                // This is likely a display award
                awardData.genus = 'Display';
                awardData.species = line;
                continue;
            }

            const plantNameMatch = line.match(/^([A-Z][a-z]+)\s+(.+?)\s+'([^']+)'$/);
            if (plantNameMatch) {
                awardData.genus = plantNameMatch[1];
                awardData.species = plantNameMatch[2].trim();
                awardData.clone = plantNameMatch[3];
                continue;
            }

            // 3. Extract plant name without clone (genus species)
            const plantNameMatch2 = line.match(/^([A-Z][a-z]+)\s+([a-z][a-zA-Z\s]+)$/);
            if (plantNameMatch2 && !line.includes('by:') && !line.includes('Award')) {
                awardData.genus = plantNameMatch2[1];
                awardData.species = plantNameMatch2[2].trim();
                continue;
            }

            // 4. Extract cross/parentage (parentheses)
            const crossMatch = line.match(/^\((.+)\)$/);
            if (crossMatch) {
                awardData.cross = crossMatch[1].trim();
                continue;
            }

            // 5. Extract award and points - enhanced with more patterns from 2023
            const awardPatterns = [
                /^(AM|HCC|CCM|FCC|AQ|CBR|JC|AD|CHM)\s+(\d+)$/i,
                /^(Show Trophy|Silver Certificate|Bronze Certificate|Gold Certificate)$/i,
                /^(Trophy|Certificate)$/i
            ];

            for (const pattern of awardPatterns) {
                const awardMatch = line.match(pattern);
                if (awardMatch) {
                    awardData.award = awardMatch[1].toUpperCase();
                    if (awardMatch[2] && !isNaN(parseInt(awardMatch[2]))) {
                        awardData.awardpoints = parseInt(awardMatch[2]);
                    } else if (['JC', 'CBR', 'CHM', 'SHOW TROPHY', 'SILVER CERTIFICATE', 'BRONZE CERTIFICATE', 'GOLD CERTIFICATE', 'TROPHY', 'CERTIFICATE'].includes(awardData.award)) {
                        awardData.awardpoints = 'N/A';
                    }
                    break;
                }
            }

            // 6. Extract exhibitor
            const exhibitorMatch = line.match(/^Exhibited by:\s*(.+)$/i);
            if (exhibitorMatch) {
                awardData.exhibitor = exhibitorMatch[1].trim();
                continue;
            }

            // 7. Extract photographer - enhanced pattern matching
            const photographerMatch = line.match(/^Photographer:\s*(.+)$/i);
            if (photographerMatch) {
                awardData.photographer = photographerMatch[1].trim();
                continue;
            }
        }

        // Enhanced measurement extraction using 2023 methods
        await this.extractEnhancedMeasurements($, awardData);

        return awardData;
    }

    async extractEnhancedMeasurements($, awardData) {
        // Find the measurements table (second table)
        const measurementTable = $('table').eq(1).find('table').first();
        
        const measurements = {
            type: "Lip&LateralSepal",
            numFlowers: 0,
            numBuds: 0
        };

        if (measurementTable.length > 0) {
            // Enhanced measurement extraction based on 2023 methods
            measurementTable.find('td').each((i, elem) => {
                const text = $(elem).text().trim();
                
                // Check for measurement field names (from 2023 approach)
                const measurementFields = ['PETL', 'PETW', 'LIPL', 'LIPW', 'NS', 'NSV', 'DSL', 'DSW', 'LSL', 'LSW'];
                
                if (measurementFields.includes(text)) {
                    // Look for the value in the next cell
                    const nextCell = $(elem).next('td');
                    if (nextCell.length > 0) {
                        const value = nextCell.text().trim();
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                            measurements[text] = numValue;
                        }
                    }
                }
            });

            // Also try alternative extraction methods
            measurementTable.find('tr').each((i, row) => {
                const $row = $(row);
                const cells = $row.find('td');
                
                if (cells.length >= 2) {
                    const label = $(cells[0]).text().trim();
                    const value = $(cells[1]).text().trim();
                    
                    // Parse measurement values with additional mappings
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                        const measurementMap = {
                            'NS': 'NS',
                            'NSV': 'NSV', 
                            'DSW': 'DSW',
                            'DSL': 'DSL',
                            'PW': 'PETW',
                            'PL': 'PETL',
                            'PETW': 'PETW',
                            'PETL': 'PETL',
                            'LSW': 'LSW',
                            'LSL': 'LSL',
                            'LW': 'LIPW',
                            'LL': 'LIPL',
                            'LIPW': 'LIPW',
                            'LIPL': 'LIPL',
                            'Flowers': 'numFlowers',
                            'Buds': 'numBuds'
                        };

                        const mappedLabel = measurementMap[label] || label;
                        if (measurementMap[label]) {
                            measurements[mappedLabel] = numValue;
                        }
                    }
                }
            });
        }

        // Extract description from the page - improved extraction
        const descriptionElements = $('td').filter(function() {
            const text = $(this).text();
            return text.length > 50 && 
                   !text.includes('All awards considered pending') &&
                   !text.includes('Measurements in cm') &&
                   text.includes('Description:');
        });

        if (descriptionElements.length > 0) {
            let description = descriptionElements.first().text().trim();
            // Clean up description
            description = description.replace(/\s+/g, ' ').replace(/^Description:\s*/i, '');
            if (description.length > 30) {
                measurements.description = description;
            }
        }

        awardData.measurements = measurements;
    }

    isDisplayAward(awardData) {
        // Determine if this is a display award based on various criteria
        const displayKeywords = ['display', 'show trophy', 'silver certificate', 'bronze certificate', 'gold certificate', 'trophy', 'certificate'];
        
        // Check genus field
        if (awardData.genus && displayKeywords.some(keyword => 
            awardData.genus.toLowerCase().includes(keyword))) {
            return true;
        }
        
        // Check species field
        if (awardData.species && displayKeywords.some(keyword => 
            awardData.species.toLowerCase().includes(keyword))) {
            return true;
        }
        
        // Check award type
        if (awardData.award && displayKeywords.some(keyword => 
            awardData.award.toLowerCase().includes(keyword))) {
            return true;
        }
        
        // Check if core plant fields are empty (likely display)
        if (!awardData.genus || !awardData.species || awardData.genus === '') {
            return true;
        }
        
        return false;
    }

    async cleanupOldFiles() {
        console.log('\n🧹 Step 3: Cleaning up old files...');
        
        // Remove old non-display JSON files that should now be display files
        const displayNumbers = this.results.displayAwards.map(d => d.awardNumber);
        
        for (const displayNum of displayNumbers) {
            const oldFile = path.join(this.jsonDir, `${displayNum}.json`);
            if (await fs.pathExists(oldFile)) {
                await fs.remove(oldFile);
                console.log(`   🗑️ Removed old file: ${displayNum}.json`);
            }
        }
    }

    async generateReport() {
        console.log('\n✅ Step 4: Generating extraction report...');

        // Calculate statistics
        const stats = {
            withAward: 0,
            withAwardPoints: 0,
            withGenus: 0,
            withSpecies: 0,
            withClone: 0,
            withCross: 0,
            withExhibitor: 0,
            withPhotographer: 0,
            withMeasurements: 0,
            withDescription: 0,
            plantAwards: 0,
            displayAwards: 0
        };

        this.results.processed.forEach(item => {
            const data = item.data;
            if (data.award) stats.withAward++;
            if (data.awardpoints) stats.withAwardPoints++;
            if (data.genus && data.genus !== 'Display') stats.withGenus++;
            if (data.species) stats.withSpecies++;
            if (data.clone) stats.withClone++;
            if (data.cross) stats.withCross++;
            if (data.exhibitor) stats.withExhibitor++;
            if (data.photographer) stats.withPhotographer++;
            if (Object.keys(data.measurements).length > 2) stats.withMeasurements++;
            if (data.measurements.description) stats.withDescription++;
            
            if (item.isDisplay) {
                stats.displayAwards++;
            } else {
                stats.plantAwards++;
            }
        });

        // Print summary
        console.log('\n📋 ENHANCED 2021 JSON Extraction Summary:');
        console.log(`   📄 Total files processed: ${this.results.summary.total}`);
        console.log(`   ✅ Successfully extracted: ${this.results.summary.successful}`);
        console.log(`   🏆 Plant awards: ${stats.plantAwards}`);
        console.log(`   🏅 Display awards: ${stats.displayAwards}`);
        console.log(`   ❌ Failed extractions: ${this.results.summary.failed}`);
        console.log(`   📁 Enhanced JSON files saved to: ${this.jsonDir}`);

        // Print statistics
        console.log('\n📊 Enhanced Extraction Statistics:');
        console.log(`   🏆 With award type: ${stats.withAward}/${this.results.summary.successful}`);
        console.log(`   🔢 With award points: ${stats.withAwardPoints}/${this.results.summary.successful}`);
        console.log(`   🌿 With genus: ${stats.withGenus}/${stats.plantAwards} (plant awards only)`);
        console.log(`   🌱 With species: ${stats.withSpecies}/${this.results.summary.successful}`);
        console.log(`   🏷️ With clone: ${stats.withClone}/${stats.plantAwards} (plant awards only)`);
        console.log(`   ❌ With cross: ${stats.withCross}/${this.results.summary.successful}`);
        console.log(`   👤 With exhibitor: ${stats.withExhibitor}/${this.results.summary.successful}`);
        console.log(`   📷 With photographer: ${stats.withPhotographer}/${this.results.summary.successful}`);
        console.log(`   📏 With measurements: ${stats.withMeasurements}/${this.results.summary.successful}`);
        console.log(`   📝 With descriptions: ${stats.withDescription}/${this.results.summary.successful}`);

        // Display awards info
        if (this.results.displayAwards.length > 0) {
            console.log('\n🏅 Display Awards Found:');
            this.results.displayAwards.forEach(display => {
                console.log(`   🏅 ${display.awardNumber}: ${display.type} - ${display.exhibitor}`);
            });
        }

        // Save detailed report outside json folder
        const reportPath = path.join(path.dirname(this.jsonDir), '2021-ENHANCED-json-extraction-report.json');
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: this.results.summary,
            statistics: stats,
            displayAwards: this.results.displayAwards,
            processed: this.results.processed,
            errors: this.results.errors
        };

        await fs.writeJSON(reportPath, reportData, { spaces: 2 });
        console.log(`\n📊 Report saved to: ${reportPath}`);

        console.log('\n✅ ENHANCED 2021 JSON extraction complete!');
    }
}

// Run the enhanced extraction
const extractor = new Enhanced2021Extractor();
extractor.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});