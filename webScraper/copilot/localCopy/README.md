# localCopy - Website Download Tools

This folder contains tools for downloading entire websites to create local copies for scraping practice.

## 📁 Files in this folder:

### Core Download Tools
- **`download-orchid-site.sh`** - Production-ready wget script for downloading orchid sites
- **`download-website.sh`** - General wget script template
- **`website-downloader.js`** - Node.js based website downloader
- **`download-example.js`** - Usage examples for Node.js downloader

### Documentation
- **`DOWNLOAD_GUIDE.md`** - Comprehensive guide to different download methods
- **`test-single-page.html`** - Test file to verify wget is working

## 🚀 Quick Start

1. **Edit the URL** in `download-orchid-site.sh`:
   ```bash
   WEBSITE_URL="https://your-orchid-site.com"  # Change this line
   ```

2. **Run the download**:
   ```bash
   cd localCopy
   ./download-orchid-site.sh
   ```

3. **Files will be saved to**:
   ```
   localCopy/
   ├── orchid-awards-downloaded/  # Downloaded website files
   └── download.log              # Download progress log
   ```

## 🛠️ Available Methods

- **wget** (Recommended) - Fast, reliable, built-in rate limiting
- **Node.js** - Programmatic control, integrates with existing setup
- **HTTrack** - User-friendly GUI option
- **Puppeteer** - For JavaScript-heavy sites

## ⚙️ Configuration

All download scripts include:
- ✅ **2-second delays** between requests (respectful)
- ✅ **HTML-only filtering** (skips images, CSS, JS)
- ✅ **Domain restrictions** (stays on target site)
- ✅ **Resume capability** (can continue interrupted downloads)
- ✅ **User-Agent spoofing** (appears as regular browser)

## 📋 Before Downloading

1. Check the site's `robots.txt`: `https://site.com/robots.txt`
2. Start with a small test (2-3 levels deep)
3. Verify your scraper works on test files
4. Scale up to full download

## 🎯 Next Steps

After downloading:
1. Move HTML files to `../exampleScrap/exampleFile/`
2. Test your scraper with: `cd .. && pnpm test`
3. Process all files with: `cd .. && pnpm batch`