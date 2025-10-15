/* Look at downloaded .html files, located where 
there are multiple awards are given, pointing to an index file for the 
event rather than the actual event*/

const fs = require('fs');
const path = require('path');

// Paths
const htmlDir = path.resolve(path.join(__dirname, '../../paccentraljc.org/awards/2016/html'));

console.log('🔧 Renaming 2016 index files to avoid conflicts...\n');

// Look for possible awards that would denote an index file
const possibleAwards = [
  { "code": "FCC", "fullName": "First Class Certificate" },
  { "code": "AM",  "fullName": "Award of Merit" },
  { "code": "HCC", "fullName": "Highly Commended Certificate" },
  { "code": "JC",  "fullName": "Judges’ Commendation" },
  { "code": "AD",  "fullName": "Award of Distinction" },
  { "code": "AQ",  "fullName": "Award of Quality" },
  { "code": "CBR", "fullName": "Certificate of Botanical Recognition" },
  { "code": "CHM", "fullName": "Certificate of Horticultural Merit" },
  { "code": "CCM", "fullName": "Certificate of Cultural Merit" },
  { "code": "CCE", "fullName": "Certificate of Cultural Excellence" },
  { "code": "SC",  "fullName": "Silver Certificate" },
  { "code": "ST",  "fullName": "Show Trophy" },
  { "code": "GC",  "fullName": "Gold Certificate" },             /* display award */
  { "code": "EEC", "fullName": "Educational Exhibit Certificate" },
  { "code": "CMA", "fullName": "Certificate of Meritorious Arrangement" },
  { "code": "AC",  "fullName": "Artistic Certificate" }
];

// Loop through all files in the HTML directory

// Within in file, find any instances of awards that match the above list
// If multiple are found, then it is likely an index file
// Add a -index.html to the file name to avoid conflicts




// Helper function to rename index files
function renameIndexFiles() {

    fs.readdir(htmlDir, (err, files) => {
        if (err) {
            console.error('❌ Error reading HTML directory:', err.message);
            return;
        }

        files.forEach(file => {
            if (file.endsWith('.html')) {
                const filePath = path.join(htmlDir, file);
                const content = fs.readFileSync(filePath, 'utf8');

                let awardCount = 0;

                possibleAwards.forEach(award => {
                    const regex = new RegExp(`\\b${award.code}\\b`, 'g');
                    const matches = content.match(regex);
                    if (matches) {
                        awardCount += matches.length;
                    }
                });

                if (awardCount > 1) {
                    // Check if file already has -index suffix
                    if (file.includes('-index.html')) {
                        console.log(`⚠️  ${file} already renamed, skipping`);
                        return;
                    }

                    const newFileName = file.replace('.html', '-index.html');
                    const newFilePath = path.join(htmlDir, newFileName);

                    fs.rename(filePath, newFilePath, (renameErr) => {
                        if (renameErr) {
                            console.error(`❌ Error renaming file ${file}:`, renameErr.message);
                        } else {
                            console.log(`✅ Renamed ${file} to ${newFileName}`);
                        }
                    });
                }
            }
        })
    });
}

// Run the renaming process
renameIndexFiles();