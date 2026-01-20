/**
 * 2016 URL Validation Script
 * Check that all source URLs in 2016 awards return HTTP 200
 * Includes rate limiting to avoid overloading the server
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Path to the 2016 JSON data directory
const jsonDataPath = path.join(__dirname, '../../paccentraljc.org/awards/2016/data/json');

/**
 * Delay function for rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Resolves after delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a URL returns HTTP 200
 * @param {string} url - URL to check
 * @returns {Promise<Object>} - Result object with status and details
 */
function checkUrl(url) {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'HEAD', // Use HEAD to avoid downloading full content
            timeout: 10000, // 10 second timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; URL-Checker/1.0)'
            }
        };
        
        const req = client.request(options, (res) => {
            resolve({
                url: url,
                status: res.statusCode,
                isValid: res.statusCode === 200,
                error: null
            });
        });
        
        req.on('error', (error) => {
            resolve({
                url: url,
                status: null,
                isValid: false,
                error: error.message
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                url: url,
                status: null,
                isValid: false,
                error: 'Request timeout'
            });
        });
        
        req.end();
    });
}

/**
 * Main URL checking function
 */
async function checkAllUrls() {
    console.log('🔗 2016 URL VALIDATION CHECK');
    console.log('=' .repeat(60));
    
    if (!fs.existsSync(jsonDataPath)) {
        console.error(`❌ JSON directory not found: ${jsonDataPath}`);
        return;
    }

    const jsonFiles = fs.readdirSync(jsonDataPath)
        .filter(file => file.endsWith('.json'))
        .sort();

    if (jsonFiles.length === 0) {
        console.error('❌ No JSON files found');
        return;
    }

    console.log(`📋 Found ${jsonFiles.length} JSON files to check URLs for\n`);

    const results = {
        totalFiles: jsonFiles.length,
        validUrls: 0,
        invalidUrls: 0,
        errors: [],
        checked: 0
    };

    for (const [index, file] of jsonFiles.entries()) {
        const filePath = path.join(jsonDataPath, file);
        
        try {
            const jsonContent = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(jsonContent);
            
            if (!data.sourceUrl) {
                console.log(`📄 [${index + 1}/${jsonFiles.length}] ${file} - No sourceUrl found`);
                results.errors.push({
                    file: file,
                    awardNum: data.awardNum || 'Unknown',
                    issue: 'Missing sourceUrl'
                });
                continue;
            }
            
            console.log(`📄 [${index + 1}/${jsonFiles.length}] Checking ${file} - ${data.sourceUrl}`);
            
            const urlResult = await checkUrl(data.sourceUrl);
            results.checked++;
            
            if (urlResult.isValid) {
                console.log(`   ✅ Status ${urlResult.status} - OK`);
                results.validUrls++;
            } else {
                console.log(`   ❌ Status ${urlResult.status || 'ERROR'} - ${urlResult.error || 'Invalid response'}`);
                results.invalidUrls++;
                results.errors.push({
                    file: file,
                    awardNum: data.awardNum || 'Unknown',
                    url: data.sourceUrl,
                    status: urlResult.status,
                    error: urlResult.error,
                    issue: 'URL validation failed'
                });
            }
            
            // Rate limiting: 2000ms delay between requests
            if (index < jsonFiles.length - 1) {
                console.log('   ⏳ Waiting 2 seconds...');
                await delay(2000);
            }
            
        } catch (error) {
            console.log(`📄 [${index + 1}/${jsonFiles.length}] ${file} - Parse error: ${error.message}`);
            results.errors.push({
                file: file,
                issue: `JSON parse error: ${error.message}`
            });
        }
    }

    // Print summary
    console.log('\n' + '=' .repeat(80));
    console.log('📊 2016 URL VALIDATION SUMMARY');
    console.log('=' .repeat(80));
    console.log(`📈 PROCESSING STATS:`);
    console.log(`   Total files: ${results.totalFiles}`);
    console.log(`   URLs checked: ${results.checked}`);
    console.log(`   Valid URLs (200): ${results.validUrls}`);
    console.log(`   Invalid URLs: ${results.invalidUrls}`);
    console.log(`   Files with errors: ${results.errors.length}`);
    
    if (results.checked > 0) {
        const successRate = ((results.validUrls / results.checked) * 100).toFixed(1);
        console.log(`   Success rate: ${successRate}%`);
    }

    if (results.errors.length > 0) {
        console.log(`\n⚠️  ISSUES FOUND:`);
        results.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.file} (${error.awardNum || 'Unknown'}): ${error.issue}`);
            if (error.url) {
                console.log(`      URL: ${error.url}`);
            }
            if (error.status) {
                console.log(`      Status: ${error.status}`);
            }
            if (error.error) {
                console.log(`      Error: ${error.error}`);
            }
        });
    }

    // Save detailed report
    const reportPath = path.join(__dirname, '2016-url-check-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            totalFiles: results.totalFiles,
            urlsChecked: results.checked,
            validUrls: results.validUrls,
            invalidUrls: results.invalidUrls,
            successRate: results.checked > 0 ? ((results.validUrls / results.checked) * 100).toFixed(1) + '%' : 'N/A'
        },
        errors: results.errors
    }, null, 2));

    console.log(`\n📊 Detailed report saved: ${reportPath}`);
    
    if (results.invalidUrls === 0 && results.errors.length === 0) {
        console.log('\n🎉 ALL URLs ARE VALID! No issues found.');
    } else {
        console.log(`\n⚠️  ${results.invalidUrls + results.errors.length} issues found that should be reviewed.`);
    }
}

// Run the URL check if this script is executed directly
if (require.main === module) {
    checkAllUrls().catch(console.error);
}

module.exports = { checkAllUrls, checkUrl };