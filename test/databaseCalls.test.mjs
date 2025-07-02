import { loadTestData} from '../controllers/databaseCalls.js'

// Test read function 
describe('readData', () => {
    it('returns the array of award objects', async () => {
        const data = await loadTestData(); 
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
    });
});