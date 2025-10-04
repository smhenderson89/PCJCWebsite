#!/bin/bash

# Orchid Award Site Downloader
# This script downloads HTML files from an orchid award website
# Edit the WEBSITE_URL variable below to match your target site

# =============================================================================
# CONFIGURATION - EDIT THESE VALUES
# =============================================================================

WEBSITE_URL="https://your-orchid-site.com"  # 🔴 CHANGE THIS URL
OUTPUT_DIR="./orchid-awards-downloaded"
LOG_FILE="./download.log"

# =============================================================================
# WGET COMMAND BREAKDOWN
# =============================================================================

echo "🌐 Downloading orchid awards from: $WEBSITE_URL"
echo "📁 Output directory: $OUTPUT_DIR"
echo "📋 Log file: $LOG_FILE"
echo ""

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Starting download... (this may take a while)"
echo "⏱️  Using 2-second delays between requests to be respectful"
echo ""

wget \
  --recursive \
  --level=5 \
  --no-clobber \
  --page-requisites \
  --html-extension \
  --convert-links \
  --restrict-file-names=windows \
  --domains=$(echo $WEBSITE_URL | sed 's/https\?:\/\///g' | cut -d'/' -f1) \
  --no-parent \
  --wait=2 \
  --random-wait \
  --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" \
  --directory-prefix="$OUTPUT_DIR" \
  --output-file="$LOG_FILE" \
  --reject="jpg,jpeg,png,gif,pdf,css,js,ico,svg,woff,woff2,ttf,eot,mp4,mp3,avi,mov,wmv,flv,swf,zip,tar,gz,rar,exe,dmg,pkg" \
  "$WEBSITE_URL"

echo ""
echo "✅ Download complete!"
echo "📁 Files saved to: $OUTPUT_DIR"
echo "📋 Check log file for details: $LOG_FILE"
echo ""
echo "📊 Quick stats:"
find "$OUTPUT_DIR" -name "*.html" -o -name "*.htm" | wc -l | xargs echo "HTML files downloaded:"
du -sh "$OUTPUT_DIR" | cut -f1 | xargs echo "Total size:"