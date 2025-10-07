const fs = require('fs-extra');
const https = require('https');
const path = require('path');

// Award number to date folder mapping (from our successful HTML downloads)
const awardToDateMap = {
  '20205400': '20200118',
  '20205401': '20200118', 
  '20205402': '20200118',
  '20205250': '20200124',
  '20205251': '20200124',
  '20205252': '20200124', 
  '20205253': '20200124',
  '20205254': '20200124',
  '20205255': '20200124',
  '20205256': '20200204',
  '20205257': '20200204',
  '20205403': '20200215',
  '20205404': '20200215',
  '20205301': '20200220',
  '20205302': '20200220',
  '20205303': '20200220',
  '20205304': '20200220', 
  '20205305': '20200220',
  '20205306': '20200220',
  '20205307': '20200220',
  '20205308': '20200220',
  '20205309': '20200220',
  '20205310': '20200220',
  '20205311': '20200220',
  '20205312': '20200220',
  '20205313': '20200220',
  '20205314': '20200220',
  '20205315': '20200303',
  '20205316': '20200303',
  '20205317': '20200303'
};

const BASE_DIR = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2020';
const IMAGES_DIR = path.join(BASE_DIR, 'images');
const HTML_DIR = path.join(BASE_DIR, 'html');

// Delay between requests (milliseconds)
const REQUEST_DELAY = 100;

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

async function downloadAllImages() {
  console.log('🚀 Starting 2020 Image Download with Correct Paths\n');
  
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
  console.log(`\n✅ 2020 Image Download Process Complete!`);
}

// Run the script
downloadAllImages().catch(console.error);