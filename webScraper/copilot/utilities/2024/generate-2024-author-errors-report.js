const fs = require('fs');
const path = require('path');

const categorizedReportPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2024/2024-categorized-issues.json';
const outputPath = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/savedData/2024/2024-author-errors-report.json';

function generate2024AuthorErrorsReport() {
    console.log('Generating 2024 author errors report with HTML links...');
    
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
    console.log(`Found ${authorErrors.length} author error files to report`);
    
    const authorReport = {
        timestamp: new Date().toISOString(),
        purpose: "Report incomplete 2024 award pages to website author for correction",
        summary: {
            totalAuthorErrors: authorErrors.length,
            totalMissingFields: authorErrors.reduce((sum, file) => sum + file.nullCount, 0)
        },
        message: "The following 2024 award pages appear to be incomplete on the source website and need author attention:",
        pagesNeedingCorrection: []
    };
    
    authorErrors.forEach((errorInfo, index) => {
        const awardNum = errorInfo.awardNum;
        
        // Generate the live website URL
        const liveUrl = `https://paccentraljc.org/awards/${awardNum}`;
        
        // Generate alternative URLs based on 2024 structure
        const yearMonth = awardNum.substring(0, 6); // e.g., "202452" from "20245268"
        const alternativeUrl = `https://paccentraljc.org/awards/2024/${awardNum}.html`;
        
        authorReport.pagesNeedingCorrection.push({
            pageNumber: index + 1,
            awardNumber: awardNum,
            plantName: errorInfo.plantName,
            exhibitor: errorInfo.exhibitor,
            missingFieldsCount: errorInfo.nullCount,
            primaryIssues: errorInfo.nullFieldsList.slice(0, 5), // Show first 5 issues
            websiteUrl: liveUrl,
            alternativeUrl: alternativeUrl,
            severity: errorInfo.nullCount >= 15 ? "Critical" : errorInfo.nullCount >= 10 ? "High" : "Medium",
            description: `Award page for ${errorInfo.plantName} (${awardNum}) is missing ${errorInfo.nullCount} essential fields including ${errorInfo.nullFieldsList.slice(0, 3).join(', ')}${errorInfo.nullCount > 3 ? ' and others' : ''}.`
        });
    });
    
    // Write the author errors report
    try {
        fs.writeFileSync(outputPath, JSON.stringify(authorReport, null, 2));
        console.log('2024 Author errors report created:', outputPath);
        
        // Print formatted report for easy copy/paste
        console.log('\n' + '='.repeat(70));
        console.log('2024 REPORT TO WEBSITE AUTHOR');
        console.log('='.repeat(70));
        console.log('Subject: Incomplete 2024 Award Pages Need Correction');
        console.log('');
        console.log('Dear Website Administrator,');
        console.log('');
        console.log('During our data validation process for 2024 awards, we identified');
        console.log('several award pages that appear to be incomplete on the source');
        console.log('website. These pages are missing essential award information.');
        console.log('');
        console.log(`PAGES NEEDING CORRECTION (${authorReport.summary.totalAuthorErrors} total):`);
        console.log('');
        
        authorReport.pagesNeedingCorrection.forEach(page => {
            console.log(`${page.pageNumber}. Award ${page.awardNumber} - ${page.severity} Priority`);
            console.log(`   Plant: ${page.plantName}`);
            console.log(`   Exhibitor: ${page.exhibitor}`);
            console.log(`   Missing: ${page.missingFieldsCount} essential fields`);
            console.log(`   URL: ${page.websiteUrl}`);
            console.log(`   Issues: ${page.primaryIssues.join(', ')}${page.missingFieldsCount > 5 ? ' + others' : ''}`);
            console.log('');
        });
        
        console.log('These incomplete pages prevent accurate data collection and should');
        console.log('be reviewed and completed with the missing award information.');
        console.log('');
        console.log('Please let us know once these have been updated so we can');
        console.log('re-process the data.');
        console.log('');
        console.log('Best regards,');
        console.log('Data Validation Team');
        console.log('='.repeat(70));
        
        // Also create a simple URL list for easy access
        console.log('\n2024 QUICK URL LIST FOR TESTING:');
        authorReport.pagesNeedingCorrection.forEach(page => {
            console.log(`${page.websiteUrl}`);
        });
        
    } catch (error) {
        console.error('Error writing 2024 author errors report:', error);
    }
}

generate2024AuthorErrorsReport();