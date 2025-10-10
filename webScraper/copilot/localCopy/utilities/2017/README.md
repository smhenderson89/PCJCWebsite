# 2017 Awards Processing

## Status: Ready for Processing

Scripts prepared for 2017 awards data processing following the successful patterns from 2018-2022.

## Processing Steps:

### 1. Download HTML Files and Images
```bash
node download-2017-complete.js
```

**Features:**
- Downloads main 2017 index page
- Downloads all date directory pages (YYYYMMDD format)
- Downloads individual award pages (20174XXX format)
- Downloads all associated images (thumbnails and full-size)
- Creates comprehensive download report

### 2. Source URL Standardization (Next Step)
- Convert source URLs to YYYYMMDD format for consistency
- Follow pattern from 2018-2022 processing

### 3. Enhanced Data Extraction (Next Step)
- Extract award data from HTML files
- Parse measurements from HTML tables
- Handle cross field corruption detection
- Apply automated fix strategies

## Expected Structure:
```
2017/
├── html/           # Downloaded HTML files
│   ├── 2017.html   # Main index page
│   ├── images/     # Index page images
│   ├── 20170103/   # Date directories
│   │   ├── 20170103.html
│   │   ├── 20174115.html
│   │   ├── 20174116.html
│   │   └── *.jpg   # Award images
│   └── 20170113/   # More date directories...
├── data/           # Processing reports and JSON files
│   └── download-report.json
└── utilities/      # Processing scripts (this folder)
```

## 2017 Specific Notes:

**Award Number Pattern**: 20174XXX (4-digit sequence starting with 4)
**Date Pattern**: YYYYMMDD (e.g., 20170103, 20170113)
**Image Types**: Thumbnails (*thumb.jpg) and full-size images

**Based on index page analysis:**
- Multiple monthly judging sessions (San Francisco, Oakland)
- Various orchid society shows throughout the year
- Some sessions with no awards (noted in index)

## Success Expectations:
Based on 2018-2022 performance patterns:
- **Download Success**: 95%+ (comprehensive HTML and image download)
- **Data Quality**: 90%+ perfect files after processing
- **Processing Time**: ~1-2 hours for complete year

## Next Steps After Download:
1. Run analysis to understand data quality
2. Apply source URL standardization  
3. Extract and fix award data
4. Generate comprehensive quality report