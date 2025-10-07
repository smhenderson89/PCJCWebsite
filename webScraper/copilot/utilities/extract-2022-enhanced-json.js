const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

class Awards2022EnhancedJsonExtractor {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.year = '2022';
        
        // Directory paths
        this.htmlDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year, 'html');
        this.jsonDir = path.join(this.baseDir, 'savedData', this.year, 'json');
        this.imagesDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year, 'images');
        
        // Ensure directories exist
        fs.ensureDirSync(this.jsonDir);
        
        this.results = {
            processed: [],
            errors: [],
            summary: {
                total: 0,
                successful: 0,
                failed: 0
            }
        };
    }

    async extractAll2022AwardsEnhanced() {
        console.log('🚀 Starting Enhanced 2022 Awards JSON Extraction Process\n');
        console.log('📋 This will:');
        console.log('   1. 📁 Scan all individual award HTML files');
        console.log('   2. 🔍 Extract comprehensive award data (matching 2023 format)');
        console.log('   3. 🌐 Add sourceUrl, htmlReference, scrapedDate, year');
        console.log('   4. 📄 Create enhanced individual JSON files');
        console.log('   5. ✅ Generate extraction report\n');

        try {
            // Step 1: Get individual award HTML files
            console.log('📁 Step 1: Scanning individual award HTML files...');
            const awardFiles = await this.getAwardHtmlFiles();
            console.log(`   Found ${awardFiles.length} award HTML files to process\n`);
            
            this.results.summary.total = awardFiles.length;
            
            // Step 2: Process each HTML file
            console.log('🔍 Step 2: Extracting enhanced award data from HTML files...');
            await this.processAwardFiles(awardFiles);
            
            // Step 3: Generate report
            console.log('✅ Step 3: Generating extraction report...');
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Error in enhanced JSON extraction process:', error);
            throw error;
        }
    }

    async getAwardHtmlFiles() {
        const files = await fs.readdir(this.htmlDir);
        // Filter for individual award files (exclude index files and date files)
        return files.filter(file => {
            return file.endsWith('.html') && 
                   !file.includes('index') && 
                   file.match(/^2022\d{4}\.html$/); // Award files like 20225301.html
        }).map(file => ({
            fileName: file,
            awardNumber: file.replace('.html', ''),
            filePath: path.join(this.htmlDir, file)
        }));
    }

    async processAwardFiles(awardFiles) {
        for (const [index, fileInfo] of awardFiles.entries()) {
            const { fileName, awardNumber, filePath } = fileInfo;
            
            console.log(`   📄 Processing ${index + 1}/${awardFiles.length}: ${fileName}`);
            
            try {
                const awardData = await this.extractEnhancedAwardData(filePath, awardNumber);
                
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
                    console.log(`      ✅ Enhanced: ${awardNumber}.json`);
                } else {
                    throw new Error('No data extracted');
                }
                
            } catch (error) {
                this.results.errors.push({
                    awardNumber,
                    fileName,
                    error: error.message
                });
                
                this.results.summary.failed++;
                console.log(`      ❌ Failed: ${fileName} - ${error.message}`);
            }
        }
        
        console.log(`\n   📊 Enhanced Extraction Summary: ${this.results.summary.successful} successful, ${this.results.summary.failed} failed\n`);
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

        // Extract main award information from the title section
        const titleSection = $('table').first().find('td').first().text();
        
        // Extract date and location (more robust parsing)
        const lines = titleSection.split('\n').map(line => line.trim()).filter(line => line);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Extract date and location from first meaningful line
            if (i === 0 && line.includes('-')) {
                const parts = line.split('-').map(part => part.trim());
                if (parts.length >= 2) {
                    awardData.date = parts[0];
                    awardData.location = parts.slice(1).join(' - ');
                }
            }

            // Extract award and points (e.g., "AM 80", "HCC 75", "CCM 83")
            const awardMatch = line.match(/^(AM|HCC|CCM|FCC|AQ|CBR|JC|AD)\s+(\d+)$/i);
            if (awardMatch) {
                awardData.award = awardMatch[1].toUpperCase();
                awardData.awardpoints = parseInt(awardMatch[2]);
                continue;
            }

            // Extract exhibitor
            const exhibitorMatch = line.match(/Exhibited by:\s*(.+)/i);
            if (exhibitorMatch) {
                awardData.exhibitor = exhibitorMatch[1].trim();
                continue;
            }

            // Extract photographer
            const photographerMatch = line.match(/Photographer:\s*(.+)/i);
            if (photographerMatch) {
                awardData.photographer = photographerMatch[1].trim();
                continue;
            }

            // Extract plant name (genus species 'clone') - improved parsing
            const plantMatch = line.match(/^([A-Z][a-z]+)\s+(.+?)\s+'([^']+)'$/);
            if (plantMatch) {
                awardData.genus = plantMatch[1];
                awardData.species = plantMatch[2].trim();
                awardData.clone = plantMatch[3];
                continue;
            }

            // Alternative plant name pattern (genus species without clone)
            const plantMatch2 = line.match(/^([A-Z][a-z]+)\s+([a-z][a-zA-Z\s]+)$/);
            if (plantMatch2 && !line.includes('Award') && !line.includes('by:')) {
                awardData.genus = plantMatch2[1];
                awardData.species = plantMatch2[2].trim();
                continue;
            }

            // Extract cross/parentage (lines in parentheses)
            const crossMatch = line.match(/^\((.+)\)$/);
            if (crossMatch) {
                awardData.cross = crossMatch[1].trim();
                continue;
            }
        }

        // Extract measurements from the table with enhanced parsing
        const measurementTable = $('table').eq(1);
        if (measurementTable.length) {
            const measurements = {};
            
            measurementTable.find('tr').each((i, row) => {
                const cells = $(row).find('td');
                if (cells.length >= 4) {
                    // Get measurement pairs (label1, value1, label2, value2)
                    const label1 = $(cells[0]).text().trim().replace(/&nbsp;/g, '').replace(/^\s*/, '');
                    const value1 = $(cells[1]).text().trim().replace(/&nbsp;/g, '');
                    const label2 = $(cells[2]).text().trim().replace(/&nbsp;/g, '').replace(/^\s*/, '');
                    const value3 = $(cells[3]).text().trim().replace(/&nbsp;/g, '');
                    
                    if (label1 && value1) {
                        const standardizedLabel1 = this.standardizeMeasurementLabel(label1);
                        measurements[standardizedLabel1] = this.parseValue(value1);
                    }
                    if (label2 && value3) {
                        const standardizedLabel2 = this.standardizeMeasurementLabel(label2);
                        measurements[standardizedLabel2] = this.parseValue(value3);
                    }
                }
            });
            
            awardData.measurements = measurements;
        }

        // Extract description from the full content (improved method)
        const fullText = $.text();
        const descriptionMatch = fullText.match(/description[:\s]*([^.]+\.)/i);
        if (descriptionMatch) {
            awardData.measurements.description = descriptionMatch[1].trim();
        } else {
            // Alternative: look for long descriptive text patterns
            const sentences = fullText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 50);
            if (sentences.length > 0) {
                // Find the most descriptive sentence (usually contains flower count, measurements, etc.)
                const descriptiveSentence = sentences.find(s => 
                    s.includes('flower') || s.includes('inflorescence') || s.includes('cm') || s.includes('sepals')
                );
                if (descriptiveSentence) {
                    awardData.measurements.description = descriptiveSentence.trim();
                }
            }
        }

        // Determine measurement type based on available measurements
        if (awardData.measurements.NS || awardData.measurements.NSV) {
            if (awardData.measurements.LSW || awardData.measurements.LSL) {
                awardData.measurements.type = "Lip&LateralSepal";
            } else {
                awardData.measurements.type = "FlowerMeasurement";
            }
        } else if (awardData.measurements.numFlowers || awardData.measurements.numInflorescences) {
            awardData.measurements.type = "PlantMeasurement";
        } else {
            awardData.measurements.type = "General";
        }

        // Validate required fields
        if (!awardData.awardNum) {
            throw new Error('Missing award number');
        }

        return awardData;
    }

    standardizeMeasurementLabel(label) {
        // Standardize measurement labels to match 2023 format
        const labelMap = {
            '# flwrs': 'numFlowers',
            '# buds': 'numBuds',
            '# inf': 'numInflorescences',
            'flwrs': 'numFlowers',
            'buds': 'numBuds',
            'inf': 'numInflorescences'
        };
        
        return labelMap[label] || label;
    }

    parseValue(value) {
        // Parse values to appropriate types
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            return numValue;
        }
        return value;
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            year: this.year,
            summary: this.results.summary,
            processed: this.results.processed,
            errors: this.results.errors,
            statistics: this.generateStatistics()
        };
        
        const reportPath = path.join(this.jsonDir, '2022-enhanced-json-extraction-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('📋 Enhanced JSON Extraction Summary:');
        console.log(`   📄 Total files processed: ${report.summary.total}`);
        console.log(`   ✅ Successfully extracted: ${report.summary.successful}`);
        console.log(`   ❌ Failed extractions: ${report.summary.failed}`);
        console.log(`   📁 Enhanced JSON files saved to: ${this.jsonDir}`);
        console.log(`   📊 Report saved to: ${reportPath}\n`);
        
        if (report.statistics) {
            console.log('📊 Enhanced Award Statistics:');
            Object.entries(report.statistics.awardTypes).forEach(([award, count]) => {
                console.log(`   ${award}: ${count} awards`);
            });
            console.log(`   📷 With photos: ${report.statistics.withPhotos}`);
            console.log(`   📏 With measurements: ${report.statistics.withMeasurements}`);
            console.log(`   🌐 With sourceUrl: ${report.statistics.withSourceUrl}`);
            console.log(`   📝 With descriptions: ${report.statistics.withDescriptions}`);
        }
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ Extraction errors:');
            this.results.errors.slice(0, 10).forEach(error => {
                console.log(`   • ${error.awardNumber}: ${error.error}`);
            });
            if (this.results.errors.length > 10) {
                console.log(`   ... and ${this.results.errors.length - 10} more errors (see report file)`);
            }
        }
        
        console.log('\n✅ Enhanced 2022 JSON extraction complete!');
    }

    generateStatistics() {
        const stats = {
            awardTypes: {},
            withPhotos: 0,
            withMeasurements: 0,
            withSourceUrl: 0,
            withDescriptions: 0,
            genera: {}
        };
        
        this.results.processed.forEach(item => {
            const data = item.data;
            
            // Count award types
            if (data.award) {
                stats.awardTypes[data.award] = (stats.awardTypes[data.award] || 0) + 1;
            }
            
            // Count items with photos
            if (data.photo) {
                stats.withPhotos++;
            }
            
            // Count items with measurements
            if (data.measurements && Object.keys(data.measurements).length > 0) {
                stats.withMeasurements++;
            }
            
            // Count items with sourceUrl
            if (data.sourceUrl) {
                stats.withSourceUrl++;
            }
            
            // Count items with descriptions
            if (data.measurements && data.measurements.description) {
                stats.withDescriptions++;
            }
            
            // Count genera
            if (data.genus) {
                stats.genera[data.genus] = (stats.genera[data.genus] || 0) + 1;
            }
        });
        
        return stats;
    }
}

// Main execution
async function main() {
    const extractor = new Awards2022EnhancedJsonExtractor();
    
    try {
        await extractor.extractAll2022AwardsEnhanced();
    } catch (error) {
        console.error('❌ Enhanced JSON extraction failed:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = Awards2022EnhancedJsonExtractor;