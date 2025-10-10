const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Configuration
const BASE_URL = 'https://www.paccentraljc.org';
const BASE_DIR = path.join(__dirname, '../../paccentraljc.org/awards/2016');
const HTML_DIR = path.join(BASE_DIR, 'html');
const IMAGE_DIR = path.join(BASE_DIR, 'images');

console.log('📸 Starting 2016 Full-Size Images Download Process...\n');

// Ensure directories exist
function ensureDirectories() {
    const dirs = [IMAGE_DIR];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });
}

// Download binary file (for images)
function downloadBinaryFile(url, filePath) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                return;
            }
            
            const fileStream = fs.createWriteStream(filePath);
            
            res.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });
            
            fileStream.on('error', (err) => {
                reject(err);
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Extract award number and determine directory from downloaded HTML files
function mapAwardToDirectory() {
    const awardToDirectory = new Map();
    
    // Read the 2016-index.html to map awards to their directories
    const indexPath = path.join(HTML_DIR, '2016-index.html');
    if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        // Look for patterns like: <A HREF="20160103/20162291.html">
        const linkRegex = /<A HREF="([^"]+\/(20162\d{3})\.html)"/gi;
        let match;
        
        while ((match = linkRegex.exec(indexContent)) !== null) {
            const fullHref = match[1];
            const awardNumber = match[2];
            const directory = fullHref.split('/')[0];
            
            awardToDirectory.set(awardNumber, directory);
        }
    }
    
    return awardToDirectory;
}

// Extract image references from individual award HTML files
function extractAwardImages() {
    const awardImages = [];
    const awardToDirectory = mapAwardToDirectory();
    
    console.log(`🗺️  Mapped ${awardToDirectory.size} awards to directories`);
    
    // Get all award HTML files (20162XXX.html pattern)
    const awardFiles = fs.readdirSync(HTML_DIR)
        .filter(file => file.match(/^20162\d{3}\.html$/));
    
    console.log(`📄 Found ${awardFiles.length} award HTML files`);
    
    for (const awardFile of awardFiles) {
        const awardNumber = awardFile.replace('.html', '');
        const awardPath = path.join(HTML_DIR, awardFile);
        const awardContent = fs.readFileSync(awardPath, 'utf8');
        
        // Look for image references like: <IMG SRC="20162291.jpg"
        const imageRegex = /<IMG[^>]+SRC="([^"]+\.jpg)"[^>]*>/gi;
        let match;
        
        while ((match = imageRegex.exec(awardContent)) !== null) {
            const imageSrc = match[1];
            
            // Only process if it's the main award image (not thumbnails)
            if (imageSrc === `${awardNumber}.jpg`) {
                const directory = awardToDirectory.get(awardNumber);
                
                if (directory) {
                    const imageUrl = `${BASE_URL}/${directory}/${imageSrc}`;
                    
                    awardImages.push({
                        awardNumber: awardNumber,
                        filename: imageSrc,
                        directory: directory,
                        url: imageUrl,
                        localPath: path.join(IMAGE_DIR, imageSrc)
                    });
                    
                    console.log(`   📎 ${awardNumber}: ${imageSrc} -> ${directory}`);
                } else {
                    console.log(`   ⚠️  ${awardNumber}: Directory mapping not found`);
                }
            }
        }
    }
    
    return awardImages;
}

// Sleep function for rate limiting
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main image download process
async function downloadFullSizeImages() {
    try {
        ensureDirectories();
        
        console.log('🔍 Step 1: Extracting full-size image references from award HTML files...');
        const awardImages = extractAwardImages();
        
        console.log(`\n📊 Found ${awardImages.length} full-size award images to download\n`);
        
        if (awardImages.length === 0) {
            console.log('⚠️  No award images found to download');
            return;
        }
        
        console.log('⬇️  Step 2: Downloading full-size award images...');
        let downloadCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        for (let i = 0; i < awardImages.length; i++) {
            const image = awardImages[i];
            
            try {
                // Skip if file already exists
                if (fs.existsSync(image.localPath)) {
                    console.log(`   ⏭️  ${image.filename}: Already exists, skipping`);
                    skippedCount++;
                    continue;
                }
                
                console.log(`   📸 ${image.filename} from ${image.directory} (${i + 1}/${awardImages.length})`);
                
                await downloadBinaryFile(image.url, image.localPath);
                downloadCount++;
                
                console.log(`   ✅ ${image.filename}: Downloaded successfully`);
                
                // Rate limiting - wait between downloads
                if (i < awardImages.length - 1) {
                    await sleep(800); // 800ms between downloads
                }
                
            } catch (error) {
                console.log(`   ❌ ${image.filename}: Error - ${error.message}`);
                errorCount++;
                
                // Continue with other downloads even if one fails
                continue;
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 FULL-SIZE IMAGE DOWNLOAD SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`\n🎯 RESULTS:`);
        console.log(`   Total award images found: ${awardImages.length}`);
        console.log(`   Successfully downloaded: ${downloadCount}`);
        console.log(`   Already existed: ${skippedCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`   Success rate: ${(((downloadCount + skippedCount) / awardImages.length) * 100).toFixed(1)}%`);
        
        if (downloadCount > 0 || skippedCount > 0) {
            console.log(`\n📁 Images saved to: ${IMAGE_DIR}`);
            console.log(`\n✅ 2016 full-size image download complete!`);
        } else {
            console.log(`\n⚠️  No images were downloaded. Please check the URLs and try again.`);
        }
        
        // Create download report
        const report = {
            downloadDate: new Date().toISOString(),
            year: 2016,
            type: 'full-size-award-images',
            totalImages: awardImages.length,
            successful: downloadCount,
            alreadyExisted: skippedCount,
            failed: errorCount,
            successRate: (((downloadCount + skippedCount) / awardImages.length) * 100).toFixed(1) + '%',
            images: awardImages.map(img => ({
                awardNumber: img.awardNumber,
                filename: img.filename,
                directory: img.directory,
                url: img.url,
                downloaded: fs.existsSync(img.localPath)
            }))
        };
        
        const reportPath = path.join(BASE_DIR, 'data', 'fullsize-image-download-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📋 Full-size image download report saved to: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ Error in full-size image download process:', error.message);
        process.exit(1);
    }
}

// Run the full-size image download process
downloadFullSizeImages();