const fs = require('fs-extra');
const https = require('https');
const path = require('path');
const cheerio = require('cheerio');

// Configuration
const BASE_URL = 'https://www.paccentraljc.org';
const YEAR = '2019';
const INDEX_URL = `${BASE_URL}/${YEAR}.html`;
const BASE_DIR = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2019';
const HTML_DIR = path.join(BASE_DIR, 'html');
const IMAGES_DIR = path.join(BASE_DIR, 'images');
const DATA_DIR = path.join(BASE_DIR, 'data');

// Delay between requests (milliseconds) - 1.5 seconds to be respectful to server
const REQUEST_DELAY = 1500;

// Results tracking
const results = {
  indexPage: null,
  awardPages: [],
  dateIndexPages: [],
  images: [],
  errors: []
};

// Award to date mapping (will be populated as we discover the structure)
const awardToDateMap = {};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      const file = fs.createWriteStream(filePath);
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(response);
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

async function getPageContent(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadIndexPage() {
  console.log('📄 Step 1: Downloading 2019 index page...');
  console.log(`   📡 Downloading: ${INDEX_URL}`);
  
  try {
    const indexPath = path.join(HTML_DIR, '2019-index.html');
    await downloadFile(INDEX_URL, indexPath);
    console.log(`   💾 Saved: 2019-index.html`);
    
    results.indexPage = {
      url: INDEX_URL,
      filePath: indexPath,
      status: 'success'
    };
    
    return indexPath;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    results.errors.push({
      type: 'index_page',
      url: INDEX_URL,
      error: error.message
    });
    throw error;
  }
}

async function extractLinksFromIndex(indexPath) {
  console.log('🔍 Step 2: Extracting award and index links...');
  
  const content = await fs.readFile(indexPath, 'utf-8');
  const $ = cheerio.load(content);
  
  const awardLinks = [];
  const dateIndexLinks = [];
  
  // Find all links that look like award pages or date folders
  $('a').each((i, element) => {
    const href = $(element).attr('href');
    if (href) {
      // Award page links: typically contain award numbers like 20195XXX.html
      if (href.match(/\d{8}\.html$/)) {
        awardLinks.push(href);
      }
      // Date folder links: typically YYYYMMDD/ format
      else if (href.match(/^\d{8}\//)) {
        dateIndexLinks.push(href);
      }
      // Some awards might be in nested folders
      else if (href.match(/\d{8}\/\d{8}\.html$/)) {
        awardLinks.push(href);
      }
    }
  });
  
  // Remove duplicates and sort
  const uniqueAwardLinks = [...new Set(awardLinks)].sort();
  const uniqueDateIndexLinks = [...new Set(dateIndexLinks)].sort();
  
  console.log(`   🎯 Found ${uniqueAwardLinks.length} individual award links`);
  console.log(`   📅 Found ${uniqueDateIndexLinks.length} date index links`);
  
  return { awardLinks: uniqueAwardLinks, dateIndexLinks: uniqueDateIndexLinks };
}

async function downloadAwardPages(awardLinks) {
  console.log(`📥 Step 3: Downloading ${awardLinks.length} individual award pages...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < awardLinks.length; i++) {
    const link = awardLinks[i];
    const url = link.startsWith('http') ? link : `${BASE_URL}/${link}`;
    
    // Extract award number and date from the link
    const linkParts = link.split('/');
    let awardNumber, dateFolder, fileName;
    
    if (linkParts.length > 1) {
      // Format: YYYYMMDD/award.html
      dateFolder = linkParts[0];
      fileName = linkParts[1];
      awardNumber = fileName.replace('.html', '');
      // Store mapping for image downloads
      awardToDateMap[awardNumber] = dateFolder;
    } else {
      // Direct award file
      fileName = link;
      awardNumber = link.replace('.html', '');
    }
    
    const localPath = path.join(HTML_DIR, fileName);
    
    console.log(`   📄 Downloading ${i + 1}/${awardLinks.length}: ${awardNumber} (${link})`);
    
    try {
      await downloadFile(url, localPath);
      console.log(`      ✅ Saved: ${fileName}`);
      
      results.awardPages.push({
        awardNumber,
        url,
        fileName,
        localPath,
        dateFolder: dateFolder || null,
        status: 'success'
      });
      successCount++;
    } catch (error) {
      console.log(`      ❌ Failed: ${error.message}`);
      results.errors.push({
        type: 'award_page',
        awardNumber,
        url,
        error: error.message
      });
      errorCount++;
    }
    
    // Add delay between requests
    if (i < awardLinks.length - 1) {
      await delay(REQUEST_DELAY);
    }
  }
  
  console.log(`   📊 Award pages: ${successCount} downloaded, ${errorCount} errors`);
  return successCount;
}

async function downloadDateIndexPages(dateIndexLinks) {
  console.log(`📅 Step 4: Downloading ${dateIndexLinks.length} date index pages...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < dateIndexLinks.length; i++) {
    const link = dateIndexLinks[i];
    const url = link.startsWith('http') ? link : `${BASE_URL}/${link}`;
    
    // Extract date from link (format: YYYYMMDD/)
    const dateMatch = link.match(/(\d{4})(\d{2})(\d{2})/);
    const fileName = dateMatch ? 
      `${YEAR}-${dateMatch[2]}-${dateMatch[3]}-index.html` : 
      `${link.replace('/', '-')}-index.html`;
    
    const localPath = path.join(HTML_DIR, fileName);
    
    console.log(`   📅 Downloading ${i + 1}/${dateIndexLinks.length}: ${link} -> ${fileName}`);
    
    try {
      await downloadFile(url, localPath);
      console.log(`      ✅ Saved: ${fileName}`);
      
      results.dateIndexPages.push({
        url,
        fileName,
        localPath,
        dateFolder: link.replace('/', ''),
        status: 'success'
      });
      successCount++;
    } catch (error) {
      console.log(`      ❌ Failed: ${error.message}`);
      results.errors.push({
        type: 'date_index',
        url,
        error: error.message
      });
      errorCount++;
    }
    
    // Add delay between requests
    if (i < dateIndexLinks.length - 1) {
      await delay(REQUEST_DELAY);
    }
  }
  
  console.log(`   📊 Date index pages: ${successCount} downloaded, ${errorCount} errors`);
  return successCount;
}

async function downloadImages() {
  console.log(`🖼️  Step 5: Downloading images from all pages...`);
  
  // Get all HTML files to scan for images
  const htmlFiles = await fs.readdir(HTML_DIR);
  const awardFiles = htmlFiles.filter(file => 
    file.endsWith('.html') && !file.includes('index') && !file.includes('2019-')
  );
  
  console.log(`   🔍 Scanning ${awardFiles.length} award pages for images...`);
  
  const imageUrls = new Set();
  
  // Scan each HTML file for image references
  for (const htmlFile of awardFiles) {
    const htmlPath = path.join(HTML_DIR, htmlFile);
    const content = await fs.readFile(htmlPath, 'utf-8');
    const $ = cheerio.load(content);
    
    // Find image tags and extract src attributes
    $('img').each((i, element) => {
      const src = $(element).attr('src');
      if (src && src.endsWith('.jpg')) {
        imageUrls.add(src);
      }
    });
  }
  
  const uniqueImages = Array.from(imageUrls);
  console.log(`   🖼️  Found ${uniqueImages.length} unique images to download`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < uniqueImages.length; i++) {
    const imageSrc = uniqueImages[i];
    const imageFileName = path.basename(imageSrc);
    const awardNumber = imageFileName.replace('.jpg', '');
    
    // Construct the correct URL based on the date folder mapping
    let imageUrl;
    if (awardToDateMap[awardNumber]) {
      // Use the date folder path
      imageUrl = `${BASE_URL}/${awardToDateMap[awardNumber]}/${imageFileName}`;
    } else {
      // Try direct path first
      imageUrl = imageSrc.startsWith('http') ? imageSrc : `${BASE_URL}/${imageSrc}`;
    }
    
    const localPath = path.join(IMAGES_DIR, imageFileName);
    
    console.log(`   🖼️  Downloading ${i + 1}/${uniqueImages.length}: ${imageFileName}`);
    
    try {
      await downloadFile(imageUrl, localPath);
      console.log(`      ✅ Saved: ${imageFileName}`);
      
      results.images.push({
        fileName: imageFileName,
        url: imageUrl,
        localPath,
        status: 'success'
      });
      successCount++;
    } catch (error) {
      console.log(`      ❌ Failed: ${error.message}`);
      results.errors.push({
        type: 'image',
        fileName: imageFileName,
        url: imageUrl,
        error: error.message
      });
      errorCount++;
    }
    
    // Add delay between requests
    if (i < uniqueImages.length - 1) {
      await delay(REQUEST_DELAY);
    }
  }
  
  console.log(`   📊 Images: ${successCount} downloaded, ${errorCount} errors`);
  return successCount;
}

async function generateSummaryReport() {
  console.log('\n📊 Download Complete - Generating Summary Report...');
  
  const summary = {
    timestamp: new Date().toISOString(),
    year: YEAR,
    totals: {
      awardPages: results.awardPages.length,
      dateIndexPages: results.dateIndexPages.length,
      images: results.images.length,
      errors: results.errors.length
    },
    awardToDateMapping: awardToDateMap,
    results: results
  };
  
  console.log(`\n📋 DOWNLOAD SUMMARY:`);
  console.log(`   📄 HTML Award Files: ${summary.totals.awardPages}`);
  console.log(`   📅 Date Index Files: ${summary.totals.dateIndexPages}`);
  console.log(`   🖼️  Images: ${summary.totals.images}`);
  console.log(`   ❌ Errors: ${summary.totals.errors}`);
  
  console.log(`\n📁 Files saved to:`);
  console.log(`   HTML: ${HTML_DIR}`);
  console.log(`   Images: ${IMAGES_DIR}`);
  
  // Save detailed report
  const reportPath = path.join(DATA_DIR, 'download-report.json');
  await fs.writeJson(reportPath, summary, { spaces: 2 });
  console.log(`   Report: ${reportPath}`);
  
  return summary;
}

async function main() {
  console.log('🚀 Starting COMPLETE 2019 Download Process\n');
  
  console.log('📋 This will:');
  console.log('   1. 📄 Download 2019 index page');
  console.log('   2. 🔍 Extract all award links AND date-specific index links');
  console.log('   3. 📥 Download individual HTML award pages');
  console.log('   4. 📅 Download date-specific index pages');
  console.log('   5. 🖼️  Download all images (thumbnails and full-size)');
  console.log('   6. ✅ Generate comprehensive summary report\n');
  
  try {
    // Ensure directories exist
    await fs.ensureDir(HTML_DIR);
    await fs.ensureDir(IMAGES_DIR);
    await fs.ensureDir(DATA_DIR);
    
    // Step 1: Download index page
    const indexPath = await downloadIndexPage();
    
    // Step 2: Extract links
    const { awardLinks, dateIndexLinks } = await extractLinksFromIndex(indexPath);
    
    // Step 3: Download award pages
    await downloadAwardPages(awardLinks);
    
    // Step 4: Download date index pages
    await downloadDateIndexPages(dateIndexLinks);
    
    // Step 5: Download images
    await downloadImages();
    
    // Step 6: Generate report
    await generateSummaryReport();
    
    console.log(`\n✅ ${YEAR} Complete Download Process Finished!`);
    
  } catch (error) {
    console.error(`\n❌ Download process failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);