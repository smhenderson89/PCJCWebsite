const { WebsiteDownloader, URLListDownloader } = require('./website-downloader');

async function main() {
    console.log('🌺 Orchid Website Downloader\n');
    
    // Option 1: Download entire site (crawling)
    const siteDownloader = new WebsiteDownloader({
        baseUrl: 'https://example-orchid-site.com', // Replace with actual URL
        outputDir: './downloaded-site',
        delay: 2000, // 2 second delay between requests
        maxPages: 50 // Limit for testing
    });
    
    // Option 2: Download specific URLs (if you have a list)
    const specificUrls = [
        'https://example-orchid-site.com/awards/2024/award1.html',
        'https://example-orchid-site.com/awards/2024/award2.html',
        'https://example-orchid-site.com/awards/2025/award3.html'
        // Add more URLs as needed
    ];
    
    const urlDownloader = new URLListDownloader({
        outputDir: './downloaded-pages',
        delay: 1500 // 1.5 second delay
    });
    
    // Choose your download method:
    
    // Method 1: Crawl entire site
    // await siteDownloader.downloadSite('https://example-orchid-site.com');
    
    // Method 2: Download specific URLs
    // await urlDownloader.downloadUrls(specificUrls);
    
    console.log('⚠️  Please edit this script to set the correct URL and uncomment the download method you want to use.');
    console.log('📝 Edit the baseUrl and URLs in download-example.js');
}

// Example usage for different scenarios:
async function downloadAwardsSection() {
    console.log('📋 Downloading Awards Section Only\n');
    
    const downloader = new WebsiteDownloader({
        baseUrl: 'https://your-orchid-site.com',
        outputDir: './orchid-awards',
        delay: 2000,
        maxPages: 100
    });
    
    // Start from awards section
    await downloader.downloadSite('https://your-orchid-site.com/awards/');
}

async function downloadFromSitemap() {
    console.log('🗺️  Downloading from URL list (like sitemap)\n');
    
    // If you have extracted URLs from a sitemap or other source
    const urls = [
        // Add your URLs here
    ];
    
    const downloader = new URLListDownloader({
        outputDir: './sitemap-downloads',
        delay: 1000
    });
    
    await downloader.downloadUrls(urls);
}

// Run the main function
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, downloadAwardsSection, downloadFromSitemap };