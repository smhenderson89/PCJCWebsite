# 2021 PCJC Awards Analysis - Essential Utilities

This folder contains the essential utilities for analyzing 2021 PCJC orchid awards data, adapted from the successful 2022 workflow.

## Essential Files (4 total):

### 1. `extract-2021-ENHANCED-display-aware.js`
- **Purpose**: Extract structured JSON data from 2021 HTML award files
- **Features**: 
  - Advanced parsing with display award detection
  - Comprehensive error handling and validation
  - Extracts all award details, measurements, parentage, etc.
- **Usage**: `node extract-2021-ENHANCED-display-aware.js`
- **Output**: Creates JSON files in `savedData/2021/json/`

### 2. `analyze-2021-comprehensive-final.js` 
- **Purpose**: Analyze extracted 2021 data for quality issues and patterns
- **Features**:
  - Identifies null/missing data patterns
  - Categorizes data quality issues
  - Generates comprehensive analysis reports
- **Usage**: `node analyze-2021-comprehensive-final.js`
- **Output**: Creates analysis reports in `analysis/`

### 3. `categorize-2021-issues.js`
- **Purpose**: Categorize and organize data quality issues found in analysis
- **Features**:
  - Groups issues by type (recoverable, problematic, etc.)
  - Creates structured issue reports for manual review
- **Usage**: `node categorize-2021-issues.js`
- **Dependency**: Requires analysis output from step 2

### 4. `apply-2021-corrections.js`
- **Purpose**: Apply manual corrections identified from analysis
- **Features**:
  - Fixes specific data quality issues
  - Updates problematic awards with correct values
  - Maintains correction history
- **Usage**: Modify correction mapping in file, then `node apply-2021-corrections.js`
- **Dependency**: Requires categorized issues from step 3

## Workflow:
1. Extract data → 2. Analyze → 3. Categorize issues → 4. Apply corrections

## Status: 
✅ Scripts adapted from successful 2022 workflow  
🎯 Ready to process 2021 data (65 HTML files + 100 images available)
📋 Based on proven methodology that successfully processed 2022 data

## Prerequisites:
- 2021 HTML files downloaded ✅ (completed previously)
- 2021 images downloaded ✅ (completed previously)  
- Node.js with cheerio and fs-extra dependencies

## Data Source:
- HTML files: `localCopy/paccentraljc.org/awards/2021/html/` (65 files)
- Images: `localCopy/paccentraljc.org/awards/2021/images/` (100 files)