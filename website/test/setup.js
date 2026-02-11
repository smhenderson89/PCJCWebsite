// Global test setup
const path = require('path');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_PATH = path.join(__dirname, '..', 'db', 'test_orchid_awards.sqlite');

// Global test utilities
global.testHelpers = {
  // Add any global test utilities here
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock award data for testing
  mockAward: {
    awardNum: 'TEST001',
    year: 2024,
    plantName: 'Test Orchid',
    species: 'testicus',
    grower: 'Test Grower',
    date_iso: '2024-01-01',
    location: 'Test Location',
    awardType: 'TEST',
    description: 'Test award description'
  },
  
  // Mock multiple awards
  mockAwards: [
    {
      awardNum: 'TEST001',
      year: 2024,
      plantName: 'Test Orchid 1',
      species: 'testicus major',
      grower: 'Test Grower 1',
      date_iso: '2024-01-01',
      awardType: 'HCC'
    },
    {
      awardNum: 'TEST002',
      year: 2024,
      plantName: 'Test Orchid 2',
      species: 'testicus minor',
      grower: 'Test Grower 2',
      date_iso: '2024-01-02',
      awardType: 'AM'
    }
  ]
};

// Setup and teardown for database tests
beforeEach(() => {
  // Clear any previous test state
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});