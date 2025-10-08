# 2020 PCJC Awards Analysis - Essential Utilities

This folder contains the essential utilities for analyzing 2020 PCJC orchid awards data, adapted from the successful 2022 workflow.

## Essential Files (5 total):

### 1. `extract-2020-ENHANCED-display-aware.js`
- **Purpose**: Extract structured JSON data from 2020 HTML award files
- **Features**: 
  - Advanced parsing with display award detection
  - Comprehensive error handling and validation
  - Extracts all award details, measurements, parentage, etc.
- **Usage**: `node extract-2020-ENHANCED-display-aware.js`
- **Output**: Creates JSON files in `savedData/2020/json/`

### 2. `analyze-2020-comprehensive-final.js` 
- **Purpose**: Analyze extracted 2020 data for quality issues and patterns
- **Features**:
  - Identifies null/missing data patterns
  - Categorizes data quality issues
  - Generates comprehensive analysis reports
- **Usage**: `node analyze-2020-comprehensive-final.js`
- **Output**: Creates analysis reports in `analysis/`

### 3. `categorize-2020-issues.js`
- **Purpose**: Categorize and organize data quality issues found in analysis
- **Features**:
  - Groups issues by type (recoverable, problematic, etc.)
  - Creates structured issue reports for manual review
- **Usage**: `node categorize-2020-issues.js`
- **Dependency**: Requires analysis output from step 2

### 4. `apply-2020-corrections.js`
- **Purpose**: Apply manual corrections identified from analysis
- **Features**:
  - Fixes specific data quality issues
  - Updates problematic awards with correct values
  - Maintains correction history
- **Usage**: Modify correction mapping in file, then `node apply-2020-corrections.js`
- **Dependency**: Requires categorized issues from step 3

### 5. `fix-2020-source-urls.js`
- **Purpose**: Fix source URL structure to reflect actual website architecture
- **Features**:
  - Updates sourceUrl from generic `/awards/` format to specific `/YYMMDD/awardNum.html` format
  - Automatic date parsing and YYMMDD conversion (e.g., "September 07, 2020" → "210907")
  - Creates backups before modifications and detailed correction tracking
  - Adds correction entries to track all sourceUrl changes
- **Usage**: `node fix-2020-source-urls.js`
- **Results**: ✅ **COMPLETED** - All 50 files successfully updated (100% success rate)

## Workflow:
1. Extract data → 2. Analyze → 3. Categorize issues → 4. Apply corrections → 5. Fix source URLs

## Status: 
✅ Scripts adapted from successful 2022 workflow  
✅ Source URL corrections complete (50/50 files updated)
🎯 Ready to process 2020 data (65 HTML files + 100 images available)
📋 Based on proven methodology that successfully processed 2022 data

## Prerequisites:
- 2020 HTML files downloaded ✅ (completed previously)
- 2020 images downloaded ✅ (completed previously)  
- Node.js with cheerio and fs-extra dependencies

## Data Source:
- HTML files: `localCopy/paccentraljc.org/awards/2020/html/` (65 files)
- Images: `localCopy/paccentraljc.org/awards/2020/images/` (100 files)