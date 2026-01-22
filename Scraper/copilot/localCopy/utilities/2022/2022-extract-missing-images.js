/**
 * 2022 Extract Missing Images from Local HTML Files
 * Extract images for specific awards identified as missing from the image check report
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Paths
const reportPath = path.join(__dirname, 'reports/2022-image-check-report.json');
const jsonDataPath = path.join(__dirname, '../../paccentraljc.org/awards/2022/data/json');
const htmlDataPath = path.join(__dirname, '../../paccentraljc.org/awards/2022/html');
const imagesPath = path.join(__dirname, '../../paccentraljc.org/awards/2022/images');

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
 * Extract image URL from HTML content
 * @param {string} htmlContent - The HTML content to parse
 * @param {string} awardNum - Award number to look for
 * @returns {string|null} - Image URL if found, null otherwise
 */
function extractImageUrlFromHtml(htmlContent, awardNum) {
    // Look for image tags with the award number
    const imgRegex = new RegExp(`<img[^>]*src\\s*=\\s*["']([^"']*${awardNum}\\.(jpg|jpeg|png|gif))[^"']*["'][^>]*>`, 'i');
    const match = htmlContent.match(imgRegex);
    
    if (match) {
        return match[1];
    }
    
    // Alternative: look for direct image references
    const directRegex = new RegExp(`(${awardNum}\\.(jpg|jpeg|png|gif))`, 'i');
    const directMatch = htmlContent.match(directRegex);
    
    if (directMatch) {
        return directMatch[1];
    }
    
    return null;
}

/**
 * Construct full image URL from relative path and source URL
 * @param {string} imagePath - Relative or absolute image path from HTML
 * @param {string} sourceUrl - Source URL of the HTML page
 * @returns {string} - Full image URL
 */
function constructFullImageUrl(imagePath, sourceUrl) {
    if (imagePath.startsWith('http')) {
        return imagePath; // Already a full URL
    }
    
    const url = new URL(sourceUrl);
    
    if (imagePath.startsWith('/')) {
        return `${url.protocol}//${url.hostname}${imagePath}`;
    }
    
    // Relative path - construct based on HTML page directory
    const pathParts = url.pathname.split('/');
    pathParts.pop(); // Remove HTML filename
    pathParts.push(imagePath);
    
    return `${url.protocol}//${url.hostname}${pathParts.join('/')}`;
}

/**
 * Main function to extract missing images
 */
async function extractMissingImages() {
    console.log('📸 2022 EXTRACT MISSING IMAGES FROM LOCAL HTML');
    console.log('=' .repeat(60));
    
    // Read the image check report
    if (!fs.existsSync(reportPath)) {
        console.error(`❌ Report not found: ${reportPath}`);
        console.log('Please run 2022-check-images.js first to generate the report.');
        return;
    }

    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const missingImages = reportData.errors.filter(error => error.issue === 'Image file not found');

    if (missingImages.length === 0) {
        console.log('🎉 No missing images found in report!');
        return;
    }

    console.log(`📊 Found ${missingImages.length} missing images from report:`);
    missingImages.forEach(img => console.log(`   - ${img.awardNum}.jpg`));
    
    // Ensure images directory exists
    if (!fs.existsSync(imagesPath)) {
        fs.mkdirSync(imagesPath, { recursive: true });
        console.log(`📁 Created images directory: ${imagesPath}`);
    }

    console.log(`\\n📥 Starting image extraction...\\n`);

    const results = {
        totalMissing: missingImages.length,
        downloaded: 0,
        failed: 0,
        errors: []
    };

    for (const [index, missingImage] of missingImages.entries()) {
        try {
            console.log(`📸 [${index + 1}/${missingImages.length}] Processing ${missingImage.awardNum}...`);
            
            // Get JSON data for source URL
            const jsonFilePath = path.join(jsonDataPath, missingImage.file);
            const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
            
            if (!jsonData.sourceUrl) {
                throw new Error('No source URL found in JSON');
            }
            
            // Check if we have the HTML file locally
            const htmlFilePath = path.join(htmlDataPath, `${missingImage.awardNum}.html`);
            
            if (fs.existsSync(htmlFilePath)) {
                console.log(`   📄 Found local HTML file`);
                const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
                const relativeImagePath = extractImageUrlFromHtml(htmlContent, missingImage.awardNum);
                
                if (relativeImagePath) {
                    const fullImageUrl = constructFullImageUrl(relativeImagePath, jsonData.sourceUrl);
                    console.log(`   🔗 Found image URL: ${fullImageUrl}`);
                    
                    const localImagePath = path.join(imagesPath, `${missingImage.awardNum}.jpg`);
                    const result = await downloadImage(fullImageUrl, localImagePath);
                    
                    console.log(`   ✅ Downloaded successfully (${result.status})`);
                    results.downloaded++;
                } else {
                    throw new Error('Image reference not found in local HTML');
                }
            } else {
                // Fallback: construct image URL from source URL
                console.log(`   📄 No local HTML, using source URL pattern`);
                const sourceUrl = new URL(jsonData.sourceUrl);
                const pathParts = sourceUrl.pathname.split('/');
                pathParts[pathParts.length - 1] = `${missingImage.awardNum}.jpg`;
                
                const imageUrl = `${sourceUrl.protocol}//${sourceUrl.hostname}${pathParts.join('/')}`;
                console.log(`   🔗 Constructed image URL: ${imageUrl}`);
                
                const localImagePath = path.join(imagesPath, `${missingImage.awardNum}.jpg`);
                const result = await downloadImage(imageUrl, localImagePath);
                
                console.log(`   ✅ Downloaded successfully (${result.status})`);
                results.downloaded++;
            }
            
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            results.failed++;
            results.errors.push({
                awardNum: missingImage.awardNum,
                error: error.message
            });
        }
        
        // Rate limiting: 2000ms delay between downloads
        if (index < missingImages.length - 1) {
            console.log('   ⏳ Waiting 2 seconds...');
            await delay(2000);
        }
    }

    // Print summary
    console.log('\\n' + '=' .repeat(80));
    console.log('📊 2022 MISSING IMAGE EXTRACTION SUMMARY');
    console.log('=' .repeat(80));
    console.log(`📈 EXTRACTION STATS:`);
    console.log(`   Total missing images: ${results.totalMissing}`);
    console.log(`   Successfully downloaded: ${results.downloaded}`);
    console.log(`   Failed downloads: ${results.failed}`);
    
    if (results.totalMissing > 0) {
        const successRate = ((results.downloaded / results.totalMissing) * 100).toFixed(1);
        console.log(`   Success rate: ${successRate}%`);
    }

    if (results.errors.length > 0) {
        console.log(`\\n⚠️  EXTRACTION ERRORS:`);
        results.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.awardNum}: ${error.error}`);
        });
    }

    // Save results
    const extractionReportPath = path.join(__dirname, 'reports/2022-image-extraction-report.json');
    fs.writeFileSync(extractionReportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalMissingImages: results.totalMissing,
            downloadedImages: results.downloaded,
            failedDownloads: results.failed,
            successRate: results.totalMissing > 0 ? ((results.downloaded / results.totalMissing) * 100).toFixed(1) + '%' : 'N/A'
        },
        errors: results.errors
    }, null, 2));

    console.log(`\\n📊 Extraction report saved: ${extractionReportPath}`);
    
    if (results.failed === 0) {
        console.log('\\n🎉 ALL MISSING IMAGES EXTRACTED SUCCESSFULLY!');
    } else {
        console.log(`\\n⚠️  ${results.failed} extractions failed. Check report for details.`);
    }
}

// Run the extraction if this script is executed directly
if (require.main === module) {
    extractMissingImages().catch(console.error);
}

module.exports = { extractMissingImages };