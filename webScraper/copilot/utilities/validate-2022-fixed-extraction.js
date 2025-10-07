#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

const JSON_DIR = path.join(__dirname, '..', 'savedData', '2022', 'json');

async function validateFixedExtraction() {
    console.log('🔍 Validating FIXED 2022 JSON Extraction Results\n');

    const jsonFiles = await fs.readdir(JSON_DIR);
    const awardFiles = jsonFiles.filter(f => f.endsWith('.json') && f.match(/^20225\d{3}\.json$/));

    console.log(`📁 Analyzing ${awardFiles.length} JSON files...\n`);

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
        validGenusNames: 0,
        validAwards: 0
    };

    const sampleData = [];
    
    for (const filename of awardFiles) {
        const filePath = path.join(JSON_DIR, filename);
        const data = await fs.readJSON(filePath);
        
        // Count populated fields
        if (data.award && data.award.trim() !== '') stats.withAward++;
        if (data.awardpoints !== null && data.awardpoints !== undefined) stats.withAwardPoints++;
        if (data.genus && data.genus.trim() !== '' && data.genus !== 'All') {
            stats.withGenus++;
            // Check if genus looks valid (starts with capital letter, reasonable length)
            if (data.genus.match(/^[A-Z][a-z]+$/)) stats.validGenusNames++;
        }
        if (data.species && data.species.trim() !== '' && !data.species.includes('awards considered')) stats.withSpecies++;
        if (data.clone && data.clone.trim() !== '') stats.withClone++;
        if (data.cross && data.cross.trim() !== '') stats.withCross++;
        if (data.exhibitor && data.exhibitor.trim() !== '') stats.withExhibitor++;
        if (data.photographer && data.photographer.trim() !== '') stats.withPhotographer++;
        if (data.measurements && Object.keys(data.measurements).length > 1) stats.withMeasurements++;
        if (data.measurements && data.measurements.description && data.measurements.description.length > 50) stats.withDescription++;
        
        // Check for valid award types
        if (data.award && data.award.match(/^(AM|HCC|CCM|FCC|AQ|CBR|JC|AD|CHM)$/)) stats.validAwards++;

        // Collect sample data for first few files
        if (sampleData.length < 5) {
            sampleData.push({
                file: filename,
                award: data.award,
                points: data.awardpoints,
                genus: data.genus,
                species: data.species.substring(0, 30) + (data.species.length > 30 ? '...' : ''),
                clone: data.clone,
                exhibitor: data.exhibitor
            });
        }
    }

    // Print results
    console.log('📊 FIXED Extraction Validation Results:');
    console.log(`   📄 Total files: ${awardFiles.length}`);
    console.log(`   🏆 With award type: ${stats.withAward}/${awardFiles.length} (${Math.round(stats.withAward/awardFiles.length*100)}%)`);
    console.log(`   🔢 With award points: ${stats.withAwardPoints}/${awardFiles.length} (${Math.round(stats.withAwardPoints/awardFiles.length*100)}%)`);
    console.log(`   🌿 With genus: ${stats.withGenus}/${awardFiles.length} (${Math.round(stats.withGenus/awardFiles.length*100)}%)`);
    console.log(`   ✅ Valid genus names: ${stats.validGenusNames}/${awardFiles.length} (${Math.round(stats.validGenusNames/awardFiles.length*100)}%)`);
    console.log(`   🌱 With species: ${stats.withSpecies}/${awardFiles.length} (${Math.round(stats.withSpecies/awardFiles.length*100)}%)`);
    console.log(`   🏷️ With clone: ${stats.withClone}/${awardFiles.length} (${Math.round(stats.withClone/awardFiles.length*100)}%)`);
    console.log(`   ❌ With cross: ${stats.withCross}/${awardFiles.length} (${Math.round(stats.withCross/awardFiles.length*100)}%)`);
    console.log(`   👤 With exhibitor: ${stats.withExhibitor}/${awardFiles.length} (${Math.round(stats.withExhibitor/awardFiles.length*100)}%)`);
    console.log(`   📏 With measurements: ${stats.withMeasurements}/${awardFiles.length} (${Math.round(stats.withMeasurements/awardFiles.length*100)}%)`);
    console.log(`   📝 With description: ${stats.withDescription}/${awardFiles.length} (${Math.round(stats.withDescription/awardFiles.length*100)}%)`);
    console.log(`   🎯 Valid awards: ${stats.validAwards}/${awardFiles.length} (${Math.round(stats.validAwards/awardFiles.length*100)}%)`);

    console.log('\n📋 Sample Extracted Data:');
    sampleData.forEach(sample => {
        console.log(`   📄 ${sample.file}:`);
        console.log(`      🏆 Award: ${sample.award} ${sample.points || 'N/A'}`);
        console.log(`      🌿 Plant: ${sample.genus} ${sample.species} '${sample.clone}'`);
        console.log(`      👤 Exhibitor: ${sample.exhibitor}`);
    });

    console.log('\n✅ Validation complete!');
    
    return {
        totalFiles: awardFiles.length,
        statistics: stats,
        qualityScore: Math.round((stats.validGenusNames + stats.validAwards + stats.withDescription) / (awardFiles.length * 3) * 100)
    };
}

validateFixedExtraction().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});