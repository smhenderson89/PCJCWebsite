/**
 * Thumbnail Integration Utilities
 * Helper script for managing thumbnail database integration
 */

const ThumbnailDatabaseIntegration = require('./thumbnail-database-integration.js');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const integration = new ThumbnailDatabaseIntegration();

  try {
    switch (command) {
      case 'integrate':
        console.log('Running full thumbnail integration...');
        await integration.integrateAllThumbnails();
        break;

      case 'check':
        const awardNums = args.slice(1);
        if (awardNums.length > 0) {
          console.log(`Checking thumbnails for awards: ${awardNums.join(', ')}`);
          integration.checkThumbnailStatus(awardNums);
        } else {
          console.log('Checking thumbnail status for sample 2025 awards...');
          integration.checkThumbnailStatus();
        }
        integration.close();
        break;

      case 'columns':
        console.log('Adding thumbnail columns to database...');
        await integration.addThumbnailColumns();
        integration.close();
        break;

      case 'scan':
        console.log('Scanning for existing thumbnails...');
        const thumbnails = await integration.findExistingThumbnails();
        console.log(`\nFound ${thumbnails.length} complete thumbnail sets:`);
        thumbnails.slice(0, 5).forEach(t => {
          console.log(`  Award ${t.awardNum}: ${t.jpegSmall}, ${t.webpSmall}`);
        });
        if (thumbnails.length > 5) {
          console.log(`  ... and ${thumbnails.length - 5} more`);
        }
        integration.close();
        break;

      default:
        console.log('Thumbnail Integration Utilities');
        console.log('===============================');
        console.log('Usage: node thumbnail-utils.js <command> [args]');
        console.log('');
        console.log('Commands:');
        console.log('  integrate              - Run complete thumbnail database integration');
        console.log('  check [awardNum...]    - Check thumbnail status for specific awards');
        console.log('  columns                - Add thumbnail columns to database');
        console.log('  scan                   - Scan for existing thumbnail files');
        console.log('');
        console.log('Examples:');
        console.log('  node thumbnail-utils.js integrate');
        console.log('  node thumbnail-utils.js check 20255250 20255251');
        console.log('  node thumbnail-utils.js scan');
        integration.close();
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
    integration.close();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };