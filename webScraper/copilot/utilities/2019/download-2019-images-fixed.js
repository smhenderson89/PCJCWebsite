const fs = require('fs-extra');
const https = require('https');
const path = require('path');
const cheerio = require('cheerio');

const BASE_DIR = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2019';
const HTML_DIR = path.join(BASE_DIR, 'html');
const IMAGES_DIR = path.join(BASE_DIR, 'images');

// Award number to date folder mapping (will be built dynamically from HTML files)
let awardToDateMap = {};

// Delay between requests (milliseconds) - 1.5 seconds to be respectful to server
const REQUEST_DELAY = 1500;

// Results tracking
const results = {
  downloaded: [],
  errors: []
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function buildAwardToDateMapping() {
  console.log('🔍 Building award-to-date mapping from existing HTML files...\n');
  
  // Get all award HTML files (not index files)
  const htmlFiles = await fs.readdir(HTML_DIR);
  const awardFiles = htmlFiles.filter(file => 
    file.endsWith('.html') && 
    file.match(/^\d{8}\.html$/) // Date format files like 20190112.html
  );
  
  // Get all individual award files (not date index files)
  const individualAwardFiles = htmlFiles.filter(file => 
    file.endsWith('.html') && 
    file.match(/^201948\d{2}\.html$/) // Award number format files like 20194851.html
  );
  
  console.log(`   📄 Found ${awardFiles.length} date index files`);
  console.log(`   🎯 Found ${individualAwardFiles.length} individual award files`);
  
  // Parse date files to find awards and associate them with dates
  for (const dateFile of awardFiles) {
    const datePath = path.join(HTML_DIR, dateFile);
    const content = await fs.readFile(datePath, 'utf-8');
    const $ = cheerio.load(content);
    
    // Extract date from filename (YYYYMMDD.html -> YYYYMMDD)
    const dateFolder = dateFile.replace('.html', '');
    
    // Find award links in this date's index
    $('a').each((i, element) => {
      const href = $(element).attr('href');
      if (href && href.match(/^201948\d{2}\.html$/)) {
        const awardNumber = href.replace('.html', '');
        awardToDateMap[awardNumber] = dateFolder;
      }
    });
  }
  
  console.log(`   ✅ Built mapping for ${Object.keys(awardToDateMap).length} awards\n`);
  return awardToDateMap;
}

async function downloadAllImages() {
  console.log('🚀 Starting 2019 Image Download with Correct Paths\n');
  
  // Build award-to-date mapping from existing HTML files
  await buildAwardToDateMapping();
  
  // Ensure images directory exists
  await fs.ensureDir(IMAGES_DIR);
  
  const awards = Object.keys(awardToDateMap);
  console.log(`🖼️  Found ${awards.length} awards to download images for...\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < awards.length; i++) {
    const awardNumber = awards[i];
    const dateFolder = awardToDateMap[awardNumber];
    const imageFileName = `${awardNumber}.jpg`;
    
    // Construct the correct URL with date folder
    const imageUrl = `https://www.paccentraljc.org/${dateFolder}/${imageFileName}`;
    const localPath = path.join(IMAGES_DIR, imageFileName);
    
    console.log(`🖼️  Downloading ${i + 1}/${awards.length}: ${imageFileName}`);
    console.log(`   📡 URL: ${imageUrl}`);
    
    try {
      await downloadImage(imageUrl, localPath);
      console.log(`   ✅ Saved: ${imageFileName}`);
      results.downloaded.push({
        awardNumber,
        fileName: imageFileName,
        url: imageUrl,
        localPath
      });
      successCount++;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      results.errors.push({
        awardNumber,
        fileName: imageFileName,
        url: imageUrl,
        error: error.message
      });
      errorCount++;
    }
    
    // Add delay between requests
    if (i < awards.length - 1) {
      await delay(REQUEST_DELAY);
    }
  }
  
  console.log(`\n📊 Download Complete:`);
  console.log(`   ✅ Successfully downloaded: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  
  // Save detailed results
  const reportPath = path.join(BASE_DIR, 'data', 'image-download-report.json');
  await fs.ensureDir(path.dirname(reportPath));
  await fs.writeJson(reportPath, {
    timestamp: new Date().toISOString(),
    summary: {
      total: awards.length,
      successful: successCount,
      failed: errorCount,
      successRate: `${((successCount / awards.length) * 100).toFixed(1)}%`
    },
    results
  }, { spaces: 2 });
  
  console.log(`\n📋 Detailed report saved to: ${reportPath}`);
  console.log(`\n✅ 2019 Image Download Process Complete!`);
}

// Run the script
downloadAllImages().catch(console.error);