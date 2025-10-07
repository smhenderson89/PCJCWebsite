#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

class Update2022CategorizedIssues {
    constructor() {
        this.issuesFile = path.join(__dirname, '..', 'localCopy', 'paccentraljc.org', 'awards', '2022', 'data', 'errorChecking', '2022-categorized-issues-25.10.06-1831.json');
        this.correctionsFile = path.join(__dirname, '..', 'localCopy', 'paccentraljc.org', 'awards', '2022', 'data', 'errorChecking', '2022-corrections-applied-report.json');
        
        // Awards that were fixed
        this.fixedAwards = [
            '20225250', // Cross set to N/A
            '20225253', // Cross set to species
            '20225254', // Cross set to species
            '20225259', // Cross set to species
            '20225304', // AD award fixed
            '20225318', // Arrangement award fixed
            '20225350', // CCE award fixed
            '20225351'  // CCE award fixed
        ];
    }

    async run() {
        console.log('📝 Updating 2022 Categorized Issues File\n');
        
        // Load the current issues file
        const issues = await fs.readJSON(this.issuesFile);
        console.log('📋 Original summary:');
        console.log(`   🌱 Missing Cross/Parentage: ${issues.summary.missingCrossParentage}`);
        console.log(`   📏 Measurement Only Issues: ${issues.summary.measurementOnlyIssues}`);
        console.log(`   🎨 Display Award Expected Empty: ${issues.summary.displayAwardExpectedEmpty}`);
        console.log(`   📍 Location/Date Minor Issues: ${issues.summary.locationDateMinor}`);
        console.log(`   ⚠️  Problematic Files: ${issues.summary.problematicFiles}`);
        console.log(`   📊 Total Files with Issues: ${issues.summary.totalFilesWithEmptyFields}\n`);

        // Remove fixed awards from each category
        this.removeFixer(issues.categories.missingCrossParentage, 'missingCrossParentage');
        this.removeFixer(issues.categories.problematicFiles, 'problematicFiles');

        // Update summary counts
        issues.summary.missingCrossParentage = issues.categories.missingCrossParentage.length;
        issues.summary.measurementOnlyIssues = issues.categories.measurementOnlyIssues.length;
        issues.summary.displayAwardExpectedEmpty = issues.categories.displayAwardExpectedEmpty.length;
        issues.summary.locationDateMinor = issues.categories.locationDateMinor.length;
        issues.summary.problematicFiles = issues.categories.problematicFiles.length;
        issues.summary.totalFilesWithEmptyFields = 
            issues.summary.missingCrossParentage + 
            issues.summary.measurementOnlyIssues + 
            issues.summary.displayAwardExpectedEmpty + 
            issues.summary.locationDateMinor + 
            issues.summary.problematicFiles;

        // Add metadata about the update
        issues.lastUpdated = new Date().toISOString();
        issues.updateNotes = "Removed fixed awards: 20225250, 20225253, 20225254, 20225259 (cross/parentage fixes) and 20225304, 20225318, 20225350, 20225351 (problematic file fixes)";
        issues.fixesApplied = this.fixedAwards.length;

        // Save the updated file
        await fs.writeJSON(this.issuesFile, issues, { spaces: 2 });

        console.log('📋 Updated summary:');
        console.log(`   🌱 Missing Cross/Parentage: ${issues.summary.missingCrossParentage}`);
        console.log(`   📏 Measurement Only Issues: ${issues.summary.measurementOnlyIssues}`);
        console.log(`   🎨 Display Award Expected Empty: ${issues.summary.displayAwardExpectedEmpty}`);
        console.log(`   📍 Location/Date Minor Issues: ${issues.summary.locationDateMinor}`);
        console.log(`   ⚠️  Problematic Files: ${issues.summary.problematicFiles}`);
        console.log(`   📊 Total Files with Issues: ${issues.summary.totalFilesWithEmptyFields}\n`);

        console.log(`🔧 Removed ${this.fixedAwards.length} fixed awards from issues list`);
        console.log(`📄 Updated file: ${this.issuesFile}`);
        console.log('\n✅ Categorized issues file updated successfully!');
    }

    removeFixer(category, categoryName) {
        const originalCount = category.length;
        
        // Filter out fixed awards
        const filtered = category.filter(item => !this.fixedAwards.includes(item.awardNum));
        
        // Update the category array
        category.length = 0;
        category.push(...filtered);
        
        const removedCount = originalCount - filtered.length;
        if (removedCount > 0) {
            console.log(`   🔧 Removed ${removedCount} fixed award(s) from ${categoryName}`);
        }
    }
}

// Run the update
const updater = new Update2022CategorizedIssues();
updater.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});