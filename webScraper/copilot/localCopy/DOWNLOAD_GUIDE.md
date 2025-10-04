# Website Download Guide for Orchid Award Scraping

This guide covers different methods to download an entire website for local HTML scraping.

## Method 1: wget (Recommended for Most Cases)

### Installation (macOS)
```bash
# Install via Homebrew
brew install wget
```

### Basic Usage
```bash
# Simple recursive download
wget --recursive --no-clobber --page-requisites --html-extension --convert-links --restrict-file-names=windows --domains=yoursite.com --no-parent https://yoursite.com

# With rate limiting (be respectful!)
wget --recursive --wait=1 --random-wait --no-clobber --page-requisites --html-extension --convert-links --domains=yoursite.com --no-parent https://yoursite.com
```

### Advanced wget Script
Use the `download-website.sh` script in this directory:

```bash
# Make executable and run
chmod +x download-website.sh
./download-website.sh
```

**Pros:**
- ✅ Built-in rate limiting
- ✅ Handles redirects and links
- ✅ Preserves directory structure  
- ✅ Converts links for offline browsing
- ✅ Very reliable and battle-tested

**Cons:**
- ❌ Can't handle JavaScript-rendered content
- ❌ May struggle with complex authentication

## Method 2: HTTrack

### Installation
```bash
# macOS
brew install httrack

# Or download GUI version from https://www.httrack.com/
```

### Usage
```bash
# Command line
httrack "https://yoursite.com" -O "./downloaded-site" -r6 -w

# Or use the GUI application
httrack
```

**Pros:**
- ✅ User-friendly GUI option
- ✅ Excellent for complex sites
- ✅ Built-in duplicate detection
- ✅ Resume interrupted downloads

**Cons:**
- ❌ Larger installation
- ❌ Can be overkill for simple sites

## Method 3: Node.js with website-scraper

### Installation
```bash
pnpm add website-scraper axios
```

### Usage
Create a Node.js script:

```javascript
const scrape = require('website-scraper');

const options = {
  urls: ['https://yoursite.com'],
  directory: './downloaded-site',
  recursive: true,
  maxRecursiveDepth: 10,
  filenameGenerator: 'bySiteStructure',
  request: {
    delay: 1000 // 1 second delay between requests
  }
};

scrape(options).then(() => {
  console.log('Website downloaded successfully!');
}).catch(console.error);
```

**Pros:**
- ✅ Integrates with your existing Node.js setup
- ✅ Programmatic control
- ✅ Can customize download behavior

**Cons:**
- ❌ May need additional configuration
- ❌ JavaScript rendering requires Puppeteer

## Method 4: Puppeteer (For JavaScript-Heavy Sites)

If the orchid site uses JavaScript to load content:

```bash
pnpm add puppeteer
```

```javascript
const puppeteer = require('puppeteer');
const fs = require('fs-extra');

async function downloadSite() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Navigate and wait for content to load
  await page.goto('https://yoursite.com', { waitUntil: 'networkidle2' });
  
  // Get the HTML after JavaScript execution
  const html = await page.content();
  await fs.writeFile('./page.html', html);
  
  await browser.close();
}
```

## Method 5: curl + sitemap.xml (Targeted Approach)

If the site has a sitemap:

```bash
# Download sitemap
curl https://yoursite.com/sitemap.xml > sitemap.xml

# Extract URLs and download each
grep -oP '(?<=<loc>)[^<]+' sitemap.xml | while read url; do
  echo "Downloading: $url"
  curl -o "$(basename $url).html" "$url"
  sleep 1 # Be respectful
done
```

## Best Practices

### 1. Be Respectful
- **Add delays** between requests (1-2 seconds minimum)
- **Check robots.txt** first: `https://yoursite.com/robots.txt`
- **Use appropriate User-Agent** strings
- **Don't overwhelm** the server

### 2. Optimize for Your Use Case

For **orchid award pages**, you might want:
```bash
# Only download HTML files, skip images/CSS
wget --recursive --accept=html --domains=yoursite.com --wait=1 https://yoursite.com

# Or target specific patterns
wget --recursive --accept-regex='.*award.*\.html' --domains=yoursite.com --wait=1 https://yoursite.com
```

### 3. Organize Downloaded Files

Structure for your scraper:
```
downloaded-site/
├── awards/
│   ├── 2024/
│   │   ├── 20255350.html
│   │   └── 20255351.html
│   └── 2025/
└── sitemap.xml
```

## Recommended Workflow

1. **Start small**: Download a few pages first to test your scraper
2. **Use wget**: Most reliable for static HTML sites
3. **Add rate limiting**: `--wait=1 --random-wait`
4. **Organize output**: Use `--directory-prefix` to keep files organized
5. **Test scraper**: Verify your scraper works on downloaded files
6. **Scale up**: Download the full site once scraper is working

## Example for Orchid Sites

```bash
# Conservative approach for orchid award sites
wget \
  --recursive \
  --level=3 \
  --wait=2 \
  --random-wait \
  --accept=html \
  --reject=jpg,jpeg,png,gif,pdf,css,js \
  --domains=aos.org \
  --no-parent \
  --user-agent="Mozilla/5.0 (compatible; OrchidScraper/1.0)" \
  --directory-prefix="./orchid-awards" \
  https://aos.org/awards
```

This approach downloads only HTML files, waits 1-3 seconds between requests, and stays within the awards section.