const AwardServices = require('../../../src/services/AwardServices');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Mock Database for testing
jest.mock('better-sqlite3');

describe('AwardServices', () => {
  let mockDb;
  let mockStmt;
  let awardService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock prepared statement
    mockStmt = {
      all: jest.fn(),
      get: jest.fn(),
      run: jest.fn()
    };
    
    // Mock database instance
    mockDb = {
      prepare: jest.fn(() => mockStmt),
      pragma: jest.fn(),
      close: jest.fn()
    };
    
    // Mock Database constructor
    Database.mockImplementation(() => mockDb);
    
    // Create service instance
    awardService = new AwardServices();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should initialize database connection', () => {
      expect(Database).toHaveBeenCalledTimes(1);
      expect(mockDb.pragma).toHaveBeenCalledWith('journal_mode = WAL');
    });

    test('should set correct database path', () => {
      const expectedPath = expect.stringContaining('orchid_awards.sqlite');
      expect(Database).toHaveBeenCalledWith(expectedPath);
    });
  });

  describe('getAllAwards', () => {
    test('should return all awards ordered by award number', () => {
      const mockAwards = [
        { awardNum: 'AM001', plantName: 'Orchid 1' },
        { awardNum: 'HCC002', plantName: 'Orchid 2' }
      ];
      
      mockStmt.all.mockReturnValue(mockAwards);

      const result = awardService.getAllAwards();

      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM awards ORDER BY awardNum ASC');
      expect(mockStmt.all).toHaveBeenCalled();
      expect(result).toEqual(mockAwards);
    });

    test('should handle empty database', () => {
      mockStmt.all.mockReturnValue([]);

      const result = awardService.getAllAwards();

      expect(result).toEqual([]);
    });
  });

  describe('getAwardCountsByYear', () => {
    test('should return award counts grouped by year', () => {
      const mockCounts = [
        { year: 2023, count: 150 },
        { year: 2024, count: 200 }
      ];
      
      mockStmt.all.mockReturnValue(mockCounts);

      const result = awardService.getAwardCountsByYear();

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('GROUP BY year'));
      expect(result).toEqual(mockCounts);
    });

    test('should exclude null years', () => {
      awardService.getAwardCountsByYear();

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE year IS NOT NULL'));
    });
  });

  describe('getAwardsByYear', () => {
    test('should return awards for specific year with thumbnails', () => {
      const year = 2024;
      const mockAwards = [
        { 
          awardNum: 'AM001', 
          year: 2024,
          date_iso: '2024-01-15',
          thumbnail_jpeg_small: 'thumb1_small.jpg'
        }
      ];
      
      mockStmt.all.mockReturnValue(mockAwards);

      const result = awardService.getAwardsByYear(year);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE year = ?'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('thumbnail_'));
      expect(mockStmt.all).toHaveBeenCalledWith(year);
      expect(result).toEqual(mockAwards);
    });

    test('should order results by date and award number', () => {
      awardService.getAwardsByYear(2024);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY date_iso ASC, awardNum ASC')
      );
    });
  });

  describe('getAwardsCountsByDayForYear', () => {
    test('should return daily award counts for specific year', () => {
      const year = 2024;
      const mockCounts = [
        { date_iso: '2024-01-15', count: 25 },
        { date_iso: '2024-02-20', count: 30 }
      ];
      
      mockStmt.all.mockReturnValue(mockCounts);

      const result = awardService.getAwardsCountsByDayForYear(year);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE year = ?'));
      expect(mockStmt.all).toHaveBeenCalledWith(year);
      expect(result).toEqual(mockCounts);
    });
  });

  describe('database error handling', () => {
    test('should handle database connection errors', () => {
      Database.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      expect(() => {
        new AwardServices();
      }).toThrow('Database connection failed');
    });

    test('should handle SQL query errors', () => {
      mockDb.prepare.mockImplementation(() => {
        throw new Error('SQL syntax error');
      });

      expect(() => {
        awardService.getAllAwards();
      }).toThrow('SQL syntax error');
    });
  });

  describe('edge cases and data validation', () => {
    test('should handle null/undefined year parameter', () => {
      const result1 = awardService.getAwardsByYear(null);
      const result2 = awardService.getAwardsByYear(undefined);

      expect(mockStmt.all).toHaveBeenCalledWith(null);
      expect(mockStmt.all).toHaveBeenCalledWith(undefined);
    });

    test('should handle very large datasets', () => {
      // Simulate 10,000 awards
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        awardNum: `TEST${String(i).padStart(5, '0')}`,
        plantName: `Test Orchid ${i}`
      }));
      
      mockStmt.all.mockReturnValue(largeDataset);

      const result = awardService.getAllAwards();

      expect(result).toHaveLength(10000);
      expect(result[0].awardNum).toBe('TEST00000');
      expect(result[9999].awardNum).toBe('TEST09999');
    });

    test('should handle special characters in data', () => {
      const mockAwardsWithSpecialChars = [
        { 
          awardNum: 'TEST001',
          plantName: "Orchid with 'quotes' and \"double quotes\"",
          grower: 'Grower with émojis 🌸'
        }
      ];
      
      mockStmt.all.mockReturnValue(mockAwardsWithSpecialChars);

      const result = awardService.getAllAwards();

      expect(result[0].plantName).toContain("'quotes'");
      expect(result[0].grower).toContain('🌸');
    });
  });
});