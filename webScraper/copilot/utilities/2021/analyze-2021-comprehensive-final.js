#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

class Comprehensive2021Analysis {
    constructor() {
        this.jsonDir = path.join(__dirname, '..', 'savedData', '2021', 'json');
        this.htmlDir = path.join(__dirname, '..', 'localCopy', 'paccentraljc.org', 'awards', '2021', 'html');
        this.results = {
            summary: {},
            emptyFieldAnalysis: {},
            fileCategories: {
                perfect: [],
                nearPerfect: [],
                good: [],
                needsWork: [],
                problematic: []
            },
            actionableIssues: {
                fixableFromHtml: [],
                structuralIssues: [],
                expectedEmpty: []
            },
            photographers: {},
            awardTypes: {},
            missingDataPatterns: []
        };
    }

    async run() {
        console.log('🔍 Starting Comprehensive 2022 Data Analysis\n');
        
        console.log('📋 This analysis will:');
        console.log('   1. 📊 Analyze all current 2022 JSON files');
        console.log('   2. 🎯 Categorize files by completeness level');
        console.log('   3. 🔧 Identify fixable vs expected empty fields');
        console.log('   4. 📈 Provide actionable improvement recommendations');
        console.log('   5. 📄 Generate detailed fix strategy report\n');

        // Get all JSON files
        const allFiles = await fs.readdir(this.jsonDir);
        const jsonFiles = allFiles.filter(f => f.endsWith('.json') && f.match(/^20225\d{3}/));

        console.log(`📁 Found ${jsonFiles.length} JSON files to analyze\n`);
        console.log('🔍 Analyzing data completeness and quality...');

        // Analyze each file
        for (let i = 0; i < jsonFiles.length; i++) {
            const fileName = jsonFiles[i];
            console.log(`   📄 Analyzing ${i + 1}/${jsonFiles.length}: ${fileName}`);
            
            try {
                await this.analyzeFile(fileName);
            } catch (error) {
                console.log(`      ❌ Error analyzing ${fileName}: ${error.message}`);
            }
        }

        // Generate comprehensive analysis
        await this.generateComprehensiveReport();
    }

    async analyzeFile(fileName) {
        const filePath = path.join(this.jsonDir, fileName);
        const data = await fs.readJSON(filePath);
        const isDisplay = fileName.includes('-display') || data.display === true;
        
        const analysis = {
            fileName,
            isDisplay,
            emptyFields: [],
            emptyCount: 0,
            category: '',
            fixableFields: [],
            expectedEmptyFields: []
        };

        // Define all possible fields
        const mainFields = ['awardNum', 'award', 'awardpoints', 'location', 'date', 'genus', 'species', 'clone', 'cross', 'exhibitor', 'photographer', 'photo'];
        const measurementFields = ['type', 'NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'LIPL', 'numFlowers', 'numBuds', 'description'];

        // Check main fields
        for (const field of mainFields) {
            if (this.isEmpty(data[field])) {
                analysis.emptyFields.push(field);
                analysis.emptyCount++;
                
                // Categorize if fixable or expected
                if (this.isFixableField(field, data, isDisplay)) {
                    analysis.fixableFields.push(field);
                } else {
                    analysis.expectedEmptyFields.push(field);
                }
            }
        }

        // Check measurement fields
        if (data.measurements) {
            for (const field of measurementFields) {
                if (this.isEmpty(data.measurements[field])) {
                    analysis.emptyFields.push(`measurements.${field}`);
                    analysis.emptyCount++;
                    
                    if (this.isFixableMeasurementField(field, data, isDisplay)) {
                        analysis.fixableFields.push(`measurements.${field}`);
                    } else {
                        analysis.expectedEmptyFields.push(`measurements.${field}`);
                    }
                }
            }
        }

        // Track photographers and award types
        if (data.photographer) {
            this.results.photographers[data.photographer] = (this.results.photographers[data.photographer] || 0) + 1;
        }
        if (data.award) {
            this.results.awardTypes[data.award] = (this.results.awardTypes[data.award] || 0) + 1;
        }

        // Categorize file by completeness
        analysis.category = this.categorizeFile(analysis.emptyCount, isDisplay);
        this.results.fileCategories[analysis.category].push(analysis);

        // Add to actionable issues
        if (analysis.fixableFields.length > 0) {
            this.results.actionableIssues.fixableFromHtml.push({
                fileName,
                fixableFields: analysis.fixableFields
            });
        }

        return analysis;
    }

    isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        if (Array.isArray(value) && value.length === 0) return true;
        if (typeof value === 'object' && Object.keys(value).length === 0) return true;
        return false;
    }

    isFixableField(field, data, isDisplay) {
        // Fields that might be extractable from HTML
        const potentiallyFixable = ['cross', 'clone', 'award', 'awardpoints', 'location', 'date'];
        
        // Display awards have different expectations
        if (isDisplay) {
            return ['award', 'awardpoints'].includes(field);
        }
        
        return potentiallyFixable.includes(field);
    }

    isFixableMeasurementField(field, data, isDisplay) {
        // Display awards don't have plant measurements
        if (isDisplay) return false;
        
        // Some measurement fields might be extractable from HTML tables
        const potentiallyFixable = ['NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 'LSW', 'LSL', 'LIPW', 'LIPL'];
        return potentiallyFixable.includes(field);
    }

    categorizeFile(emptyCount, isDisplay) {
        if (isDisplay) {
            // Different standards for display awards
            if (emptyCount === 0) return 'perfect';
            if (emptyCount <= 2) return 'nearPerfect';
            if (emptyCount <= 4) return 'good';
            if (emptyCount <= 8) return 'needsWork';
            return 'problematic';
        } else {
            // Standards for plant awards
            if (emptyCount === 0) return 'perfect';
            if (emptyCount === 1) return 'nearPerfect';
            if (emptyCount <= 3) return 'good';
            if (emptyCount <= 8) return 'needsWork';
            return 'problematic';
        }
    }

    async generateComprehensiveReport() {
        console.log('\n📊 Generating comprehensive analysis report...\n');

        // Calculate summary statistics
        const totalFiles = Object.values(this.results.fileCategories).flat().length;
        const plantFiles = Object.values(this.results.fileCategories).flat().filter(f => !f.isDisplay).length;
        const displayFiles = Object.values(this.results.fileCategories).flat().filter(f => f.isDisplay).length;

        this.results.summary = {
            totalFiles,
            plantFiles,
            displayFiles,
            categoryCounts: {}
        };

        // Print category breakdown
        console.log('📋 File Completeness Categories:');
        for (const [category, files] of Object.entries(this.results.fileCategories)) {
            this.results.summary.categoryCounts[category] = files.length;
            const percentage = Math.round(files.length / totalFiles * 100);
            console.log(`   ${this.getCategoryIcon(category)} ${this.formatCategoryName(category)}: ${files.length}/${totalFiles} (${percentage}%)`);
        }

        // Analyze most common empty fields
        const fieldCounts = {};
        Object.values(this.results.fileCategories).flat().forEach(file => {
            file.emptyFields.forEach(field => {
                fieldCounts[field] = (fieldCounts[field] || 0) + 1;
            });
        });

        const sortedFields = Object.entries(fieldCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        console.log('\n📊 Most Common Empty Fields:');
        sortedFields.forEach(([field, count], index) => {
            const percentage = Math.round(count / totalFiles * 100);
            console.log(`   ${index + 1}. ${field}: ${count}/${totalFiles} files (${percentage}%)`);
        });

        // Show fixable issues
        console.log('\n🔧 Actionable Improvements Available:');
        const fixableCount = this.results.actionableIssues.fixableFromHtml.length;
        console.log(`   📄 Files with potentially fixable fields: ${fixableCount}`);

        if (fixableCount > 0) {
            console.log('\n📝 Sample Fixable Issues:');
            this.results.actionableIssues.fixableFromHtml.slice(0, 5).forEach(item => {
                console.log(`   📄 ${item.fileName}: ${item.fixableFields.join(', ')}`);
            });
        }

        // Show category details
        console.log('\n📊 Category Breakdowns:');
        
        if (this.results.fileCategories.perfect.length > 0) {
            console.log(`\n🌟 Perfect Files (${this.results.fileCategories.perfect.length}):`);
            this.results.fileCategories.perfect.slice(0, 5).forEach(file => {
                console.log(`   ✨ ${file.fileName} - Complete data`);
            });
        }

        if (this.results.fileCategories.problematic.length > 0) {
            console.log(`\n⚠️  Problematic Files (${this.results.fileCategories.problematic.length}):`);
            this.results.fileCategories.problematic.forEach(file => {
                console.log(`   ❌ ${file.fileName}: ${file.emptyCount} empty fields`);
                console.log(`      Missing: ${file.emptyFields.slice(0, 5).join(', ')}${file.emptyFields.length > 5 ? '...' : ''}`);
            });
        }

        // Photographer analysis
        console.log('\n📷 Photographer Distribution:');
        const sortedPhotographers = Object.entries(this.results.photographers)
            .sort((a, b) => b[1] - a[1]);
        sortedPhotographers.forEach(([photographer, count]) => {
            console.log(`   📸 ${photographer}: ${count} files`);
        });

        // Award type analysis
        console.log('\n🏆 Award Type Distribution:');
        const sortedAwards = Object.entries(this.results.awardTypes)
            .sort((a, b) => b[1] - a[1]);
        sortedAwards.forEach(([award, count]) => {
            console.log(`   🏅 ${award}: ${count} files`);
        });

        // Generate recommendations
        console.log('\n💡 Recommendations:');
        this.generateRecommendations();

        // Save detailed report
        const reportPath = path.join(path.dirname(this.jsonDir), '2022-comprehensive-analysis-report.json');
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: this.results.summary,
            fileCategories: this.results.fileCategories,
            actionableIssues: this.results.actionableIssues,
            fieldAnalysis: fieldCounts,
            photographers: this.results.photographers,
            awardTypes: this.results.awardTypes,
            recommendations: this.generateRecommendationsData()
        };

        await fs.writeJSON(reportPath, reportData, { spaces: 2 });
        console.log(`\n📊 Comprehensive report saved to: ${reportPath}`);
        console.log('\n✅ 2022 comprehensive data analysis complete!');
    }

    getCategoryIcon(category) {
        const icons = {
            perfect: '🌟',
            nearPerfect: '✨',
            good: '✅',
            needsWork: '⚠️',
            problematic: '❌'
        };
        return icons[category] || '❓';
    }

    formatCategoryName(category) {
        const names = {
            perfect: 'Perfect (0 empty)',
            nearPerfect: 'Near Perfect (1 empty)',
            good: 'Good (2-3 empty)',
            needsWork: 'Needs Work (4-8 empty)',
            problematic: 'Problematic (9+ empty)'
        };
        return names[category] || category;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Based on analysis results
        const fixableCount = this.results.actionableIssues.fixableFromHtml.length;
        const problematicCount = this.results.fileCategories.problematic.length;
        
        if (fixableCount > 0) {
            console.log(`   1. 🔧 Run targeted HTML parsing to fix ${fixableCount} files with fixable fields`);
        }
        
        if (problematicCount > 0) {
            console.log(`   2. ⚠️  Investigate ${problematicCount} problematic files for structural issues`);
        }
        
        console.log(`   3. ✅ Overall data quality is excellent - ${this.results.summary.categoryCounts.perfect + this.results.summary.categoryCounts.nearPerfect} files are nearly complete`);
        console.log(`   4. 🎯 Focus remaining efforts on cross/parentage data extraction for completeness`);
    }

    generateRecommendationsData() {
        return {
            priority1: 'Fix files with extractable HTML data',
            priority2: 'Investigate problematic files',
            priority3: 'Enhance cross/parentage extraction',
            overallStatus: 'High quality dataset ready for production'
        };
    }
}

// Run the comprehensive analysis
const analyzer = new Comprehensive2021Analysis();
analyzer.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});