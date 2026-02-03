# Database Migration Scripts

This directory contains migration scripts for managing the orchid awards database. These scripts handle JSON data import and date format standardization.

## Scripts Overview

| Script | Purpose | Usage | Frequency |
|--------|---------|-------|-----------|
| `migrate.js` | Import JSON awards data | `node migrate.js [year]` | When adding new award data |
| `update-iso-dates.js` | Convert dates to ISO format | `node update-iso-dates.js` | After importing new data |

---

## migrate.js

### Purpose
Imports orchid award data from JSON files into the SQLite database. Handles duplicate detection and batch processing.

### Features
- ✅ **Flexible year selection** - Process all years or specific year
- ✅ **Duplicate prevention** - Skips existing awards automatically  
- ✅ **Batch processing** - Handles large datasets efficiently
- ✅ **Comprehensive reporting** - Detailed statistics and error tracking
- ✅ **Safe operation** - Won't overwrite existing data

### Usage

```bash
# Import all years (2015-2025)
node migrate.js

# Import specific year
node migrate.js 2026
node migrate.js 2025
node migrate.js 2024

# Check what years are available
ls ../../scraper/copilot/localCopy/paccentraljc.org/awards/
```

### Data Source
Reads JSON files from: `../../scraper/copilot/localCopy/paccentraljc.org/awards/[year]/data/json/`

### Output Example
```
🔄 MIGRATING JSON DATA TO SQLITE DATABASE
============================================================
📁 Base data path: /path/to/awards
🗄️  Database path: /path/to/orchid_awards.sqlite

🎯 Processing only year: 2026

📅 Processing year 2026...
   Found 6 awards for 2026
   ✅ [1/6] Inserted 20265300
   ✅ [2/6] Inserted 20265301
   ⏭️  [3/6] Skipped 20265302 (already exists)
   ...

📊 MIGRATION SUMMARY
   Total awards found: 6
   Successfully inserted: 5
   Skipped duplicates: 1
   Failed inserts: 0
   Overall success rate: 100.0%
```

### When to Use
- **New award data**: After downloading new JSON files for any year
- **Database setup**: Initial population of the database
- **Data recovery**: Re-importing after database issues
- **Incremental updates**: Adding new awards safely

---

## update-iso-dates.js

### Purpose
Converts human-readable dates (like "January 2, 2024") to ISO format (like "2024-01-02") for proper database sorting and consistency.

### Features
- ✅ **Smart scanning** - Only processes awards missing ISO dates
- ✅ **Safe execution** - Won't overwrite existing ISO dates
- ✅ **Progress tracking** - Shows progress every 50 awards
- ✅ **Error resilience** - Continues processing if some dates fail
- ✅ **Verification** - Shows sample results and remaining work

### Usage

```bash
# Process all awards missing ISO dates
node update-iso-dates.js

# No parameters needed - scans entire database automatically
```

### Output Example
```
📅 UPDATING ISO DATES FOR ALL AWARDS
============================================================
🔍 Scanning database for awards missing ISO dates...
📊 Awards needing ISO dates: 156

🔄 Processing awards...
📊 Progress: 50/156 awards processed
✅ Updated 20265300: "January 2, 2024" → 2024-01-02
✅ Updated 20265301: "February 15, 2024" → 2024-02-15
...

📊 FINAL PROCESSING SUMMARY:
✅ Successfully processed: 150 awards  
⏭️ Skipped (already exist): 6 awards
❌ Processing errors: 0 awards

🔍 Awards still missing ISO dates: 0
```

### When to Use
- **After migrate.js**: Run after importing new JSON data
- **Data cleanup**: When dates are inconsistent
- **Regular maintenance**: Periodically to ensure all dates are standardized
- **Before website deployment**: Ensure proper date sorting

---

## Recommended Workflow

### Adding New Awards (e.g., 2026)

1. **Download/prepare JSON files** in the correct directory structure:
   ```
   scraper/copilot/localCopy/paccentraljc.org/awards/2026/data/json/
   ├── 20265300.json
   ├── 20265301.json
   └── ...
   ```

2. **Import the data**:
   ```bash
   cd /path/to/db/migrations
   node migrate.js 2026
   ```

3. **Standardize dates**:
   ```bash
   node update-iso-dates.js
   ```

4. **Generate thumbnails** (if needed):
   ```bash
   cd ../functions
   node thumbnail-generator.js 2026
   node thumbnail-database-integration.js
   ```

### Database Recovery

1. **Full re-import**:
   ```bash
   # Import all years
   node migrate.js
   
   # Standardize all dates
   node update-iso-dates.js
   ```

---

## File Locations

- **Scripts**: `/db/migrations/`
- **Database**: `/db/orchid_awards.sqlite`
- **JSON Data**: `/scraper/copilot/localCopy/paccentraljc.org/awards/[year]/data/json/`
- **Reports**: Generated in `/db/migrations/` directory

---

## Error Handling

Both scripts include comprehensive error handling:

- **File not found**: Scripts will report missing directories/files and continue
- **Invalid JSON**: Parse errors are logged but don't stop processing
- **Database errors**: Individual record failures are tracked and reported
- **Duplicate data**: Safely detected and skipped

---

## Reports Generated

### migrate.js
- `migration-report.json` - Detailed import statistics and any errors

### update-iso-dates.js  
- `update-iso-dates-report.json` - Date conversion statistics and results

---

## Troubleshooting

### "Directory not found" errors
- Check that JSON files exist in the expected directory structure
- Verify the year parameter is correct
- Ensure scraper has completed for that year

### "Database locked" errors
- Close any other database connections
- Stop the website if it's running
- Wait a few seconds and try again

### Date parsing failures
- Some dates may not be in a recognizable format
- Check the report files for specific failed dates
- These can often be manually corrected in the source JSON files

---

## Dependencies

- `better-sqlite3` - Database driver
- `fs` - File system operations  
- `path` - Path utilities

All dependencies are automatically installed with the project.