import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadTestData() {
  try {
    const jsonPath = path.join(__dirname, '../db/testData/singleData.json');
    const jsonData = await fs.readFile(jsonPath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Failed to load test data:', error);
    throw error;  // rethrow so caller knows something went wrong
  }
}

async function getYearsData(req, res, next) {
    let yearsCounts = {};

    testData = loadTestData();
    
    // Get plant year from year award
    testData.forEach(entry => {
        const [year, month, day] = entry.eventDate.split("-");
        const entryYear = year;

        if (!yearsCounts[entryYear]) {
            yearsCounts[entryYear] = 0
        }
        yearsCounts[entryYear]++;
    })
    
}

export { loadTestData, getYearsData}
