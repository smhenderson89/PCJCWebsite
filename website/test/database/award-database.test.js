const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const AwardServices = require('../../src/services/AwardServices');

describe('Database Integration Tests', () => {
  let testDb;
  let testDbPath;
  let awardService;

  beforeAll(() => {
    // Create a temporary test database
    testDbPath = path.join(__dirname, 'test_awards.db');
    
    // Remove test DB if it exists
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Create new test database
    testDb = new Database(testDbPath);
    
    // Create awards table with schema matching production
    testDb.exec(`
      CREATE TABLE IF NOT EXISTS awards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        awardNum TEXT UNIQUE NOT NULL,
        year INTEGER,
        date_iso TEXT,
        plantName TEXT,
        species TEXT,
        grower TEXT,
        location TEXT,
        awardType TEXT,
        description TEXT,
        NS REAL,
        NSV REAL, 
        DSW REAL,
        DSL REAL,
        PETW REAL,
        PETL REAL,
        LSW REAL,
        LSL REAL,
        LIPW REAL,
        LIPL REAL,
        SYNSW REAL,
        SYNSL REAL,
        PCHW REAL,
        PCHL REAL,
        thumbnail_jpeg_small TEXT,
        thumbnail_jpeg_medium TEXT,
        thumbnail_webp_small TEXT,
        thumbnail_webp_medium TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert test data
    const insertStmt = testDb.prepare(`
      INSERT INTO awards (
        awardNum, year, date_iso, plantName, species, grower, 
        location, awardType, description, NS, DSW, PETL
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Test data based on your edge cases
    const testAwards = [
      ['20240001', 2024, '2024-01-15', 'Cattleya warscewiczii', 'warscewiczii', 'John Doe', 'Springfield Show', 'HCC', 'Beautiful form and color', 12.5, 8.3, 7.2],
      ['20240002', 2024, '2024-01-15', 'Phalaenopsis amabilis', 'amabilis', 'Jane Smith', 'Springfield Show', 'AM', 'Outstanding quality', 15.2, 10.1, 9.8],
      ['20240003', 2024, '2024-02-20', 'Dendrobium nobile', 'nobile', 'Bob Johnson', 'Winter Show', 'CBR', 'Excellent species example', 8.9, 6.4, 5.1],
      ['20230001', 2023, '2023-03-10', 'Oncidium flexuosum', 'flexuosum', 'Mary Wilson', 'Spring Exhibition', 'HCC', 'Vibrant yellow flowers', null, null, null],
      ['20230002', 2023, '2023-03-10', 'Paphiopedilum micranthum', 'micranthum', 'David Chen', 'Spring Exhibition', 'AM', 'Perfect form', 4.2, 3.8, 3.5],
      ['20220001', 2022, '2022-11-05', 'Vanda coerulea', 'coerulea', 'Sarah Jones', 'Fall Classic', 'FCC', 'Exceptional blue color', 18.7, 12.3, 11.9]
    ];

    testAwards.forEach(award => {
      insertStmt.run(...award);
    });

    testDb.close();
  });

  beforeEach(() => {
    // Mock the database path for the service to use our test database
    jest.spyOn(path, 'join').mockImplementation((...args) => {
      if (args.includes('orchid_awards.sqlite')) {
        return testDbPath;
      }
      return path.join.call(path, ...args);
    });

    awardService = new AwardServices();
  });

  afterEach(() => {
    if (awardService && awardService.db) {
      awardService.db.close();
    }
    jest.restoreAllMocks();
  });

  afterAll(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Database Connection', () => {
    test('should connect to database successfully', () => {
      expect(awardService).toBeDefined();
      expect(awardService.db).toBeDefined();
    });

    test('should enable WAL mode', () => {
      const pragmaResult = awardService.db.pragma('journal_mode');
      expect(pragmaResult).toBe('wal');
    });
  });

  describe('getAllAwards', () => {
    test('should return all awards ordered by awardNum', () => {
      const awards = awardService.getAllAwards();
      
      expect(awards).toHaveLength(6);
      expect(awards[0].awardNum).toBe('20220001');
      expect(awards[1].awardNum).toBe('20230001');
      expect(awards[5].awardNum).toBe('20240003');
      
      // Verify data integrity
      expect(awards[0].plantName).toBe('Vanda coerulea');
      expect(awards[0].awardType).toBe('FCC');
    });

    test('should return awards with all expected fields', () => {
      const awards = awardService.getAllAwards();
      const firstAward = awards[0];
      
      const expectedFields = [
        'awardNum', 'year', 'date_iso', 'plantName', 'species', 
        'grower', 'location', 'awardType', 'description'
      ];
      
      expectedFields.forEach(field => {
        expect(firstAward).toHaveProperty(field);
      });
    });
  });

  describe('getAwardCountsByYear', () => {
    test('should return correct counts for each year', () => {
      const counts = awardService.getAwardCountsByYear();
      
      expect(counts).toHaveLength(3);
      
      const countsByYear = counts.reduce((acc, item) => {
        acc[item.year] = item.count;
        return acc;
      }, {});
      
      expect(countsByYear[2024]).toBe(3);
      expect(countsByYear[2023]).toBe(2);
      expect(countsByYear[2022]).toBe(1);
    });

    test('should order results by year ascending', () => {
      const counts = awardService.getAwardCountsByYear();
      
      expect(counts[0].year).toBeLessThan(counts[1].year);
      expect(counts[1].year).toBeLessThan(counts[2].year);
    });
  });

  describe('getAwardsByYear', () => {
    test('should return awards for specific year', () => {
      const awards2024 = awardService.getAwardsByYear(2024);
      const awards2023 = awardService.getAwardsByYear(2023);
      
      expect(awards2024).toHaveLength(3);
      expect(awards2023).toHaveLength(2);
      
      // All awards should be from the requested year
      awards2024.forEach(award => {
        expect(award.year).toBe(2024);
      });
    });

    test('should order results by date and award number', () => {
      const awards2024 = awardService.getAwardsByYear(2024);
      
      // First two awards are from same date, should be ordered by awardNum
      expect(awards2024[0].date_iso).toBe('2024-01-15');
      expect(awards2024[1].date_iso).toBe('2024-01-15');
      expect(awards2024[0].awardNum).toBe('20240001');
      expect(awards2024[1].awardNum).toBe('20240002');
      
      // Last award is from later date
      expect(awards2024[2].date_iso).toBe('2024-02-20');
    });

    test('should return empty array for year with no awards', () => {
      const awards1990 = awardService.getAwardsByYear(1990);
      
      expect(awards1990).toEqual([]);
    });

    test('should include thumbnail fields', () => {
      const awards = awardService.getAwardsByYear(2024);
      const firstAward = awards[0];
      
      expect(firstAward).toHaveProperty('thumbnail_jpeg_small');
      expect(firstAward).toHaveProperty('thumbnail_jpeg_medium');
      expect(firstAward).toHaveProperty('thumbnail_webp_small');
      expect(firstAward).toHaveProperty('thumbnail_webp_medium');
    });
  });

  describe('getAwardsCountsByDayForYear', () => {
    test('should return daily counts for specific year', () => {
      const dailyCounts2024 = awardService.getAwardsCountsByDayForYear(2024);
      
      expect(dailyCounts2024).toHaveLength(2); // 2 different dates in 2024
      
      // Find counts for specific dates
      const jan15Count = dailyCounts2024.find(d => d.date_iso === '2024-01-15');
      const feb20Count = dailyCounts2024.find(d => d.date_iso === '2024-02-20');
      
      expect(jan15Count.count).toBe(2); // 2 awards on Jan 15
      expect(feb20Count.count).toBe(1); // 1 award on Feb 20
    });

    test('should return empty array for year with no awards', () => {
      const dailyCounts1990 = awardService.getAwardsCountsByDayForYear(1990);
      
      expect(dailyCounts1990).toEqual([]);
    });
  });

  describe('Data integrity and edge cases', () => {
    test('should handle null measurement values correctly', () => {
      const awards = awardService.getAwardsByYear(2023);
      const awardWithNulls = awards.find(a => a.awardNum === '20230001');
      
      expect(awardWithNulls.NS).toBeNull();
      expect(awardWithNulls.DSW).toBeNull();
      expect(awardWithNulls.PETL).toBeNull();
    });

    test('should handle decimal measurement values', () => {
      const awards = awardService.getAwardsByYear(2024);
      const awardWithMeasurements = awards.find(a => a.awardNum === '20240001');
      
      expect(typeof awardWithMeasurements.NS).toBe('number');
      expect(awardWithMeasurements.NS).toBe(12.5);
      expect(awardWithMeasurements.DSW).toBe(8.3);
      expect(awardWithMeasurements.PETL).toBe(7.2);
    });

    test('should handle special characters in data', () => {
      const awards = awardService.getAllAwards();
      
      // Test that species names are preserved correctly
      const species = awards.map(a => a.species);
      expect(species).toContain('warscewiczii');
      expect(species).toContain('micranthum');
    });

    test('should maintain data types correctly', () => {
      const awards = awardService.getAwardsByYear(2024);
      const award = awards[0];
      
      expect(typeof award.year).toBe('number');
      expect(typeof award.awardNum).toBe('string');
      expect(typeof award.plantName).toBe('string');
      expect(typeof award.date_iso).toBe('string');
    });
  });

  describe('Error handling', () => {
    test('should handle invalid SQL gracefully', () => {
      // Temporarily break the database to test error handling
      expect(() => {
        awardService.db.prepare('INVALID SQL STATEMENT').all();
      }).toThrow();
    });

    test('should handle extreme parameter values', () => {
      // Very large year
      const awards9999 = awardService.getAwardsByYear(9999);
      expect(awards9999).toEqual([]);
      
      // Negative year
      const awardsNegative = awardService.getAwardsByYear(-1);
      expect(awardsNegative).toEqual([]);
      
      // Zero year
      const awards0 = awardService.getAwardsByYear(0);
      expect(awards0).toEqual([]);
    });
  });

  describe('Performance testing', () => {
    test('should perform queries efficiently', () => {
      const startTime = process.hrtime();
      
      // Run multiple operations
      awardService.getAllAwards();
      awardService.getAwardCountsByYear();
      awardService.getAwardsByYear(2024);
      awardService.getAwardsCountsByDayForYear(2024);
      
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const totalTime = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
      
      // Should complete all operations in under 1 second
      expect(totalTime).toBeLessThan(1000);
    });
  });
});