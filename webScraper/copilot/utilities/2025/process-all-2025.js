const ComprehensiveAwardProcessor = require('./comprehensive-processor');
const path = require('path');

async function processAll2025Awards() {
    console.log('🚀 Starting Comprehensive 2025 Awards Processing\n');
    
    // Path to the 2025.html index file
    const indexHtmlPath = path.join(__dirname, '..', 'localCopy', 'paccentraljc.org', 'awards', '2025', '2025.html');
    
    try {
        const processor = new ComprehensiveAwardProcessor(indexHtmlPath);
        await processor.processAllAwards();
        
        console.log('\n🎉 All 2025 awards have been comprehensively processed!');
        console.log('\n📁 Check your results in:');
        console.log('   📂 savedData/2025/images/ - All orchid images');
        console.log('   📂 savedData/2025/json/ - Individual award JSON files');
        console.log('   📄 savedData/2025/json/all-awards.json - Complete dataset');
        console.log('   📊 savedData/2025/json/award-statistics.json - Summary statistics');
        
    } catch (error) {
        console.error('❌ Error in comprehensive processing:', error);
        console.error(error.stack);
    }
}

if (require.main === module) {
    processAll2025Awards().catch(console.error);
}

module.exports = { processAll2025Awards };