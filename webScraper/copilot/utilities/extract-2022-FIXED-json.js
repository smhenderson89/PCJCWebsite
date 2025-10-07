#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

class Fixed2022Extractor {
    constructor() {
        this.year = '2022';
        this.htmlDir = path.join(__dirname, '..', 'localCopy', 'paccentraljc.org', 'awards', this.year, 'html');
        this.jsonDir = path.join(__dirname, '..', 'savedData', this.year, 'json');
        this.results = {
            processed: [],
            errors: [],
            summary: {
                successful: 0,
                failed: 0,
                total: 0
            }
        };
    }

    async run() {
        console.log('🚀 Starting FIXED 2022 Awards JSON Extraction Process\n');
        
        console.log('📋 This will:');
        console.log('   1. 📁 Scan all individual award HTML files');
        console.log('   2. 🔍 Extract award data using CORRECTED parsing logic');
        console.log('   3. 🌐 Add sourceUrl, htmlReference, scrapedDate, year');
        console.log('   4. 📄 Create CORRECTED individual JSON files');
        console.log('   5. ✅ Generate extraction report\n');

        // Get all individual award HTML files (exclude day-index pages)
        const allFiles = await fs.readdir(this.htmlDir);
        const awardFiles = allFiles.filter(file => 
            file.endsWith('.html') && 
            file.match(/^20225\d{3}\.html$/) // Only individual awards (20225XXX)
        );

        this.results.summary.total = awardFiles.length;
        console.log(`📁 Step 1: Found ${awardFiles.length} award HTML files to process\n`);

        console.log('🔍 Step 2: Extracting CORRECTED award data from HTML files...');
        
        for (let i = 0; i < awardFiles.length; i++) {
            const fileName = awardFiles[i];
            const awardNumber = fileName.replace('.html', '');
            const filePath = path.join(this.htmlDir, fileName);
            
            console.log(`   📄 Processing ${i + 1}/${awardFiles.length}: ${fileName}`);
            
            try {
                const awardData = await this.extractAwardData(filePath, awardNumber);
                
                if (awardData) {
                    // Save JSON file
                    const jsonPath = path.join(this.jsonDir, `${awardNumber}.json`);
                    await fs.writeFile(jsonPath, JSON.stringify(awardData, null, 2));
                    
                    this.results.processed.push({
                        awardNumber,
                        fileName,
                        status: 'success',
                        data: awardData
                    });
                    
                    this.results.summary.successful++;
                    console.log(`      ✅ Fixed: ${awardNumber}.json`);
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

        // Generate summary and report
        await this.generateReport();
    }

    async extractAwardData(filePath, awardNumber) {
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

            // 2. Extract plant name (genus species 'clone')
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

            // 5. Extract award and points (AM 80, HCC 75, etc.)
            const awardMatch = line.match(/^(AM|HCC|CCM|FCC|AQ|CBR|JC|AD|CHM)\s+(\d+)$/i);
            if (awardMatch) {
                awardData.award = awardMatch[1].toUpperCase();
                awardData.awardpoints = parseInt(awardMatch[2]);
                continue;
            }

            // 6. Extract exhibitor
            const exhibitorMatch = line.match(/^Exhibited by:\s*(.+)$/i);
            if (exhibitorMatch) {
                awardData.exhibitor = exhibitorMatch[1].trim();
                continue;
            }

            // 7. Extract photographer
            const photographerMatch = line.match(/^Photographer:\s*(.+)$/i);
            if (photographerMatch) {
                awardData.photographer = photographerMatch[1].trim();
                continue;
            }
        }

        // Extract measurements from the measurements table
        await this.extractMeasurements($, awardData);

        return awardData;
    }

    async extractMeasurements($, awardData) {
        // Find the measurements table (second table)
        const measurementTable = $('table').eq(1).find('table').first();
        
        if (measurementTable.length === 0) {
            return;
        }

        const measurements = {
            type: "Lip&LateralSepal"
        };

        // Extract measurements from table rows
        measurementTable.find('tr').each((i, row) => {
            const $row = $(row);
            const cells = $row.find('td');
            
            if (cells.length >= 2) {
                const label = $(cells[0]).text().trim();
                const value = $(cells[1]).text().trim();
                
                // Parse measurement values
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    // Map common measurement abbreviations
                    const measurementMap = {
                        'NS': 'NS',
                        'NSV': 'NSV', 
                        'DSW': 'DSW',
                        'DSL': 'DSL',
                        'PW': 'PETW',
                        'PL': 'PETL',
                        'LSW': 'LSW',
                        'LSL': 'LSL',
                        'LW': 'LIPW',
                        'LL': 'LIPL',
                        'Flowers': 'numFlowers',
                        'Buds': 'numBuds'
                    };

                    const mappedLabel = measurementMap[label] || label;
                    measurements[mappedLabel] = numValue;
                }
            }
        });

        // Extract description from the page
        const descriptionElements = $('td').filter(function() {
            const text = $(this).text();
            return text.length > 50 && 
                   !text.includes('All awards considered pending') &&
                   !text.includes('Measurements in cm');
        });

        if (descriptionElements.length > 0) {
            let description = descriptionElements.first().text().trim();
            // Clean up description
            description = description.replace(/\s+/g, ' ');
            if (description.length > 30) {
                measurements.description = description;
            }
        }

        // Set default values for missing measurements
        if (!measurements.numFlowers && !measurements.numBuds) {
            measurements.numFlowers = 0;
            measurements.numBuds = 0;
        }

        awardData.measurements = measurements;
    }

    async generateReport() {
        console.log('\n✅ Step 3: Generating extraction report...');

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
            withDescription: 0
        };

        this.results.processed.forEach(item => {
            const data = item.data;
            if (data.award) stats.withAward++;
            if (data.awardpoints) stats.withAwardPoints++;
            if (data.genus) stats.withGenus++;
            if (data.species) stats.withSpecies++;
            if (data.clone) stats.withClone++;
            if (data.cross) stats.withCross++;
            if (data.exhibitor) stats.withExhibitor++;
            if (data.photographer) stats.withPhotographer++;
            if (Object.keys(data.measurements).length > 1) stats.withMeasurements++;
            if (data.measurements.description) stats.withDescription++;
        });

        // Print summary
        console.log('\n📋 FIXED 2022 JSON Extraction Summary:');
        console.log(`   📄 Total files processed: ${this.results.summary.total}`);
        console.log(`   ✅ Successfully extracted: ${this.results.summary.successful}`);
        console.log(`   ❌ Failed extractions: ${this.results.summary.failed}`);
        console.log(`   📁 Fixed JSON files saved to: ${this.jsonDir}`);

        // Print statistics
        console.log('\n📊 Extraction Statistics:');
        console.log(`   🏆 With award type: ${stats.withAward}/${this.results.summary.successful}`);
        console.log(`   🔢 With award points: ${stats.withAwardPoints}/${this.results.summary.successful}`);
        console.log(`   🌿 With genus: ${stats.withGenus}/${this.results.summary.successful}`);
        console.log(`   🌱 With species: ${stats.withSpecies}/${this.results.summary.successful}`);
        console.log(`   🏷️ With clone: ${stats.withClone}/${this.results.summary.successful}`);
        console.log(`   ❌ With cross: ${stats.withCross}/${this.results.summary.successful}`);
        console.log(`   👤 With exhibitor: ${stats.withExhibitor}/${this.results.summary.successful}`);
        console.log(`   📷 With photographer: ${stats.withPhotographer}/${this.results.summary.successful}`);
        console.log(`   📏 With measurements: ${stats.withMeasurements}/${this.results.summary.successful}`);
        console.log(`   📝 With descriptions: ${stats.withDescription}/${this.results.summary.successful}`);

        // Save detailed report outside json folder
        const reportPath = path.join(path.dirname(this.jsonDir), '2022-FIXED-json-extraction-report.json');
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: this.results.summary,
            statistics: stats,
            processed: this.results.processed,
            errors: this.results.errors
        };

        await fs.writeJSON(reportPath, reportData, { spaces: 2 });
        console.log(`\n📊 Report saved to: ${reportPath}`);

        console.log('\n✅ FIXED 2022 JSON extraction complete!');
    }
}

// Run the fixed extraction
const extractor = new Fixed2022Extractor();
extractor.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});