const fs = require('fs');
const path = require('path');

const categorizedReportPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2024/2024-categorized-issues.json';
const outputPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2024/author-error-links.json';

function createSimpleAuthorErrorList() {
    console.log('Creating simple JSON list for author error pages...');
    
    // Read the categorized report
    let categorizedReport;
    try {
        const reportContent = fs.readFileSync(categorizedReportPath, 'utf8');
        categorizedReport = JSON.parse(reportContent);
    } catch (error) {
        console.error('Error reading categorized report:', error);
        return;
    }
    
    const authorErrors = categorizedReport.categories.authorErrorsOnSource || [];
    console.log(`Found ${authorErrors.length} author error pages`);
    
    // Create simple list with just the essential info for a non-technical reader
    const simpleList = {
        message: "The following award pages need to be fixed on the website - they are missing important information:",
        totalPages: authorErrors.length,
        pages: authorErrors.map(error => ({
            plantName: error.plantName,
            exhibitor: error.exhibitor,
            missingItems: error.nullCount,
            websiteLink: `https://paccentraljc.org/awards/${error.awardNum}`
        }))
    };
    
    // Write the simple list
    try {
        fs.writeFileSync(outputPath, JSON.stringify(simpleList, null, 2));
        console.log('Simple author error list created:', outputPath);
        
        // Print a formatted version for easy reading
        console.log('\n' + '='.repeat(60));
        console.log('SIMPLE LIST FOR WEBSITE MAINTAINER');
        console.log('='.repeat(60));
        console.log('The following award pages need to be fixed on the website:');
        console.log(`Total pages with problems: ${authorErrors.length}`);
        console.log('');
        
        simpleList.pages.forEach((page, index) => {
            console.log(`${index + 1}. ${page.plantName} (${page.exhibitor})`);
            console.log(`   Missing ${page.missingItems} pieces of information`);
            console.log(`   Link: ${page.websiteLink}`);
            console.log('');
        });
        
        console.log('Please check these pages and make sure all the award');
        console.log('information is filled in completely.');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('Error writing simple list:', error);
    }
}

createSimpleAuthorErrorList();