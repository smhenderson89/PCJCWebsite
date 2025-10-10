# 2019 Awards Data Processing Scripts

This directory contains the essential scripts for processing and maintaining 2019 awards data.

## Scripts Overview

### 1. `analyze-2019-current-state.js`
**Purpose**: Analyzes the current state of 2019 JSON files and categorizes them by data quality.

**What it does**:
- Analyzes existing JSON files (does not overwrite them)
- Categorizes files as Perfect, Minor Issues, or Problematic
- Generates field completion statistics
- Creates detailed categorization file with specific issues

**When to use**: 
- After applying fixes to assess improvements
- To identify which files need attention
- To generate progress reports

**Output**: `2019-categorized-issues-updated.json`

---

### 2. `apply-2019-fix-strategies.js`
**Purpose**: Applies comprehensive fixes to extract missing award data from HTML sources.

**What it does**:
- Extracts award types and points (HCC 76, AM 85, etc.)
- Extracts complete measurement tables from HTML
- Adds cross information ("species" vs actual crosses)  
- Fills in missing location data where available
- Adds metadata tracking (fixes applied, timestamps)

**When to use**:
- After running analysis to fix identified issues
- When JSON files are missing key award data
- To restore data after accidental overwrites

**Requirements**: Needs `2019-categorized-issues.json` file from analysis

---

### 3. `download-2019-complete.js`
**Purpose**: Downloads HTML award files from the AOS Pacific Central website.

**What it does**:
- Downloads all 2019 award HTML files
- Organizes them by date folders
- Provides progress tracking and error handling
- Creates local copy for data extraction

**When to use**:
- Initial setup of 2019 data processing
- To refresh HTML sources if needed
- When expanding to process additional awards

**Output**: HTML files in `../../copilot/localCopy/paccentraljc.org/awards/2019/html/`

---

### 4. `fix-2019-source-url-format.js`
**Purpose**: Converts source URLs from simple format to standardized date-based format.

**What it does**:
- Converts: `https://www.paccentraljc.org/20194706.html`
- To: `https://www.paccentraljc.org/20190125/20194706.html`
- Uses award date to create proper YYYYMMDD format
- Maintains audit trail of URL changes

**When to use**:
- After applying fix strategies (URLs may revert to simple format)
- To standardize URL formats across years
- When integrating with other year datasets

---

## Typical Workflow

1. **Download HTML files** (if needed):
   ```bash
   node download-2019-complete.js
   ```

2. **Analyze current state**:
   ```bash
   node analyze-2019-current-state.js
   ```

3. **Apply fixes**:
   ```bash
   node apply-2019-fix-strategies.js
   ```

4. **Standardize URLs**:
   ```bash
   node fix-2019-source-url-format.js
   ```

5. **Re-analyze to verify improvements**:
   ```bash
   node analyze-2019-current-state.js
   ```

## Current Data Quality (as of latest analysis)

- **Total Files**: 106
- **Perfect Files**: 5 (4.7%)
- **Minor Issues**: 43 (40.6%) - mostly missing photographer
- **Problematic**: 58 (54.7%) - missing genus/species (HTML parsing limitation)

### Field Completion Rates
- **Award Information**: 94.3% ✅
- **Measurements**: 97.2% ✅  
- **Cross Information**: 100.0% ✅
- **Source URLs**: 100.0% ✅ (standardized format)
- **Genus/Species**: 48.1% (limited by HTML structure)

## Notes

- Always run analysis before applying fixes to get current categorization
- The fix strategies script is safe to run multiple times
- URL format fixes should be run after other fixes to ensure proper format
- Keep the categorization JSON files for tracking progress over time