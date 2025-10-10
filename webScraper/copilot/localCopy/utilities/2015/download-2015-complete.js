const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Configuration
const BASE_URL = 'https://www.paccentraljc.org';
const INDEX_URL = 'https://www.paccentraljc.org/2015.html';
const BASE_DIR = path.join(__dirname, '../../paccentraljc.org/awards/2015');
const HTML_DIR = path.join(BASE_DIR, 'html');
const DATA_DIR = path.join(BASE_DIR, 'data');

console.log('🌐 Starting 2015 Awards Download Process...\n');

// Ensure directories exist
function ensureDirectories() {
    const dirs = [BASE_DIR, HTML_DIR, DATA_DIR];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });
}

// Download a file from URL
function downloadFile(url, filePath) {
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
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    fs.writeFileSync(filePath, data, 'utf8');
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                }
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

// Extract award links from the index page
function extractAwardLinks(htmlContent) {
    const links = [];
    
    // Look for links that match 2015 award patterns
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    let match;
    
    while ((match = linkRegex.exec(htmlContent)) !== null) {
        const href = match[1];
        
        // Match 2015 award number patterns (20154XXX)
        if (href.match(/20154\d{3}\.html$/)) {
            links.push({
                href: href,
                url: href.startsWith('http') ? href : `${BASE_URL}/${href}`,
                filename: href.split('/').pop()
            });
        }
        
        // Also look for date-based links that might contain awards
        if (href.match(/2015\d{4}\.html$/)) {
            links.push({
                href: href,
                url: href.startsWith('http') ? href : `${BASE_URL}/${href}`,
                filename: href.split('/').pop()
            });
        }
    }
    
    // Remove duplicates
    const uniqueLinks = links.filter((link, index, arr) => 
        arr.findIndex(l => l.filename === link.filename) === index
    );
    
    return uniqueLinks;
}

// Sleep function for rate limiting
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main download process
async function downloadAwards() {
    try {
        ensureDirectories();
        
        console.log('📄 Step 1: Downloading 2015 index page...');
        const indexPath = path.join(HTML_DIR, '2015-index.html');
        
        const indexContent = await downloadFile(INDEX_URL, indexPath);
        console.log(`✅ Downloaded: 2015-index.html`);
        
        console.log('\n🔍 Step 2: Extracting award links from index page...');
        const awardLinks = extractAwardLinks(indexContent);
        
        console.log(`📊 Found ${awardLinks.length} potential award links:`);
        awardLinks.forEach(link => {
            console.log(`   📎 ${link.filename} -> ${link.url}`);
        });
        
        if (awardLinks.length === 0) {
            console.log('⚠️  No award links found. Let me try parsing the HTML content differently...');
            
            // Log some content for debugging
            console.log('\n📝 Sample HTML content:');
            console.log(indexContent.substring(0, 500) + '...');
            
            // Try alternative parsing
            const allLinks = [];
            const altRegex = /href=["']([^"']*(?:2015|award)[^"']*)["']/gi;
            let altMatch;
            
            while ((altMatch = altRegex.exec(indexContent)) !== null) {
                allLinks.push(altMatch[1]);
            }
            
            console.log(`\n🔍 Alternative parsing found ${allLinks.length} links with "2015" or "award":`);
            allLinks.slice(0, 10).forEach(link => console.log(`   📎 ${link}`));
            
            return;
        }
        
        console.log('\n⬇️  Step 3: Downloading individual award files...');
        let downloadCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < awardLinks.length; i++) {
            const link = awardLinks[i];
            const filePath = path.join(HTML_DIR, link.filename);
            
            try {
                // Skip if file already exists
                if (fs.existsSync(filePath)) {
                    console.log(`   ⚠️  ${link.filename}: Already exists, skipping`);
                    continue;
                }
                
                console.log(`   ⬇️  ${link.filename} (${i + 1}/${awardLinks.length})`);
                
                await downloadFile(link.url, filePath);
                downloadCount++;
                
                console.log(`   ✅ ${link.filename}: Downloaded successfully`);
                
                // Rate limiting - wait between downloads
                if (i < awardLinks.length - 1) {
                    await sleep(1000); // 1 second between downloads
                }
                
            } catch (error) {
                console.log(`   ❌ ${link.filename}: Error - ${error.message}`);
                errorCount++;
                
                // Continue with other downloads even if one fails
                continue;
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 DOWNLOAD SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`\n🎯 RESULTS:`);
        console.log(`   Total links found: ${awardLinks.length}`);
        console.log(`   Successfully downloaded: ${downloadCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`   Success rate: ${((downloadCount / awardLinks.length) * 100).toFixed(1)}%`);
        
        if (downloadCount > 0) {
            console.log(`\n📁 Files saved to: ${HTML_DIR}`);
            console.log(`\n✅ 2015 download complete! You can now run the analysis script.`);
        } else {
            console.log(`\n⚠️  No files were downloaded. Please check the URL and try again.`);
        }
        
    } catch (error) {
        console.error('❌ Error in download process:', error.message);
        process.exit(1);
    }
}

// Run the download process
downloadAwards();