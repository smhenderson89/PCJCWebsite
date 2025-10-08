#!/usr/bin/env node

/**
 * PCJC Awards Analysis Toolkit
 * Consolidated utility functions for analyzing award data across all years
 * Usage: Can be imported as module or run directly with year parameter
 */

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

class PCJCAnalysisToolkit {
    constructor(year) {
        this.year = year;
        this.baseDir = path.join(__dirname, '..', 'localCopy', 'paccentraljc.org', 'awards', year);
        this.jsonDir = path.join(this.baseDir, 'data', 'json');
        this.htmlDir = path.join(this.baseDir, 'html');
        this.dataDir = path.join(this.baseDir, 'data');
    }

    /**
     * Categorize null value issues across all awards
     */
    async categorizeNullIssues() {
        console.log(`🔍 Categorizing null value issues for ${this.year}...`);
        
        const files = await fs.readdir(this.jsonDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const categorizedReport = {
            timestamp: new Date().toISOString(),
            year: this.year,
            analysisVersion: "2.0",
            purpose: `Categorize null/empty field issues by fixability and severity for ${this.year} data`,
            summary: {
                totalFiles: jsonFiles.length,
                filesWithIssues: 0,
                recoverableIssues: 0,
                problematicFiles: 0,
                minorIssues: 0
            },
            categories: {
                recoverable: [],
                problematic: [],
                minor: [],
                perfect: []
            }
        };

        for (const file of jsonFiles) {
            const filePath = path.join(this.jsonDir, file);
            const data = await fs.readJSON(filePath);
            const awardNum = file.replace('.json', '').replace('-display', '');
            
            const analysis = this.analyzeAwardData(data, awardNum);
            
            if (analysis.issues.length === 0) {
                categorizedReport.categories.perfect.push({
                    awardNum,
                    file,
                    status: 'Perfect - No issues detected'
                });
            } else {
                categorizedReport.summary.filesWithIssues++;
                
                if (analysis.severity === 'recoverable') {
                    categorizedReport.summary.recoverableIssues++;
                    categorizedReport.categories.recoverable.push({
                        awardNum,
                        file,
                        issues: analysis.issues,
                        severity: analysis.severity,
                        fixStrategy: analysis.fixStrategy
                    });
                } else if (analysis.severity === 'problematic') {
                    categorizedReport.summary.problematicFiles++;
                    categorizedReport.categories.problematic.push({
                        awardNum,
                        file,
                        issues: analysis.issues,
                        severity: analysis.severity,
                        notes: analysis.notes
                    });
                } else {
                    categorizedReport.summary.minorIssues++;
                    categorizedReport.categories.minor.push({
                        awardNum,
                        file,
                        issues: analysis.issues,
                        severity: analysis.severity
                    });
                }
            }
        }

        const outputPath = path.join(this.dataDir, `${this.year}-categorized-issues.json`);
        await fs.writeJSON(outputPath, categorizedReport, { spaces: 2 });
        
        console.log(`✅ Categorization complete. Report saved to: ${outputPath}`);
        console.log(`📊 Summary: ${categorizedReport.summary.filesWithIssues}/${categorizedReport.summary.totalFiles} files have issues`);
        
        return categorizedReport;
    }

    /**
     * Analyze individual award data for issues
     */
    analyzeAwardData(data, awardNum) {
        const issues = [];
        const criticalFields = ['award', 'awardNum', 'genus', 'species'];
        const importantFields = ['exhibitor', 'date', 'location'];
        const optionalFields = ['cross', 'clone', 'photographer'];

        // Check critical fields
        for (const field of criticalFields) {
            if (!data[field] || data[field] === '' || data[field] === null) {
                issues.push({
                    field,
                    type: 'missing_critical',
                    severity: 'high',
                    value: data[field]
                });
            }
        }

        // Check important fields
        for (const field of importantFields) {
            if (!data[field] || data[field] === '' || data[field] === null) {
                issues.push({
                    field,
                    type: 'missing_important',
                    severity: 'medium',
                    value: data[field]
                });
            }
        }

        // Check optional fields
        for (const field of optionalFields) {
            if (!data[field] || data[field] === '' || data[field] === null) {
                issues.push({
                    field,
                    type: 'missing_optional',
                    severity: 'low',
                    value: data[field]
                });
            }
        }

        // Check measurements
        if (!data.measurements || Object.keys(data.measurements).length < 2) {
            issues.push({
                field: 'measurements',
                type: 'missing_measurements',
                severity: 'medium',
                value: data.measurements
            });
        }

        // Determine overall severity and fix strategy
        const highSeverityCount = issues.filter(i => i.severity === 'high').length;
        const mediumSeverityCount = issues.filter(i => i.severity === 'medium').length;

        let severity, fixStrategy, notes;

        if (highSeverityCount > 0) {
            severity = 'problematic';
            notes = `${highSeverityCount} critical field(s) missing`;
        } else if (mediumSeverityCount > 2) {
            severity = 'problematic';
            notes = `Too many important fields missing (${mediumSeverityCount})`;
        } else if (mediumSeverityCount > 0) {
            severity = 'recoverable';
            fixStrategy = 'Check HTML source for missing data';
        } else {
            severity = 'minor';
        }

        return {
            issues,
            severity,
            fixStrategy,
            notes,
            totalIssues: issues.length,
            highSeverityCount,
            mediumSeverityCount
        };
    }

    /**
     * Extract null values analysis
     */
    async extractNullValues() {
        console.log(`📊 Extracting null value statistics for ${this.year}...`);
        
        const files = await fs.readdir(this.jsonDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const nullStats = {
            timestamp: new Date().toISOString(),
            year: this.year,
            totalFiles: jsonFiles.length,
            fieldStats: {},
            nullFiles: [],
            summary: {}
        };

        const allFields = new Set();
        
        // First pass: collect all possible fields
        for (const file of jsonFiles) {
            const filePath = path.join(this.jsonDir, file);
            const data = await fs.readJSON(filePath);
            Object.keys(data).forEach(key => allFields.add(key));
            if (data.measurements && typeof data.measurements === 'object') {
                Object.keys(data.measurements).forEach(key => allFields.add(`measurements.${key}`));
            }
        }

        // Initialize field stats
        allFields.forEach(field => {
            nullStats.fieldStats[field] = {
                total: 0,
                null: 0,
                empty: 0,
                populated: 0,
                percentage: 0
            };
        });

        // Second pass: analyze each file
        for (const file of jsonFiles) {
            const filePath = path.join(this.jsonDir, file);
            const data = await fs.readJSON(filePath);
            const awardNum = file.replace('.json', '').replace('-display', '');
            
            const fileNulls = [];

            // Check main fields
            allFields.forEach(field => {
                if (field.startsWith('measurements.')) {
                    const measurementField = field.replace('measurements.', '');
                    const value = data.measurements?.[measurementField];
                    nullStats.fieldStats[field].total++;
                    
                    if (value === null || value === undefined) {
                        nullStats.fieldStats[field].null++;
                        fileNulls.push({ field, value: null, type: 'null' });
                    } else if (value === '' || value === 0) {
                        nullStats.fieldStats[field].empty++;
                        fileNulls.push({ field, value, type: 'empty' });
                    } else {
                        nullStats.fieldStats[field].populated++;
                    }
                } else {
                    const value = data[field];
                    nullStats.fieldStats[field].total++;
                    
                    if (value === null || value === undefined) {
                        nullStats.fieldStats[field].null++;
                        fileNulls.push({ field, value: null, type: 'null' });
                    } else if (value === '' || (Array.isArray(value) && value.length === 0)) {
                        nullStats.fieldStats[field].empty++;
                        fileNulls.push({ field, value, type: 'empty' });
                    } else {
                        nullStats.fieldStats[field].populated++;
                    }
                }
            });

            if (fileNulls.length > 0) {
                nullStats.nullFiles.push({
                    awardNum,
                    file,
                    nullCount: fileNulls.length,
                    nullFields: fileNulls
                });
            }
        }

        // Calculate percentages and summary
        Object.keys(nullStats.fieldStats).forEach(field => {
            const stats = nullStats.fieldStats[field];
            stats.percentage = ((stats.null + stats.empty) / stats.total * 100).toFixed(1);
        });

        nullStats.summary = {
            filesWithNulls: nullStats.nullFiles.length,
            percentageWithNulls: (nullStats.nullFiles.length / nullStats.totalFiles * 100).toFixed(1),
            mostProblematicFields: Object.entries(nullStats.fieldStats)
                .filter(([_, stats]) => parseFloat(stats.percentage) > 10)
                .sort((a, b) => parseFloat(b[1].percentage) - parseFloat(a[1].percentage))
                .slice(0, 10)
                .map(([field, stats]) => ({ field, percentage: stats.percentage }))
        };

        const outputPath = path.join(this.dataDir, `${this.year}-null-analysis.json`);
        await fs.writeJSON(outputPath, nullStats, { spaces: 2 });
        
        console.log(`✅ Null value analysis complete. Report saved to: ${outputPath}`);
        console.log(`📊 ${nullStats.summary.filesWithNulls}/${nullStats.totalFiles} files (${nullStats.summary.percentageWithNulls}%) have null values`);
        
        return nullStats;
    }

    /**
     * Generate simple author/exhibitor error list
     */
    async generateAuthorErrors() {
        console.log(`👤 Generating author/exhibitor error analysis for ${this.year}...`);
        
        const files = await fs.readdir(this.jsonDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        const exhibitorAnalysis = {
            timestamp: new Date().toISOString(),
            year: this.year,
            totalFiles: jsonFiles.length,
            exhibitorStats: {
                withExhibitor: 0,
                withoutExhibitor: 0,
                emptyExhibitor: 0
            },
            missingExhibitors: [],
            exhibitorList: {},
            summary: {}
        };

        for (const file of jsonFiles) {
            const filePath = path.join(this.jsonDir, file);
            const data = await fs.readJSON(filePath);
            const awardNum = file.replace('.json', '').replace('-display', '');

            if (!data.exhibitor || data.exhibitor === '') {
                exhibitorAnalysis.exhibitorStats.withoutExhibitor++;
                exhibitorAnalysis.missingExhibitors.push({
                    awardNum,
                    file,
                    genus: data.genus || '',
                    species: data.species || '',
                    clone: data.clone || '',
                    award: data.award || ''
                });
            } else {
                exhibitorAnalysis.exhibitorStats.withExhibitor++;
                
                // Track exhibitor frequency
                const exhibitor = data.exhibitor.trim();
                if (!exhibitorAnalysis.exhibitorList[exhibitor]) {
                    exhibitorAnalysis.exhibitorList[exhibitor] = {
                        count: 0,
                        awards: []
                    };
                }
                exhibitorAnalysis.exhibitorList[exhibitor].count++;
                exhibitorAnalysis.exhibitorList[exhibitor].awards.push(awardNum);
            }
        }

        exhibitorAnalysis.summary = {
            exhibitorCoverage: (exhibitorAnalysis.exhibitorStats.withExhibitor / exhibitorAnalysis.totalFiles * 100).toFixed(1),
            uniqueExhibitors: Object.keys(exhibitorAnalysis.exhibitorList).length,
            mostActiveExhibitors: Object.entries(exhibitorAnalysis.exhibitorList)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 10)
                .map(([name, data]) => ({ name, awardCount: data.count }))
        };

        const outputPath = path.join(this.dataDir, `${this.year}-exhibitor-analysis.json`);
        await fs.writeJSON(outputPath, exhibitorAnalysis, { spaces: 2 });
        
        console.log(`✅ Exhibitor analysis complete. Report saved to: ${outputPath}`);
        console.log(`📊 ${exhibitorAnalysis.exhibitorStats.withExhibitor}/${exhibitorAnalysis.totalFiles} (${exhibitorAnalysis.summary.exhibitorCoverage}%) have exhibitor data`);
        
        return exhibitorAnalysis;
    }

    /**
     * Run comprehensive analysis (all functions)
     */
    async runComprehensiveAnalysis() {
        console.log(`🚀 Running comprehensive analysis for ${this.year}...`);
        
        const results = {
            timestamp: new Date().toISOString(),
            year: this.year,
            analyses: {}
        };

        try {
            results.analyses.categorizedIssues = await this.categorizeNullIssues();
            results.analyses.nullValues = await this.extractNullValues();
            results.analyses.exhibitorErrors = await this.generateAuthorErrors();

            const summaryPath = path.join(this.dataDir, `${this.year}-comprehensive-analysis.json`);
            await fs.writeJSON(summaryPath, results, { spaces: 2 });
            
            console.log(`\n🎉 Comprehensive analysis complete for ${this.year}!`);
            console.log(`📋 Summary report saved to: ${summaryPath}`);
            
            return results;
        } catch (error) {
            console.error(`❌ Error during analysis: ${error.message}`);
            throw error;
        }
    }
}

// Export for module use
module.exports = PCJCAnalysisToolkit;

// CLI usage
if (require.main === module) {
    const year = process.argv[2];
    
    if (!year) {
        console.log('Usage: node analysis-toolkit.js <year>');
        console.log('Example: node analysis-toolkit.js 2022');
        process.exit(1);
    }
    
    const toolkit = new PCJCAnalysisToolkit(year);
    
    // Check what analysis to run based on additional arguments
    const command = process.argv[3];
    
    if (command === 'categorize') {
        toolkit.categorizeNullIssues().catch(console.error);
    } else if (command === 'nulls') {
        toolkit.extractNullValues().catch(console.error);
    } else if (command === 'exhibitors') {
        toolkit.generateAuthorErrors().catch(console.error);
    } else {
        toolkit.runComprehensiveAnalysis().catch(console.error);
    }
}