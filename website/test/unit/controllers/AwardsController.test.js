const AwardsController = require('../../../src/controllers/AwardsController');

// Mock the DatabaseService
jest.mock('../../../src/services/AwardServices');

describe('AwardsController', () => {
  let controller;
  let mockDbService;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Create mock database service
    mockDbService = {
      getAwardCountsByYear: jest.fn(),
      getAwardsCountsByDayForYear: jest.fn(),
      getAwardsByYear: jest.fn()
    };

    // Mock the DatabaseService constructor
    const DatabaseService = require('../../../src/services/AwardServices');
    DatabaseService.mockImplementation(() => mockDbService);

    // Create controller instance
    controller = new AwardsController();

    // Mock request and response objects
    mockReq = {
      params: {},
      query: {},
      body: {}
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn(() => mockRes), // For chaining
      send: jest.fn()
    };

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('getAwardCounts', () => {
    test('should return award counts successfully', async () => {
      const mockCounts = [
        { year: 2023, count: 150 },
        { year: 2024, count: 200 }
      ];
      
      mockDbService.getAwardCountsByYear.mockReturnValue(mockCounts);

      await controller.getAwardCounts(mockReq, mockRes);

      expect(mockDbService.getAwardCountsByYear).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCounts
      });
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should handle database errors gracefully', async () => {
      const errorMessage = 'Database connection failed';
      mockDbService.getAwardCountsByYear.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await controller.getAwardCounts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unable to load awards'
      });
    });
  });

  describe('groupAwardsByDayForYear', () => {
    test('should return daily award counts for valid year', async () => {
      mockReq.params.year = '2024';
      const mockDailyCounts = [
        { date_iso: '2024-01-15', count: 25 },
        { date_iso: '2024-02-20', count: 30 }
      ];
      
      mockDbService.getAwardsCountsByDayForYear.mockReturnValue(mockDailyCounts);

      await controller.groupAwardsByDayForYear(mockReq, mockRes);

      expect(mockDbService.getAwardsCountsByDayForYear).toHaveBeenCalledWith(2024);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockDailyCounts
      });
    });

    test('should return 400 for invalid year parameter', async () => {
      mockReq.params.year = 'invalid';

      await controller.groupAwardsByDayForYear(mockReq, mockRes);

      expect(mockDbService.getAwardsCountsByDayForYear).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid year parameter'
      });
    });

    test('should handle missing year parameter', async () => {
      mockReq.params = {}; // No year parameter

      await controller.groupAwardsByDayForYear(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle database errors when fetching daily counts', async () => {
      mockReq.params.year = '2024';
      mockDbService.getAwardsCountsByDayForYear.mockImplementation(() => {
        throw new Error('Database query failed');
      });

      await controller.groupAwardsByDayForYear(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unable to load awards for the specified year'
      });
    });
  });

  describe('getAwardsByYear', () => {
    test('should return awards for valid year', async () => {
      mockReq.params.year = '2024';
      const mockAwards = [
        { awardNum: 'AM001', plantName: 'Test Orchid 1', year: 2024 },
        { awardNum: 'HCC002', plantName: 'Test Orchid 2', year: 2024 }
      ];
      
      mockDbService.getAwardsByYear.mockReturnValue(mockAwards);

      await controller.getAwardsByYear(mockReq, mockRes);

      expect(mockDbService.getAwardsByYear).toHaveBeenCalledWith(2024);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAwards
      });
    });

    test('should handle string year parameter', async () => {
      mockReq.params.year = '2023';
      mockDbService.getAwardsByYear.mockReturnValue([]);

      await controller.getAwardsByYear(mockReq, mockRes);

      expect(mockDbService.getAwardsByYear).toHaveBeenCalledWith(2023);
    });

    test('should return 400 for NaN year', async () => {
      mockReq.params.year = 'not-a-number';

      await controller.getAwardsByYear(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid year parameter'
      });
    });
  });

  describe('getDetailedAwardInfo', () => {
    beforeEach(() => {
      mockReq.params = {
        year: '2024',
        awardNum: 'AM001'
      };
    });

    test('should return specific award when found', async () => {
      const mockAwards = [
        { awardNum: 'AM001', plantName: 'Test Orchid 1', year: 2024 },
        { awardNum: 'HCC002', plantName: 'Test Orchid 2', year: 2024 }
      ];
      
      mockDbService.getAwardsByYear.mockReturnValue(mockAwards);

      await controller.getDetailedAwardInfo(mockReq, mockRes);

      expect(mockDbService.getAwardsByYear).toHaveBeenCalledWith(2024);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockAwards[0] // Should return the matching award
      });
    });

    test('should return 404 when award not found', async () => {
      const mockAwards = [
        { awardNum: 'HCC002', plantName: 'Test Orchid 2', year: 2024 }
      ];
      
      mockDbService.getAwardsByYear.mockReturnValue(mockAwards);

      await controller.getDetailedAwardInfo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Award not found'
      });
    });

    test('should return 400 for invalid year parameter', async () => {
      mockReq.params.year = 'invalid';

      await controller.getDetailedAwardInfo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid year or award number parameter'
      });
    });

    test('should return 400 for missing award number', async () => {
      mockReq.params.awardNum = '';

      await controller.getDetailedAwardInfo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle database errors', async () => {
      mockDbService.getAwardsByYear.mockImplementation(() => {
        throw new Error('Database error');
      });

      await controller.getDetailedAwardInfo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('edge cases and data validation', () => {
    test('should handle zero year', async () => {
      mockReq.params.year = '0';
      mockDbService.getAwardsByYear.mockReturnValue([]);

      await controller.getAwardsByYear(mockReq, mockRes);

      expect(mockDbService.getAwardsByYear).toHaveBeenCalledWith(0);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });

    test('should handle negative year', async () => {
      mockReq.params.year = '-1';
      mockDbService.getAwardsByYear.mockReturnValue([]);

      await controller.getAwardsByYear(mockReq, mockRes);

      expect(mockDbService.getAwardsByYear).toHaveBeenCalledWith(-1);
    });

    test('should handle very large year', async () => {
      mockReq.params.year = '9999';
      mockDbService.getAwardsByYear.mockReturnValue([]);

      await controller.getAwardsByYear(mockReq, mockRes);

      expect(mockDbService.getAwardsByYear).toHaveBeenCalledWith(9999);
    });
  });
});