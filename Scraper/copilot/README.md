# Orchid Award Scraper

A comprehensive toolkit for downloading and scraping orchid award data from AOS (American Orchid Society) websites.

## 🗂️ Project Structure

```
copilot/
├── localCopy/          # Website download tools
├── exampleScrap/       # HTML scraping tools  
├── package.json        # Project configuration
└── README.md          # This file
```

## 📥 Step 1: Download Website (localCopy/)

Tools for downloading entire orchid websites to create local copies:

- **wget scripts** - Fast, reliable website downloading
- **Node.js downloaders** - Programmatic website downloading  
- **Download guides** - Comprehensive documentation

```bash
cd localCopy
# Edit download-orchid-site.sh with your target URL
./download-orchid-site.sh
```

## � Step 2: Scrape Data (exampleScrap/)

Tools for extracting structured data from downloaded HTML files:

- **Cheerio-based scraper** - Parse HTML and extract orchid data
- **Batch processing** - Handle multiple files at once
- **Multiple output formats** - JSON, CSV, console stats

```bash
# Test single file
pnpm test

# Process all HTML files  
pnpm batch
```

## 🚀 Quick Start

### Installation
```bash
pnpm install
```

### Complete Workflow
1. **Download a website**: 
   ```bash
   cd localCopy
   # Edit download-orchid-site.sh first
   ./download-orchid-site.sh
   ```

2. **Move HTML files to scraper**:
   ```bash
   cp localCopy/orchid-awards-downloaded/**/*.html exampleScrap/exampleFile/
   ```

3. **Scrape the data**:
   ```bash
   pnpm batch
   ```

4. **Check results**:
   ```bash
   ls exampleScrap/output/
   ```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `pnpm test` | Test scraper on single HTML file |
| `pnpm scrape` | Same as test |  
| `pnpm batch` | Process all HTML files |
| `pnpm download` | Run wget download script |

## Data Structure

The scraper extracts the following information from each HTML file:

```json
{
  "title": "Cymbidium goeringii 'Pink Lady'",
  "date": "January 7, 2025",
  "location": "San Francisco",
  "orchidName": "Cymbidium goeringii 'Pink Lady'",
  "awardType": "HCC",
  "score": 77,
  "awardNumber": "20255350",
  "exhibitor": "Amy and Ken Jacobsen",
  "photographer": "Ken Jacobsen",
  "measurements": {
    "NS": 5.5,
    "NSV": 4.8,
    "DSW": 0.9,
    "DSL": 3.4,
    "PETW": 1.1,
    "PETL": 2.5,
    "LSW": 0.8,
    "LSL": 3.2,
    "LIPW": 0.9,
    "LIPL": 1.4
  },
  "flowerCounts": {
    "flowers": 1,
    "buds": 2,
    "inflorescences": 3
  },
  "description": "Detailed botanical description..."
}
```

## Output Files

When running batch processing, the scraper generates:

- **Individual JSON files**: One file per scraped HTML document
- **Combined JSON**: `all-awards.json` with all scraped data
- **CSV export**: `awards-data.csv` for spreadsheet analysis
- **Console summary**: Statistics about award types, locations, and scores

## Project Structure

```
├── orchid-scraper.js      # Main scraper class
├── test-scraper.js        # Single file test script
├── batch-scraper.js       # Batch processing script
├── package.json          # Package configuration
├── exampleFile/          # Input HTML files
│   └── 20255350.html
└── output/               # Generated output files
    ├── 20255350.json
    ├── all-awards.json
    └── awards-data.csv
```

## Measurement Abbreviations

The scraper recognizes these orchid measurement abbreviations:

- **NS**: Natural Spread
- **NSV**: Natural Spread Vertical
- **DSW**: Dorsal Sepal Width
- **DSL**: Dorsal Sepal Length
- **PETW**: Petal Width
- **PETL**: Petal Length
- **LSW**: Lateral Sepal Width
- **LSL**: Lateral Sepal Length
- **LIPW**: Lip Width
- **LIPL**: Lip Length

## Award Types

Common AOS award types that the scraper recognizes:

- **HCC**: Highly Commended Certificate (75-79 points)
- **AM**: Award of Merit (80-89 points)
- **FCC**: First Class Certificate (90+ points)
- **AQ**: Award of Quality

## Dependencies

- **cheerio**: jQuery-like server-side HTML parsing
- **fs-extra**: Enhanced file system operations

## Requirements

- Node.js 12+
- pnpm package manager

## License

ISC