/**
 * 2019 Image Download Script
 * Download missing images for 2019 awards from their source URLs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Paths
const jsonDataPath = path.join(__dirname, '../../paccentraljc.org/awards/2019/data/json');
const imagesPath = path.join(__dirname, '../../paccentraljc.org/awards/2019/images');

/**
 * Delay function for rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Resolves after delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Download an image from URL to file path
 * @param {string} url - Image URL to download
 * @param {string} filePath - Local file path to save image
 * @returns {Promise} - Resolves when download complete
 */
function downloadImage(url, filePath) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; OrchidImageDownloader/1.0)',
                'Accept': 'image/*',
                'Connection': 'close'
            },
            timeout: 30000 // 30 second timeout
        };
        
        const req = client.request(options, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const fileStream = fs.createWriteStream(filePath);
                res.pipe(fileStream);
                
                fileStream.on('finish', () => {
                    resolve({ success: true, status: res.statusCode });
                });
                
                fileStream.on('error', (error) => {
                    // Clean up partial file
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    reject(error);
                });
            } else {
                reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            }
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

/**
 * Extract image URL from source URL
 * @param {string} sourceUrl - The award's source URL
 * @param {string} awardNum - Award number for constructing image URL
 * @returns {string} - Expected image URL
 */
function constructImageUrl(sourceUrl, awardNum) {
    // Extract the directory part from source URL
    // e.g., https://www.paccentraljc.org/20191116/20194887.html
    // becomes https://www.paccentraljc.org/20191116/20194887.jpg
    const url = new URL(sourceUrl);
    const pathParts = url.pathname.split('/');
    pathParts[pathParts.length - 1] = `${awardNum}.jpg`;
    
    return `${url.protocol}//${url.hostname}${pathParts.join('/')}`;
}

/**
 * Main image downloading function
 */
async function downloadMissingImages() {
    console.log('📸 2019 MISSING IMAGE DOWNLOAD');
    console.log('=' .repeat(60));
    
    if (!fs.existsSync(jsonDataPath)) {
        console.error(`❌ JSON directory not found: ${jsonDataPath}`);
        return;
    }

    // Ensure images directory exists
    if (!fs.existsSync(imagesPath)) {
        fs.mkdirSync(imagesPath, { recursive: true });
        console.log(`📁 Created images directory: ${imagesPath}`);
    }

    const jsonFiles = fs.readdirSync(jsonDataPath)
        .filter(file => file.endsWith('.json'))
        .sort();

    if (jsonFiles.length === 0) {
        console.error('❌ No JSON files found');
        return;
    }

    console.log(`📋 Found ${jsonFiles.length} JSON files to check for missing images\\n`);

    const results = {
        totalFiles: jsonFiles.length,
        missingImages: [],
        downloadedImages: 0,
        failedDownloads: 0,
        alreadyExists: 0,
        errors: []
    };

    // First, identify missing images
    for (const file of jsonFiles) {
        const filePath = path.join(jsonDataPath, file);
        
        try {
            const jsonContent = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(jsonContent);
            
            if (!data.awardNum || !data.sourceUrl) {
                continue;
            }
            
            const expectedImageName = `${data.awardNum}.jpg`;
            const localImagePath = path.join(imagesPath, expectedImageName);
            
            if (!fs.existsSync(localImagePath)) {
                results.missingImages.push({
                    awardNum: data.awardNum,
                    file: file,
                    sourceUrl: data.sourceUrl,
                    expectedImageName: expectedImageName,
                    localPath: localImagePath
                });
            } else {
                results.alreadyExists++;
            }
            
        } catch (error) {
            results.errors.push({
                file: file,
                error: `Parse error: ${error.message}`
            });
        }
    }

    console.log(`📊 Analysis complete:`);
    console.log(`   Total awards: ${results.totalFiles}`);
    console.log(`   Already have images: ${results.alreadyExists}`);
    console.log(`   Missing images: ${results.missingImages.length}`);
    console.log(`   Parse errors: ${results.errors.length}\\n`);

    if (results.missingImages.length === 0) {
        console.log('🎉 No missing images found!');
        return;
    }

    console.log(`📥 Starting download of ${results.missingImages.length} missing images...\\n`);

    // Download missing images
    for (const [index, imageInfo] of results.missingImages.entries()) {
        try {
            console.log(`📸 [${index + 1}/${results.missingImages.length}] Downloading ${imageInfo.awardNum}...`);
            
            const imageUrl = constructImageUrl(imageInfo.sourceUrl, imageInfo.awardNum);
            console.log(`   URL: ${imageUrl}`);
            
            const result = await downloadImage(imageUrl, imageInfo.localPath);
            
            if (result.success) {
                console.log(`   ✅ Downloaded successfully (${result.status})`);
                results.downloadedImages++;
            }
            
        } catch (error) {
            console.log(`   ❌ Download failed: ${error.message}`);
            results.failedDownloads++;
            results.errors.push({
                awardNum: imageInfo.awardNum,
                file: imageInfo.file,
                error: `Download failed: ${error.message}`,
                imageUrl: constructImageUrl(imageInfo.sourceUrl, imageInfo.awardNum)
            });
        }
        
        // Rate limiting: 2000ms delay between downloads
        if (index < results.missingImages.length - 1) {
            console.log('   ⏳ Waiting 2 seconds...');
            await delay(2000);
        }
    }

    // Print summary
    console.log('\\n' + '=' .repeat(80));
    console.log('📊 2019 IMAGE DOWNLOAD SUMMARY');
    console.log('=' .repeat(80));
    console.log(`📈 DOWNLOAD STATS:`);
    console.log(`   Total missing images: ${results.missingImages.length}`);
    console.log(`   Successfully downloaded: ${results.downloadedImages}`);
    console.log(`   Failed downloads: ${results.failedDownloads}`);
    console.log(`   Already existed: ${results.alreadyExists}`);
    console.log(`   Errors: ${results.errors.length}`);
    
    if (results.missingImages.length > 0) {
        const downloadSuccessRate = ((results.downloadedImages / results.missingImages.length) * 100).toFixed(1);
        console.log(`   Download success rate: ${downloadSuccessRate}%`);
    }

    if (results.errors.length > 0) {
        console.log(`\\n⚠️  DOWNLOAD ERRORS:`);
        results.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.file || error.awardNum}: ${error.error}`);
            if (error.imageUrl) {
                console.log(`      URL: ${error.imageUrl}`);
            }
        });
    }

    // Save detailed report
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportPath = path.join(reportsDir, '2019-image-download-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalFiles: results.totalFiles,
            totalMissingImages: results.missingImages.length,
            downloadedImages: results.downloadedImages,
            failedDownloads: results.failedDownloads,
            alreadyExisted: results.alreadyExists,
            downloadSuccessRate: results.missingImages.length > 0 ? ((results.downloadedImages / results.missingImages.length) * 100).toFixed(1) + '%' : 'N/A'
        },
        errors: results.errors
    }, null, 2));

    console.log(`\\n📊 Detailed report saved: ${reportPath}`);
    
    if (results.failedDownloads === 0) {
        console.log('\\n🎉 ALL MISSING IMAGES DOWNLOADED SUCCESSFULLY!');
    } else {
        console.log(`\\n⚠️  ${results.failedDownloads} downloads failed. Check report for details.`);
    }
}

// Run the image download if this script is executed directly
if (require.main === module) {
    downloadMissingImages().catch(console.error);
}

module.exports = { downloadMissingImages, downloadImage };