import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadTestData() {
  console.log('test function ran');
  try {
    const jsonPath = path.join(__dirname, '../db/testData/singleData.json');
    const jsonData = await fs.readFile(jsonPath, 'utf-8');
    console.log('File path:', jsonPath);
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Failed to load test data:', error);
    throw error;
  }
}

// Run the function
loadTestData().then(data => {
  console.log('Loaded data:', data);
}).catch(err => {
  console.error('Error:', err);
});