# 2025 PCJC Awards Analysis - Essential Utilities

This folder contains the essential utilities for analyzing 2025 PCJC orchid awards data.

## Essential Files (3 total):

### 1. `analyze-2025-final.js`
- **Purpose**: Final comprehensive analysis tool for 2025 award data
- **Features**: 
  - Complete data quality assessment and reporting
  - Advanced statistical analysis and pattern detection  
  - Issue identification and categorization
- **Usage**: `node analyze-2025-final.js`
- **Output**: Creates comprehensive analysis reports and data summaries

### 2. `analyze-2025-smart-conflicts.js`
- **Purpose**: Advanced conflict detection and resolution analysis
- **Features**:
  - Intelligent conflict identification between data sources
  - Smart resolution recommendations for data discrepancies
  - Advanced pattern matching for complex data relationships
  - Sophisticated duplicate and inconsistency detection
- **Usage**: `node analyze-2025-smart-conflicts.js`
- **Dependencies**: Requires 2025 data for conflict analysis

### 3. `fix-2025-source-urls.js`
- **Purpose**: Fix source URL structure to reflect actual website architecture
- **Features**:
  - Updates sourceUrl from generic `/awards/` format to specific `/YYMMDD/awardNum.html` format
  - Automatic date parsing and YYMMDD conversion (e.g., "February 15, 2025" → "250215")
  - Creates backups before modifications and detailed correction tracking
  - Adds correction entries to track all sourceUrl changes
- **Usage**: `node fix-2025-source-urls.js`
- **Results**: ✅ **COMPLETED** - All 96 files successfully updated (100% success rate)

## Workflow:
Extract data → Final analysis → Smart conflict resolution → Quality reporting

## Status: 
✅ Essential production utilities (cleaned from 8 original files)
✅ Source URL corrections complete (96/96 files updated)
🎯 Advanced analysis with sophisticated conflict resolution for 2025
📋 Ready for 2025 data processing with intelligent quality improvements
🚀 Most advanced analysis pipeline with smart conflict detection