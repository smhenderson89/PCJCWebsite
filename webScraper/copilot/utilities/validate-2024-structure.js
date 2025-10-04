const fs = require('fs-extra');
const path = require('path');

class FolderStructureValidator2024 {
    constructor() {
        this.baseDir = path.join(__dirname, '..');
        this.year = '2024';
        this.awardsDir = path.join(this.baseDir, 'localCopy', 'paccentraljc.org', 'awards', this.year);
        
        this.folders = {
            html: path.join(this.awardsDir, 'html'),
            images: path.join(this.awardsDir, 'images'),
            thumbnails: path.join(this.awardsDir, 'images', 'thumbnail'),
            json: path.join(this.baseDir, 'savedData', this.year, 'json')
        };
    }

    async validateStructure() {
        console.log('🔍 Validating 2024 Folder Structure\n');
        
        const results = {
            folders: {},
            summary: {},
            recommendations: []
        };
        
        // Check each folder
        for (const [folderName, folderPath] of Object.entries(this.folders)) {
            const info = await this.analyzeFolder(folderName, folderPath);
            results.folders[folderName] = info;
        }
        
        // Generate summary
        results.summary = this.generateSummary(results.folders);
        
        // Generate recommendations
        results.recommendations = this.generateRecommendations(results.folders);
        
        // Display results
        this.displayResults(results);
        
        return results;
    }

    async analyzeFolder(folderName, folderPath) {
        const info = {
            name: folderName,
            path: folderPath,
            exists: false,
            fileCount: 0,
            files: [],
            fileTypes: {}
        };
        
        try {
            if (await fs.pathExists(folderPath)) {
                info.exists = true;
                const files = await fs.readdir(folderPath);
                info.fileCount = files.length;
                info.files = files.sort();
                
                // Analyze file types
                files.forEach(file => {
                    const ext = path.extname(file).toLowerCase();
                    if (!info.fileTypes[ext]) {
                        info.fileTypes[ext] = 0;
                    }
                    info.fileTypes[ext]++;
                });
                
                console.log(`✅ ${folderName}: ${info.fileCount} files`);
            } else {
                console.log(`❌ ${folderName}: Folder not found`);
            }
        } catch (error) {
            info.error = error.message;
            console.log(`⚠️  ${folderName}: Error - ${error.message}`);
        }
        
        return info;
    }

    generateSummary(folders) {
        const summary = {
            totalHtmlFiles: folders.html?.fileCount || 0,
            totalImages: folders.images?.fileTypes['.jpg'] || 0,
            totalThumbnails: folders.thumbnails?.fileCount || 0,
            totalJsonFiles: folders.json?.fileTypes['.json'] || 0,
            
            structure: {
                htmlOrganized: folders.html?.exists || false,
                imagesOrganized: folders.images?.exists || false,
                thumbnailsOrganized: folders.thumbnails?.exists || false,
                jsonExists: folders.json?.exists || false
            }
        };
        
        return summary;
    }

    generateRecommendations(folders) {
        const recommendations = [];
        
        // Check for any files that might be in wrong locations
        if (folders.html?.exists) {
            const nonHtmlFiles = folders.html.files.filter(f => !f.endsWith('.html') && !f.startsWith('.'));
            if (nonHtmlFiles.length > 0) {
                recommendations.push({
                    type: 'cleanup',
                    message: `HTML folder contains ${nonHtmlFiles.length} non-HTML files`,
                    files: nonHtmlFiles.slice(0, 5)
                });
            }
        }
        
        if (folders.images?.exists) {
            const thumbnailFiles = folders.images.files.filter(f => f.includes('thumb'));
            if (thumbnailFiles.length > 0) {
                recommendations.push({
                    type: 'move',
                    message: `${thumbnailFiles.length} thumbnail files still in images folder (should be in thumbnails/)`,
                    action: 'Move to thumbnails folder'
                });
            }
        }
        
        // Check if we have corresponding files
        if (folders.html?.exists && folders.images?.exists) {
            const htmlAwards = folders.html.files
                .filter(f => f.match(/^20245\d{3}\.html$/))
                .map(f => f.replace('.html', ''));
            
            const imageAwards = folders.images.files
                .filter(f => f.match(/^20245\d{3}\.jpg$/))
                .map(f => f.replace('.jpg', ''));
            
            const missingImages = htmlAwards.filter(award => !imageAwards.includes(award));
            const extraImages = imageAwards.filter(award => !htmlAwards.includes(award));
            
            if (missingImages.length > 0) {
                recommendations.push({
                    type: 'warning',
                    message: `${missingImages.length} awards have HTML but no images`,
                    items: missingImages.slice(0, 5)
                });
            }
            
            if (extraImages.length > 0) {
                recommendations.push({
                    type: 'info',
                    message: `${extraImages.length} images have no corresponding HTML`,
                    items: extraImages.slice(0, 5)
                });
            }
        }
        
        return recommendations;
    }

    displayResults(results) {
        console.log('\n📊 2024 FOLDER STRUCTURE VALIDATION');
        console.log('====================================');
        
        console.log('\n📁 FOLDER SUMMARY:');
        console.log(`├── html/: ${results.summary.totalHtmlFiles} files`);
        console.log(`├── images/: ${results.summary.totalImages} files`);
        console.log(`├── images/thumbnail/: ${results.summary.totalThumbnails} files`);
        console.log(`└── savedData/2024/json/: ${results.summary.totalJsonFiles} files`);
        
        console.log('\n✅ ORGANIZATION STATUS:');
        console.log(`📄 HTML files organized: ${results.summary.structure.htmlOrganized ? '✅' : '❌'}`);
        console.log(`🖼️  Images organized: ${results.summary.structure.imagesOrganized ? '✅' : '❌'}`);
        console.log(`🖼️  Thumbnails organized: ${results.summary.structure.thumbnailsOrganized ? '✅' : '❌'}`);
        console.log(`📋 JSON files exist: ${results.summary.structure.jsonExists ? '✅' : '❌'}`);
        
        if (results.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            results.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. [${rec.type.toUpperCase()}] ${rec.message}`);
                if (rec.files) {
                    console.log(`   Files: ${rec.files.join(', ')}`);
                }
                if (rec.items) {
                    console.log(`   Items: ${rec.items.join(', ')}`);
                }
                if (rec.action) {
                    console.log(`   Action: ${rec.action}`);
                }
            });
        } else {
            console.log('\n🎉 Perfect organization! No recommendations needed.');
        }
        
        console.log('\n📈 FOLDER STRUCTURE HEALTH: ' + 
            (results.recommendations.filter(r => r.type === 'warning').length === 0 ? '✅ Excellent' : '⚠️  Needs attention'));
    }
}

async function validateStructure() {
    console.log('🚀 Starting 2024 Folder Structure Validation\n');
    
    try {
        const validator = new FolderStructureValidator2024();
        const results = await validator.validateStructure();
        
        console.log('\n✨ Validation complete!');
        return results;
        
    } catch (error) {
        console.error('❌ Error during validation:', error);
    }
}

if (require.main === module) {
    validateStructure().catch(console.error);
}

module.exports = { validateStructure };