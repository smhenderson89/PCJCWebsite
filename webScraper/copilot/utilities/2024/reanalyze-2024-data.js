const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

const BASE_DIR = path.join(__dirname, '..');
const HTML_DIR = path.join(BASE_DIR, 'localCopy/paccentraljc.org/awards/2024/html');
const JSON_DIR = path.join(BASE_DIR, 'savedData/2024/json');

// Enhanced extraction functions
function extractGenusSpecies(title, contentText) {
    console.log(`   🔍 Analyzing title: "${title}"`);
    console.log(`   🔍 Content preview: "${contentText.substring(0, 200)}..."`);
    
    // Remove common prefixes and clean the title
    let cleanTitle = title
        .replace(/^\s*\w+\s+\d{1,2},?\s+\d{4}\s*-\s*/, '') // Remove date prefix
        .replace(/Award\s+\d+/i, '') // Remove award number
        .trim();
    
    console.log(`   🧹 Clean title: "${cleanTitle}"`);
    
    // Pattern 1: Standard format "Genus species 'Clone'"
    let match = cleanTitle.match(/^([A-Z][a-z]+)\s+([a-z]+(?:\s+[a-z]+)?)\s+['"]([^'"]+)['"]?/i);
    if (match) {
        console.log(`   ✅ Pattern 1 match: Genus="${match[1]}", Species="${match[2]}", Clone="${match[3]}"`);
        return { genus: match[1], species: match[2] };
    }
    
    // Pattern 2: Hybrid format "Genus Hybrid 'Clone'"
    match = cleanTitle.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+['"]([^'"]+)['"]?/);
    if (match) {
        console.log(`   ✅ Pattern 2 match: Genus="${match[1]}", Species="${match[2]}", Clone="${match[3]}"`);
        return { genus: match[1], species: match[2] };
    }
    
    // Pattern 3: Species only "Genus species"
    match = cleanTitle.match(/^([A-Z][a-z]+)\s+([a-z]+)/i);
    if (match) {
        console.log(`   ✅ Pattern 3 match: Genus="${match[1]}", Species="${match[2]}"`);
        return { genus: match[1], species: match[2] };
    }
    
    // Pattern 4: Check content for genus/species info
    const genusMatch = contentText.match(/([A-Z][a-z]+)\s+([a-z]+(?:\s+[a-z]+)?)\s+['"]([^'"]+)['"]?/);
    if (genusMatch) {
        console.log(`   ✅ Content pattern match: Genus="${genusMatch[1]}", Species="${genusMatch[2]}"`);
        return { genus: genusMatch[1], species: genusMatch[2] };
    }
    
    console.log(`   ❌ No genus/species pattern found`);
    return { genus: null, species: null };
}

function extractAwardInfo(contentText) {
    console.log(`   🏆 Extracting award info from content...`);
    
    // Look for award patterns: HCC 78, CCM 84, AM 82, etc.
    const awardPatterns = [
        /\b(HCC|CCM|AM|FCC|JC|CBR|CHM|PC)\s+(\d+)\b/i,
        /\b(Certificate\s+of\s+Cultural\s+Merit)\s+(\d+)\b/i,
        /\b(Highly\s+Commended\s+Certificate)\s+(\d+)\b/i
    ];
    
    for (const pattern of awardPatterns) {
        const match = contentText.match(pattern);
        if (match) {
            let award = match[1].toUpperCase();
            const points = parseInt(match[2]);
            
            // Normalize award names
            if (award.includes('CERTIFICATE') && award.includes('CULTURAL')) award = 'CCM';
            if (award.includes('HIGHLY') && award.includes('COMMENDED')) award = 'HCC';
            
            console.log(`   ✅ Found award: ${award} ${points}`);
            return { award, awardpoints: points };
        }
    }
    
    console.log(`   ❌ No award pattern found`);
    return { award: null, awardpoints: null };
}

async function reanalyzeJsonFile(filename) {
    const jsonPath = path.join(JSON_DIR, filename);
    const awardNum = filename.replace('.json', '');
    const htmlPath = path.join(HTML_DIR, `${awardNum}.html`);
    
    console.log(`\n📄 Processing: ${filename}`);
    
    try {
        // Read existing JSON
        const jsonData = await fs.readJson(jsonPath);
        let updated = false;
        
        // Check if we need to update this file
        const needsUpdate = 
            jsonData.genus === null || 
            jsonData.species === null || 
            jsonData.award === null || 
            jsonData.awardpoints === null;
        
        if (!needsUpdate) {
            console.log(`   ✅ Already complete - skipping`);
            return { updated: false, details: 'Already complete' };
        }
        
        // Read and parse HTML
        const htmlContent = await fs.readFile(htmlPath, 'utf8');
        const $ = cheerio.load(htmlContent);
        
        // Extract title and text content
        const title = $('title').text().trim();
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        
        console.log(`   📖 Title: "${title}"`);
        
        // Update genus/species if missing
        if (jsonData.genus === null || jsonData.species === null) {
            const { genus, species } = extractGenusSpecies(title, bodyText);
            if (genus && species) {
                jsonData.genus = genus;
                jsonData.species = species;
                updated = true;
                console.log(`   ✅ Updated genus/species: ${genus} ${species}`);
            }
        }
        
        // Update award info if missing
        if (jsonData.award === null || jsonData.awardpoints === null) {
            const { award, awardpoints } = extractAwardInfo(bodyText);
            if (award && awardpoints) {
                jsonData.award = award;
                jsonData.awardpoints = awardpoints;
                updated = true;
                console.log(`   ✅ Updated award: ${award} ${awardpoints}`);
            }
        }
        
        // Save if updated
        if (updated) {
            jsonData.scrapedDate = new Date().toISOString();
            await fs.writeJson(jsonPath, jsonData, { spaces: 2 });
            console.log(`   💾 Saved updates to ${filename}`);
            return { 
                updated: true, 
                details: `Updated: ${jsonData.genus ? 'genus/species' : ''} ${jsonData.award ? 'award' : ''}`.trim()
            };
        } else {
            console.log(`   ❌ No updates found`);
            return { updated: false, details: 'No extractable data found' };
        }
        
    } catch (error) {
        console.error(`   ❌ Error processing ${filename}:`, error.message);
        return { updated: false, details: `Error: ${error.message}` };
    }
}

async function main() {
    console.log('🔄 Starting 2024 JSON Re-analysis Process\n');
    console.log('📋 This will:');
    console.log('   • Re-examine HTML files for missing genus/species');
    console.log('   • Extract missing award types and points');
    console.log('   • Update JSON files with found data');
    console.log('   • Generate detailed analysis report\n');
    
    try {
        // Get all JSON files
        const jsonFiles = (await fs.readdir(JSON_DIR))
            .filter(file => file.endsWith('.json'))
            .sort();
        
        console.log(`📊 Found ${jsonFiles.length} JSON files to analyze\n`);
        
        const results = {
            processed: 0,
            updated: 0,
            errors: 0,
            details: []
        };
        
        // Process each file
        for (const filename of jsonFiles) {
            const result = await reanalyzeJsonFile(filename);
            results.processed++;
            
            if (result.updated) {
                results.updated++;
            } else if (result.details.startsWith('Error:')) {
                results.errors++;
            }
            
            results.details.push({
                file: filename,
                ...result
            });
        }
        
        // Generate final report
        console.log('\n📊 RE-ANALYSIS COMPLETE!');
        console.log('==========================');
        console.log(`📄 Total files processed: ${results.processed}`);
        console.log(`✅ Files updated: ${results.updated}`);
        console.log(`❌ Errors: ${results.errors}`);
        
        // Show updated files
        const updatedFiles = results.details.filter(r => r.updated);
        if (updatedFiles.length > 0) {
            console.log('\n✅ UPDATED FILES:');
            updatedFiles.forEach(file => {
                console.log(`   📄 ${file.file}: ${file.details}`);
            });
        }
        
        // Show files with errors
        const errorFiles = results.details.filter(r => r.details.startsWith('Error:'));
        if (errorFiles.length > 0) {
            console.log('\n❌ FILES WITH ERRORS:');
            errorFiles.forEach(file => {
                console.log(`   📄 ${file.file}: ${file.details}`);
            });
        }
        
        // Show summary of remaining issues
        console.log('\n🔍 FINAL VALIDATION:');
        const remainingIssues = await validateAllFiles();
        if (remainingIssues.length === 0) {
            console.log('   🎉 All files now have complete data!');
        } else {
            console.log(`   ⚠️  ${remainingIssues.length} files still have missing data:`);
            remainingIssues.forEach(issue => {
                console.log(`   📄 ${issue.file}: Missing ${issue.missing.join(', ')}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

async function validateAllFiles() {
    const jsonFiles = (await fs.readdir(JSON_DIR))
        .filter(file => file.endsWith('.json'));
    
    const issues = [];
    
    for (const filename of jsonFiles) {
        const jsonPath = path.join(JSON_DIR, filename);
        const data = await fs.readJson(jsonPath);
        
        const missing = [];
        if (data.genus === null) missing.push('genus');
        if (data.species === null) missing.push('species');
        if (data.award === null) missing.push('award');
        if (data.awardpoints === null) missing.push('awardpoints');
        
        if (missing.length > 0) {
            issues.push({ file: filename, missing });
        }
    }
    
    return issues;
}

// Run the analysis
main().catch(console.error);