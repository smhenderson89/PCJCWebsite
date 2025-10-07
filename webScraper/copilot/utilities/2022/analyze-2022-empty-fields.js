#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

const JSON_DIR = path.join(__dirname, '..', 'savedData', '2022', 'json');

async function analyze2022JsonFields() {
    console.log('🔍 Starting 2022 JSON Files Empty Fields Analysis\n');

    const jsonFiles = await fs.readdir(JSON_DIR);
    const awardFiles = jsonFiles.filter(f => f.endsWith('.json') && f.match(/^20225\d{3}\.json$/));

    console.log(`📁 Analyzing ${awardFiles.length} JSON files for empty fields...\n`);

    const analysis = {
        metadata: {
            timestamp: new Date().toISOString(),
            totalFiles: awardFiles.length,
            analysisDate: "2025-10-07", // Updated to match current date
            analysisTime: "17:47"
        },
        fieldAnalysis: {
            awardNum: { empty: 0, emptyFiles: [] },
            award: { empty: 0, emptyFiles: [] },
            awardpoints: { empty: 0, emptyFiles: [] },
            location: { empty: 0, emptyFiles: [] },
            date: { empty: 0, emptyFiles: [] },
            genus: { empty: 0, emptyFiles: [] },
            species: { empty: 0, emptyFiles: [] },
            clone: { empty: 0, emptyFiles: [] },
            cross: { empty: 0, emptyFiles: [] },
            exhibitor: { empty: 0, emptyFiles: [] },
            photographer: { empty: 0, emptyFiles: [] },
            photo: { empty: 0, emptyFiles: [] },
            measurements: { empty: 0, emptyFiles: [] },
            scrapedDate: { empty: 0, emptyFiles: [] },
            sourceUrl: { empty: 0, emptyFiles: [] },
            htmlReference: { empty: 0, emptyFiles: [] },
            year: { empty: 0, emptyFiles: [] }
        },
        measurementSubfields: {
            type: { empty: 0, emptyFiles: [] },
            NS: { empty: 0, emptyFiles: [] },
            NSV: { empty: 0, emptyFiles: [] },
            DSW: { empty: 0, emptyFiles: [] },
            DSL: { empty: 0, emptyFiles: [] },
            PETW: { empty: 0, emptyFiles: [] },
            PETL: { empty: 0, emptyFiles: [] },
            LSW: { empty: 0, emptyFiles: [] },
            LSL: { empty: 0, emptyFiles: [] },
            LIPW: { empty: 0, emptyFiles: [] },
            LIPL: { empty: 0, emptyFiles: [] },
            numFlowers: { empty: 0, emptyFiles: [] },
            numBuds: { empty: 0, emptyFiles: [] },
            description: { empty: 0, emptyFiles: [] }
        },
        summary: {
            filesWithMostEmptyFields: [],
            mostCommonEmptyFields: [],
            completionPercentages: {}
        },
        examples: {
            emptyFieldExamples: {},
            wellFormattedExamples: []
        }
    };

    // Analyze each file
    for (const filename of awardFiles) {
        const filePath = path.join(JSON_DIR, filename);
        const data = await fs.readJSON(filePath);
        
        let emptyFieldsInThisFile = 0;
        const emptyFieldsForThisFile = [];

        // Check main fields
        for (const [fieldName, fieldData] of Object.entries(analysis.fieldAnalysis)) {
            const value = data[fieldName];
            const isEmpty = isEmptyValue(value);
            
            if (isEmpty) {
                fieldData.empty++;
                fieldData.emptyFiles.push(filename);
                emptyFieldsInThisFile++;
                emptyFieldsForThisFile.push(fieldName);
            }
        }

        // Check measurement subfields
        if (data.measurements && typeof data.measurements === 'object') {
            for (const [subfieldName, subfieldData] of Object.entries(analysis.measurementSubfields)) {
                const value = data.measurements[subfieldName];
                const isEmpty = isEmptyValue(value);
                
                if (isEmpty) {
                    subfieldData.empty++;
                    subfieldData.emptyFiles.push(filename);
                    emptyFieldsInThisFile++;
                    emptyFieldsForThisFile.push(`measurements.${subfieldName}`);
                }
            }
        } else {
            // measurements field itself is missing/empty
            emptyFieldsInThisFile += Object.keys(analysis.measurementSubfields).length;
        }

        // Track files with many empty fields
        if (emptyFieldsInThisFile > 5) {
            analysis.summary.filesWithMostEmptyFields.push({
                filename,
                emptyFieldCount: emptyFieldsInThisFile,
                emptyFields: emptyFieldsForThisFile
            });
        }

        console.log(`   📄 ${filename}: ${emptyFieldsInThisFile} empty fields`);
    }

    // Calculate completion percentages
    const totalFields = Object.keys(analysis.fieldAnalysis).length + Object.keys(analysis.measurementSubfields).length;
    
    for (const [fieldName, fieldData] of Object.entries({...analysis.fieldAnalysis, ...analysis.measurementSubfields})) {
        const completionRate = ((awardFiles.length - fieldData.empty) / awardFiles.length * 100).toFixed(1);
        analysis.summary.completionPercentages[fieldName] = `${completionRate}%`;
    }

    // Find most common empty fields
    const fieldEmptyCounts = [];
    for (const [fieldName, fieldData] of Object.entries({...analysis.fieldAnalysis, ...analysis.measurementSubfields})) {
        fieldEmptyCounts.push({
            field: fieldName,
            emptyCount: fieldData.empty,
            percentage: ((fieldData.empty / awardFiles.length) * 100).toFixed(1)
        });
    }
    
    fieldEmptyCounts.sort((a, b) => b.emptyCount - a.emptyCount);
    analysis.summary.mostCommonEmptyFields = fieldEmptyCounts.slice(0, 10);

    // Sort files with most empty fields
    analysis.summary.filesWithMostEmptyFields.sort((a, b) => b.emptyFieldCount - a.emptyFieldCount);

    // Collect examples of empty fields
    for (const fieldData of fieldEmptyCounts.slice(0, 5)) {
        const fieldName = fieldData.field;
        const emptyFiles = analysis.fieldAnalysis[fieldName]?.emptyFiles || analysis.measurementSubfields[fieldName]?.emptyFiles || [];
        analysis.examples.emptyFieldExamples[fieldName] = emptyFiles.slice(0, 3); // First 3 examples
    }

    // Find well-formatted examples (files with few empty fields)
    const wellFormattedFiles = [];
    for (const filename of awardFiles) {
        const filePath = path.join(JSON_DIR, filename);
        const data = await fs.readJSON(filePath);
        
        let emptyCount = 0;
        // Count empty main fields
        for (const fieldName of Object.keys(analysis.fieldAnalysis)) {
            if (isEmptyValue(data[fieldName])) emptyCount++;
        }
        // Count empty measurement fields
        if (data.measurements) {
            for (const fieldName of Object.keys(analysis.measurementSubfields)) {
                if (isEmptyValue(data.measurements[fieldName])) emptyCount++;
            }
        }
        
        if (emptyCount <= 3) {
            wellFormattedFiles.push({ filename, emptyCount });
        }
    }
    
    wellFormattedFiles.sort((a, b) => a.emptyCount - b.emptyCount);
    analysis.examples.wellFormattedExamples = wellFormattedFiles.slice(0, 5);

    // Save analysis report
    const reportPath = path.join(path.dirname(JSON_DIR), '2025-10-07-17-47-analysis.json');
    await fs.writeJSON(reportPath, analysis, { spaces: 2 });

    // Print summary
    console.log('\n📊 2022 JSON Fields Analysis Complete\n');
    
    console.log('📋 Top 10 Most Common Empty Fields:');
    analysis.summary.mostCommonEmptyFields.forEach((field, index) => {
        console.log(`   ${index + 1}. ${field.field}: ${field.emptyCount}/${awardFiles.length} files (${field.percentage}% empty)`);
    });

    console.log('\n📄 Files with Most Empty Fields:');
    analysis.summary.filesWithMostEmptyFields.slice(0, 5).forEach(file => {
        console.log(`   📄 ${file.filename}: ${file.emptyFieldCount} empty fields`);
        console.log(`      Empty fields: ${file.emptyFields.join(', ')}`);
    });

    console.log('\n✅ Well-Formatted Files (fewest empty fields):');
    analysis.examples.wellFormattedExamples.forEach(file => {
        console.log(`   📄 ${file.filename}: only ${file.emptyCount} empty fields`);
    });

    console.log(`\n📊 Full analysis saved to: ${reportPath}`);
    console.log('\n✅ Analysis complete!');

    return analysis;
}

function isEmptyValue(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (typeof value === 'number' && value === 0) return false; // 0 is a valid measurement
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
}

// Run the analysis
analyze2022JsonFields().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});