const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Configuration
const BASE_URL = 'https://www.paccentraljc.org';
const BASE_DIR = path.join(__dirname, '../../paccentraljc.org/awards/2016');
const HTML_DIR = path.join(BASE_DIR, 'html');
const DATA_DIR = path.join(BASE_DIR, 'data');

console.log('📅 Starting 2016 Event Day Index Pages Download Process...\n');

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

// Extract event day index page links from main 2016 index
function extractEventDayIndexLinks() {
    const indexPath = path.join(HTML_DIR, '2016-index.html');
    
    if (!fs.existsSync(indexPath)) {
        throw new Error('2016-index.html not found. Please run the main download script first.');
    }
    
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const eventDayLinks = [];
    
    // Look for patterns like: <A HREF="20160103/20160103.html">
    // This matches the YYYYMMDD/YYYYMMDD.html pattern for event day index pages
    const linkRegex = /<A HREF="(2016\d{4})\/\1\.html"[^>]*>/gi;
    let match;
    
    while ((match = linkRegex.exec(indexContent)) !== null) {
        const dateStr = match[1];
        
        eventDayLinks.push({
            dateStr: dateStr,
            sourceUrl: `${BASE_URL}/${dateStr}/${dateStr}.html`,
            targetFilename: `${dateStr}-index.html`,
            targetPath: path.join(HTML_DIR, `${dateStr}-index.html`)
        });
    }
    
    // Remove duplicates (in case the same date appears multiple times)
    const uniqueLinks = eventDayLinks.filter((link, index, arr) => 
        arr.findIndex(l => l.dateStr === link.dateStr) === index
    );
    
    return uniqueLinks;
}

// Sleep function for rate limiting
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main download process
async function downloadEventDayIndexPages() {
    try {
        console.log('🔍 Step 1: Extracting event day index page links from 2016-index.html...');
        
        const eventDayLinks = extractEventDayIndexLinks();
        
        console.log(`📊 Found ${eventDayLinks.length} event day index pages to download:\n`);
        
        eventDayLinks.forEach(link => {
            console.log(`   📅 ${link.dateStr}: ${link.sourceUrl} -> ${link.targetFilename}`);
        });
        
        if (eventDayLinks.length === 0) {
            console.log('⚠️  No event day index pages found to download');
            return;
        }
        
        console.log('\n⬇️  Step 2: Downloading event day index pages...');
        let downloadCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        for (let i = 0; i < eventDayLinks.length; i++) {
            const link = eventDayLinks[i];
            
            try {
                // Skip if file already exists
                if (fs.existsSync(link.targetPath)) {
                    console.log(`   ⏭️  ${link.targetFilename}: Already exists, skipping`);
                    skippedCount++;
                    continue;
                }
                
                console.log(`   📅 ${link.dateStr} (${i + 1}/${eventDayLinks.length})`);
                
                await downloadFile(link.sourceUrl, link.targetPath);
                downloadCount++;
                
                console.log(`   ✅ ${link.targetFilename}: Downloaded successfully`);
                
                // Rate limiting - wait between downloads
                if (i < eventDayLinks.length - 1) {
                    await sleep(1000); // 1 second between downloads
                }
                
            } catch (error) {
                console.log(`   ❌ ${link.targetFilename}: Error - ${error.message}`);
                errorCount++;
                
                // Continue with other downloads even if one fails
                continue;
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 EVENT DAY INDEX PAGES DOWNLOAD SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`\n🎯 RESULTS:`);
        console.log(`   Total event day pages found: ${eventDayLinks.length}`);
        console.log(`   Successfully downloaded: ${downloadCount}`);
        console.log(`   Already existed: ${skippedCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`   Success rate: ${(((downloadCount + skippedCount) / eventDayLinks.length) * 100).toFixed(1)}%`);
        
        if (downloadCount > 0 || skippedCount > 0) {
            console.log(`\n📁 Files saved to: ${HTML_DIR}`);
            console.log(`\n✅ 2016 event day index pages download complete!`);
        } else {
            console.log(`\n⚠️  No files were downloaded. Please check the URLs and try again.`);
        }
        
        // Create download report
        const report = {
            downloadDate: new Date().toISOString(),
            year: 2016,
            type: 'event-day-index-pages',
            totalPages: eventDayLinks.length,
            successful: downloadCount,
            alreadyExisted: skippedCount,
            failed: errorCount,
            successRate: (((downloadCount + skippedCount) / eventDayLinks.length) * 100).toFixed(1) + '%',
            pages: eventDayLinks.map(link => ({
                dateStr: link.dateStr,
                sourceUrl: link.sourceUrl,
                targetFilename: link.targetFilename,
                downloaded: fs.existsSync(link.targetPath)
            }))
        };
        
        const reportPath = path.join(DATA_DIR, 'event-day-index-download-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📋 Event day index download report saved to: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ Error in event day index download process:', error.message);
        process.exit(1);
    }
}

// Run the event day index download process
downloadEventDayIndexPages();