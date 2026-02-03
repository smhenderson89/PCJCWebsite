# Thumbnail Generator

Generates optimized thumbnails for orchid award images with target file sizes of 15-30KB per thumbnail.

## Location
```bash
/Users/scotthenderson/Programming/Freelancing/Orchid Society/Github/PCJCWebsite/db/functions/
```

## Usage

### Basic Command
```bash
cd /Users/scotthenderson/Programming/Freelancing/Orchid\ Society/Github/PCJCWebsite/db/functions
node thumbnail-generator.js [year]
```

### Examples
```bash
# Generate thumbnails for 2024 (default year)
node thumbnail-generator.js

# Generate thumbnails for 2025
node thumbnail-generator.js 2025

# Generate thumbnails for 2026
node thumbnail-generator.js 2026

# Generate thumbnails for any specific year
node thumbnail-generator.js 2023
```

## What It Does

1. **📊 Queries Database**: Gets all awards for the specified year with photos (excludes low-quality thumb.jpg files)
2. **🔍 Checks Existing**: Skips awards that already have thumbnails generated
3. **🖼️ Generates Multiple Formats**:
   - **JPEG Small**: 300x400px, ~20KB target
   - **JPEG Medium**: 500x667px, ~25KB target  
   - **WebP Small**: 300x400px, ~14KB target (30% smaller than JPEG)
   - **WebP Medium**: 500x667px, ~18KB target (30% smaller than JPEG)
4. **🎯 Optimizes File Size**: Automatically adjusts quality to hit target file sizes
5. **📁 Organizes Output**: Saves to structured directories

## Output Structure
```
db/thumbnails/
├── jpeg/
│   ├── small/     # 300x400 JPEG thumbnails (~20KB each)
│   └── medium/    # 500x667 JPEG thumbnails (~25KB each)
└── webp/
    ├── small/     # 300x400 WebP thumbnails (~14KB each)
    └── medium/    # 500x667 WebP thumbnails (~18KB each)
```

## File Naming
- Thumbnails are named using the award number: `20255001.jpg`, `20255001.webp`
- Original photos remain unchanged

## Progress Tracking
- Shows real-time processing progress: `[25/150] Processing Award 20255025...`
- Progress summaries every 20 items processed
- Final summary with statistics

## Performance Features
- **Smart Skipping**: Won't regenerate existing thumbnails
- **Quality Optimization**: Automatically adjusts quality (20-95%) to hit target file sizes
- **Batch Processing**: Handles hundreds of images efficiently
- **Memory Management**: Brief pauses every 10 images to prevent system overload
- **Error Recovery**: Continues processing even if individual images fail

## Requirements
- **Node.js**: Version 14+
- **Sharp**: Image processing library (auto-installed with `npm install sharp`)
- **Database**: SQLite database with awards table
- **Images**: Original images must exist in `db/images/` directory

## Database Integration
After generating thumbnails, integrate them into the database:

```bash
# Add thumbnail paths to database
cd /Users/scotthenderson/Programming/Freelancing/Orchid\ Society/Github/PCJCWebsite/db/functions
node thumbnail-utils.js integrate
```

## Common Workflows

### Generate thumbnails for new year
```bash
# 1. Generate thumbnails
node thumbnail-generator.js 2026

# 2. Integrate into database
node thumbnail-utils.js integrate

# 3. Check results
node thumbnail-utils.js check 20266001 20266002
```

### Re-process specific year
```bash
# Delete existing thumbnails first (if needed)
rm -rf /path/to/db/thumbnails/*/small/20255*.{jpg,webp}
rm -rf /path/to/db/thumbnails/*/medium/20255*.{jpg,webp}

# Regenerate
node thumbnail-generator.js 2025
```

## Troubleshooting

### "Sharp not installed"
```bash
cd /Users/scotthenderson/Programming/Freelancing/Orchid\ Society/Github/PCJCWebsite/db
npm install sharp
```

### "Invalid year" error
- Year must be between 2000 and current year
- Must be a valid integer

### "Image not found" warnings
- Check that original images exist in `db/images/`
- Verify photo paths in database are correct
- Excludes `thumb.jpg` files automatically

### Low success rate
- Check file permissions on `db/thumbnails/` directory
- Ensure sufficient disk space
- Verify Sharp library is properly installed

## Output Statistics
The generator provides detailed statistics:
- **Processing counts**: Success, skipped, errors, not found
- **File size analysis**: Original vs JPEG vs WebP compression ratios
- **Space savings**: Percentage reduction from originals

## Related Commands
- `node thumbnail-utils.js integrate` - Add thumbnail paths to database
- `node thumbnail-utils.js check [awardNums...]` - Check thumbnail status
- `node thumbnail-utils.js scan` - Scan for existing thumbnails