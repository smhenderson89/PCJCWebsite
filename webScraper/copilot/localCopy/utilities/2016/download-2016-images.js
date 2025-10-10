const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Configuration
const BASE_URL = 'https://www.2016.org';
const BASE_DIR = path.join(__dirname, '../../2016.org/awards/2017');
const HTML_DIR = path.join(BASE_DIR, 'html');
const IMAGE_DIR = path.join(BASE_DIR, 'images');

console.log('📸 Starting 2017 Images Download Process...\n');

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

// Extract image links from HTML content
function extractImageLinks(htmlContent, baseUrl) {
    const images = [];
    const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    
    while ((match = imageRegex.exec(htmlContent)) !== null) {
        const src = match[1];
        
        // Filter for thumbnail and full-size images
        if (src.match(/\.(jpg|jpeg|png|gif)$/i)) {
            images.push({
                src: src,
                url: src.startsWith('http') ? src : `${baseUrl}/${src}`,
                filename: src.split('/').pop()
            });
        }
    }
    
    return images;
}

// Sleep function for rate limiting
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main image download process
async function downloadImages() {
    try {
        ensureDirectories();
        
        console.log('🔍 Step 1: Scanning HTML files for images...');
        
        const htmlFiles = fs.readdirSync(HTML_DIR).filter(file => file.endsWith('.html'));
        console.log(`📄 Found ${htmlFiles.length} HTML files to scan`);
        
        const allImages = new Set(); // Use Set to avoid duplicates
        let totalImagesFound = 0;
        
        for (const htmlFile of htmlFiles) {
            const htmlPath = path.join(HTML_DIR, htmlFile);
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            
            // Determine base URL for relative image paths
            let baseUrl = BASE_URL;
            if (htmlFile.match(/2017\d{4}\.html$/)) {
                // Date directory files - images are in the same date directory  
                const dateStr = htmlFile.replace('.html', '');
                baseUrl = `${BASE_URL}/${dateStr}`;
            } else if (htmlFile.match(/20174\d{3}\.html$/)) {
                // Award files - need to determine directory from file location
                // For now, assume they're in date directories (we'll handle this dynamically)
                baseUrl = BASE_URL;
            }
            
            const images = extractImageLinks(htmlContent, baseUrl);
            
            if (images.length > 0) {
                console.log(`   📸 ${htmlFile}: Found ${images.length} images`);
                totalImagesFound += images.length;
                
                images.forEach(img => {
                    allImages.add(JSON.stringify(img)); // Use JSON string to compare objects
                });
            }
        }
        
        // Convert back to array of objects
        const uniqueImages = Array.from(allImages).map(str => JSON.parse(str));
        
        console.log(`\n📊 Total unique images found: ${uniqueImages.length}`);
        console.log(`📊 Total image references: ${totalImagesFound}`);
        
        if (uniqueImages.length === 0) {
            console.log('⚠️  No images found in HTML files');
            return;
        }
        
        console.log('\n⬇️  Step 2: Downloading images...');
        let downloadCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        for (let i = 0; i < uniqueImages.length; i++) {
            const image = uniqueImages[i];
            const imagePath = path.join(IMAGE_DIR, image.filename);
            
            try {
                // Skip if file already exists
                if (fs.existsSync(imagePath)) {
                    console.log(`   ⏭️  ${image.filename}: Already exists, skipping`);
                    skippedCount++;
                    continue;
                }
                
                console.log(`   📸 ${image.filename} (${i + 1}/${uniqueImages.length})`);
                
                await downloadBinaryFile(image.url, imagePath);
                downloadCount++;
                
                console.log(`   ✅ ${image.filename}: Downloaded successfully`);
                
                // Rate limiting - wait between downloads
                if (i < uniqueImages.length - 1) {
                    await sleep(500); // 500ms between downloads
                }
                
            } catch (error) {
                console.log(`   ❌ ${image.filename}: Error - ${error.message}`);
                errorCount++;
                
                // Continue with other downloads even if one fails
                continue;
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 IMAGE DOWNLOAD SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`\n🎯 RESULTS:`);
        console.log(`   Total images found: ${uniqueImages.length}`);
        console.log(`   Successfully downloaded: ${downloadCount}`);
        console.log(`   Already existed: ${skippedCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`   Success rate: ${(((downloadCount + skippedCount) / uniqueImages.length) * 100).toFixed(1)}%`);
        
        if (downloadCount > 0 || skippedCount > 0) {
            console.log(`\n📁 Images saved to: ${IMAGE_DIR}`);
            console.log(`\n✅ 2017 image download complete!`);
        } else {
            console.log(`\n⚠️  No images were downloaded. Please check the URLs and try again.`);
        }
        
        // Create download report
        const report = {
            downloadDate: new Date().toISOString(),
            year: 2017,
            htmlFilesScanned: htmlFiles.length,
            totalImages: uniqueImages.length,
            successful: downloadCount,
            alreadyExisted: skippedCount,
            failed: errorCount,
            successRate: (((downloadCount + skippedCount) / uniqueImages.length) * 100).toFixed(1) + '%',
            images: uniqueImages.map(img => ({
                filename: img.filename,
                url: img.url,
                downloaded: fs.existsSync(path.join(IMAGE_DIR, img.filename))
            }))
        };
        
        const reportPath = path.join(BASE_DIR, 'data', 'image-download-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📋 Image download report saved to: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ Error in image download process:', error.message);
        process.exit(1);
    }
}

// Run the image download process
downloadImages();