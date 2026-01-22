#!/bin/bash
# Website Download Script using wget

# Configuration
WEBSITE_URL="https://example-orchid-site.com"
OUTPUT_DIR="./downloaded-site"
LOG_FILE="./download.log"

echo "🌐 Downloading website: $WEBSITE_URL"
echo "📁 Output directory: $OUTPUT_DIR"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Download entire website
wget \
  --recursive \
  --level=0 \
  --no-clobber \
  --page-requisites \
  --html-extension \
  --convert-links \
  --restrict-file-names=windows \
  --domains=$(echo $WEBSITE_URL | sed 's/https\?:\/\///g' | cut -d'/' -f1) \
  --no-parent \
  --wait=1 \
  --random-wait \
  --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  --directory-prefix="$OUTPUT_DIR" \
  --output-file="$LOG_FILE" \
  "$WEBSITE_URL"

echo "✅ Download complete! Check $OUTPUT_DIR for files"
echo "📋 Log file: $LOG_FILE"