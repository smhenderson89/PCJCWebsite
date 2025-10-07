#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

class Categorize2022Issues {
    constructor() {
        this.jsonDir = path.join(__dirname, '..', 'savedData', '2022', 'json');
        this.outputPath = path.join(__dirname, '..', 'savedData', '2022', '2022-categorized-issues.json');
        
        this.categorizedIssues = {
            timestamp: new Date().toISOString(),
            analysisVersion: "1.0",
            purpose: "Categorize empty field issues by fixability and severity for 2022 data",
            summary: {
                totalFilesWithEmptyFields: 0,
                missingCrossParentage: 0,
                measurementOnlyIssues: 0,
                displayAwardExpectedEmpty: 0,
                locationDateMinor: 0,
                problematicFiles: 0
            },
            categories: {
                missingCrossParentage: [],
                measurementOnlyIssues: [],
                displayAwardExpectedEmpty: [],
                locationDateMinor: [],
                problematicFiles: []
            },
            recommendations: {
                missingCrossParentage: "Cross/parentage data missing - may not exist for many awards, extraction from HTML descriptions could be attempted",
                measurementOnlyIssues: "Missing measurement fields - likely not applicable to orchid type or measurement method",
                displayAwardExpectedEmpty: "Display awards correctly have empty plant-specific fields - this is expected behavior",
                locationDateMinor: "Minor location/date gaps - easily fixable from HTML if desired",
                problematicFiles: "Files with multiple issues - may need individual attention or represent special cases"
            }
        };
    }

    async run() {
        console.log('🔍 Categorizing 2022 Data Issues by Type\n');

        // Get all JSON files
        const allFiles = await fs.readdir(this.jsonDir);
        const jsonFiles = allFiles.filter(f => f.endsWith('.json') && f.match(/^20225\d{3}/));

        console.log(`📁 Analyzing ${jsonFiles.length} JSON files for issue categorization...\n`);

        let totalWithIssues = 0;

        // Analyze each file
        for (const fileName of jsonFiles) {
            try {
                const analysis = await this.analyzeFileIssues(fileName);
                if (analysis.hasIssues) {
                    totalWithIssues++;
                    await this.categorizeFileIssues(analysis);
                }
            } catch (error) {
                console.log(`❌ Error analyzing ${fileName}: ${error.message}`);
            }
        }

        // Update summary
        this.categorizedIssues.summary.totalFilesWithEmptyFields = totalWithIssues;
        this.categorizedIssues.summary.missingCrossParentage = this.categorizedIssues.categories.missingCrossParentage.length;
        this.categorizedIssues.summary.measurementOnlyIssues = this.categorizedIssues.categories.measurementOnlyIssues.length;
        this.categorizedIssues.summary.displayAwardExpectedEmpty = this.categorizedIssues.categories.displayAwardExpectedEmpty.length;
        this.categorizedIssues.summary.locationDateMinor = this.categorizedIssues.categories.locationDateMinor.length;
        this.categorizedIssues.summary.problematicFiles = this.categorizedIssues.categories.problematicFiles.length;

        // Save the categorized issues
        await fs.writeJSON(this.outputPath, this.categorizedIssues, { spaces: 2 });

        console.log('📊 Issue Categorization Summary:');
        console.log(`   🌱 Missing Cross/Parentage: ${this.categorizedIssues.summary.missingCrossParentage}`);
        console.log(`   📏 Measurement Only Issues: ${this.categorizedIssues.summary.measurementOnlyIssues}`);
        console.log(`   🎨 Display Award Expected Empty: ${this.categorizedIssues.summary.displayAwardExpectedEmpty}`);
        console.log(`   📍 Location/Date Minor Issues: ${this.categorizedIssues.summary.locationDateMinor}`);
        console.log(`   ⚠️  Problematic Files: ${this.categorizedIssues.summary.problematicFiles}`);
        
        console.log(`\n📄 Categorized issues saved to: ${this.outputPath}`);
        console.log('\n✅ Issue categorization complete!');
    }

    async analyzeFileIssues(fileName) {
        const filePath = path.join(this.jsonDir, fileName);
        const data = await fs.readJSON(filePath);
        const isDisplay = fileName.includes('-display') || data.display === true;
        
        const analysis = {
            fileName,
            awardNum: data.awardNum,
            plantName: this.getPlantName(data),
            exhibitor: data.exhibitor,
            isDisplay,
            emptyFields: [],
            hasIssues: false,
            issueType: null
        };

        // Define all possible fields to check
        const mainFields = ['award', 'awardpoints', 'location', 'date', 'genus', 'species', 'clone', 'cross', 'exhibitor', 'photographer', 'photo'];
        const measurementFields = ['type', 'NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'LIPL', 'numFlowers', 'numBuds', 'description'];

        // Check main fields
        for (const field of mainFields) {
            if (this.isEmpty(data[field])) {
                analysis.emptyFields.push(field);
                analysis.hasIssues = true;
            }
        }

        // Check measurement fields
        if (data.measurements) {
            for (const field of measurementFields) {
                if (this.isEmpty(data.measurements[field])) {
                    analysis.emptyFields.push(`measurements.${field}`);
                    analysis.hasIssues = true;
                }
            }
        }

        return analysis;
    }

    async categorizeFileIssues(analysis) {
        const { fileName, awardNum, plantName, exhibitor, isDisplay, emptyFields } = analysis;
        
        // Determine the primary issue type
        const hasCrossIssue = emptyFields.includes('cross');
        const hasCloneIssue = emptyFields.includes('clone');
        const hasLocationDateIssue = emptyFields.includes('location') || emptyFields.includes('date');
        const hasMeasurementIssues = emptyFields.some(f => f.startsWith('measurements.'));
        const hasMultipleIssues = emptyFields.length >= 9;
        
        // Only measurement issues (and possibly cross/clone)
        const onlyMeasurementAndParentage = emptyFields.every(f => 
            f.startsWith('measurements.') || f === 'cross' || f === 'clone'
        );

        if (isDisplay && emptyFields.length > 0) {
            // Display awards - expected to have empty plant fields
            this.categorizedIssues.categories.displayAwardExpectedEmpty.push({
                awardNum,
                fileName,
                plantName: plantName || "Display Award",
                exhibitor,
                emptyFields,
                emptyCount: emptyFields.length,
                note: "Display award - plant-specific fields appropriately empty"
            });
        } else if (hasMultipleIssues && !isDisplay) {
            // Problematic files with many issues
            this.categorizedIssues.categories.problematicFiles.push({
                awardNum,
                fileName,
                plantName,
                exhibitor,
                emptyCount: emptyFields.length,
                emptyFields,
                note: "Multiple missing fields - may need individual attention"
            });
        } else if (onlyMeasurementAndParentage && hasMeasurementIssues) {
            // Only measurement issues (possibly with cross/clone)
            this.categorizedIssues.categories.measurementOnlyIssues.push({
                awardNum,
                fileName,
                plantName,
                exhibitor,
                emptyFields: emptyFields.filter(f => f.startsWith('measurements.')),
                parentageFields: emptyFields.filter(f => f === 'cross' || f === 'clone')
            });
        } else if ((hasCrossIssue || hasCloneIssue) && emptyFields.length <= 3) {
            // Missing cross/parentage data
            this.categorizedIssues.categories.missingCrossParentage.push({
                awardNum,
                fileName,
                plantName,
                exhibitor,
                emptyFields: emptyFields.filter(f => f === 'cross' || f === 'clone'),
                otherEmptyFields: emptyFields.filter(f => f !== 'cross' && f !== 'clone')
            });
        } else if (hasLocationDateIssue && emptyFields.length <= 2) {
            // Minor location/date issues
            this.categorizedIssues.categories.locationDateMinor.push({
                awardNum,
                fileName,
                plantName,
                exhibitor,
                emptyFields,
                note: "Minor location/date gaps - easily fixable from HTML"
            });
        } else {
            // Default to problematic if doesn't fit other categories
            this.categorizedIssues.categories.problematicFiles.push({
                awardNum,
                fileName,
                plantName,
                exhibitor,
                emptyCount: emptyFields.length,
                emptyFields,
                note: "Unclear categorization - needs review"
            });
        }
    }

    getPlantName(data) {
        if (data.genus && data.species) {
            const clone = data.clone ? ` '${data.clone}'` : '';
            return `${data.genus} ${data.species}${clone}`;
        } else if (data.cross) {
            return data.cross;
        } else if (data.clone) {
            return data.clone;
        }
        return "Unknown";
    }

    isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        if (Array.isArray(value) && value.length === 0) return true;
        if (typeof value === 'object' && Object.keys(value).length === 0) return true;
        return false;
    }
}

// Run the categorization
const categorizer = new Categorize2022Issues();
categorizer.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});