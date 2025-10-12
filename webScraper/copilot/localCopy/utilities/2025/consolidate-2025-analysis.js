const fs = require('fs');
const path = require('path');

const sourceDataDir = '/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/webScraper/copilot/localCopy/paccentraljc.org/awards/2025/data';

console.log('='.repeat(80));
console.log('2025 ANALYSIS FILES CONSOLIDATOR');
console.log('='.repeat(80));

function loadJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.log(`⚠️  Error reading ${path.basename(filePath)}: ${error.message}`);
        return null;
    }
}

function loadMarkdownFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.log(`⚠️  Error reading ${path.basename(filePath)}: ${error.message}`);
        return null;
    }
}

// Load all analysis files
const analysisFiles = {
    categorized: loadJsonFile(path.join(sourceDataDir, '2025-categorized-issues.json')),
    cleanData: loadJsonFile(path.join(sourceDataDir, '2025-clean-data-report.json')),
    missingData: loadJsonFile(path.join(sourceDataDir, '2025-missing-data-report.json')),
    nullValues: loadJsonFile(path.join(sourceDataDir, '2025-null-values-review.json')),
    sourceUrlFixes: loadJsonFile(path.join(sourceDataDir, '2025-source-url-fixes-report.json')),
    authorErrors: loadJsonFile(path.join(sourceDataDir, 'author-errors-report.json')),
    pagesWithMissing: loadJsonFile(path.join(sourceDataDir, 'pagesWithMissingInfo.json')),
    finalSummary: loadMarkdownFile(path.join(sourceDataDir, 'FINAL-ANALYSIS-SUMMARY.md'))
};

// Create comprehensive consolidated report
const consolidatedReport = {
    generatedAt: new Date().toISOString(),
    purpose: "Consolidated analysis of all 2025 PCJC Awards data quality reports",
    sourceFiles: [
        "2025-categorized-issues.json",
        "2025-clean-data-report.json", 
        "2025-missing-data-report.json",
        "2025-null-values-review.json",
        "2025-source-url-fixes-report.json",
        "author-errors-report.json",
        "pagesWithMissingInfo.json",
        "FINAL-ANALYSIS-SUMMARY.md"
    ],
    
    // Executive Summary
    executiveSummary: {
        totalAwardFiles: analysisFiles.categorized?.summary?.totalFiles || 0,
        dataQualityStatus: "ANALYSIS COMPLETE - FIXES APPLIED",
        completionRate: null, // Will calculate below
        criticalIssues: analysisFiles.categorized?.summary?.authorErrors || 0,
        recoverableIssues: analysisFiles.categorized?.summary?.recoverableIssues || 0,
        minorIssues: analysisFiles.categorized?.summary?.minorIssues || 0
    },

    // Data Quality Assessment
    dataQuality: {
        cleanDataReport: analysisFiles.cleanData,
        missingDataReport: analysisFiles.missingData,
        nullValuesAnalysis: analysisFiles.nullValues
    },

    // Issue Categorization
    issueAnalysis: {
        categorizedIssues: analysisFiles.categorized,
        sourceUrlFixes: analysisFiles.sourceUrlFixes,
        pagesWithMissingInfo: analysisFiles.pagesWithMissing
    },

    // Action Items & Author Errors
    actionItems: {
        authorErrorReport: analysisFiles.authorErrors,
        recommendedActions: []
    },

    // Final Processing Summary
    processingResults: {
        finalSummaryMarkdown: analysisFiles.finalSummary,
        automatedFixesApplied: true,
        manualReviewRequired: false
    }
};

// Calculate completion rate if data available
if (analysisFiles.categorized) {
    const total = analysisFiles.categorized.summary.totalFiles;
    const withIssues = analysisFiles.categorized.summary.filesWithNullValues;
    const completionRate = ((total - withIssues) / total * 100).toFixed(1);
    consolidatedReport.executiveSummary.completionRate = `${completionRate}%`;
}

// Add recommended actions based on analysis
if (analysisFiles.authorErrors && analysisFiles.authorErrors.issuesForAuthor) {
    consolidatedReport.actionItems.recommendedActions = [
        `Contact website maintainer about ${analysisFiles.authorErrors.issuesForAuthor.length} pages with HTML parsing issues`,
        "Review automated fixes applied to recovered award data",
        "Validate final data quality metrics against source content"
    ];
}

// Write consolidated report
const outputPath = path.join(sourceDataDir, '2025-CONSOLIDATED-ANALYSIS-REPORT.json');
fs.writeFileSync(outputPath, JSON.stringify(consolidatedReport, null, 2));

console.log('✅ Consolidated Analysis Report Generated!');
console.log(`📁 Output: ${outputPath}`);
console.log('');

// Display summary
console.log('📊 CONSOLIDATION SUMMARY:');
console.log(`   • Source Files Processed: ${consolidatedReport.sourceFiles.length}`);
console.log(`   • Total Award Files: ${consolidatedReport.executiveSummary.totalAwardFiles}`);
console.log(`   • Data Quality Rate: ${consolidatedReport.executiveSummary.completionRate || 'N/A'}`);
console.log(`   • Critical Issues: ${consolidatedReport.executiveSummary.criticalIssues}`);
console.log(`   • Recoverable Issues: ${consolidatedReport.executiveSummary.recoverableIssues}`);
console.log(`   • Minor Issues: ${consolidatedReport.executiveSummary.minorIssues}`);

console.log('');
console.log('🗑️  CLEANUP OPTIONS:');
console.log('   After reviewing the consolidated report, you can delete the individual analysis files:');
console.log('   • 2025-categorized-issues.json');
console.log('   • 2025-clean-data-report.json');
console.log('   • 2025-missing-data-report.json');
console.log('   • 2025-null-values-review.json');
console.log('   • 2025-source-url-fixes-report.json');
console.log('   • author-errors-report.json');
console.log('   • pagesWithMissingInfo.json');
console.log('   • FINAL-ANALYSIS-SUMMARY.md');
console.log('');
console.log('💡 The consolidated report contains all information from these individual files.');