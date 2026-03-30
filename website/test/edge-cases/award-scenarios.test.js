/**
 * Edge Case Tests for Orchid Awards
 * Based on documented edge cases in test/testAwards.md
 * These tests verify handling of specific award scenarios
 */

const request = require('supertest');
const express = require('express');

// Mock the database service BEFORE requiring any other modules
jest.mock('../../src/services/AwardServices');

const awardsApiRoutes = require('../../src/routes/awards/api');

describe('Awards Edge Case Tests', () => {
  let app;
  let mockDbService;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(awardsApiRoutes);

    const DatabaseService = require('../../src/services/AwardServices');
    mockDbService = {
      getAwardCountsByYear: jest.fn(),
      getAwardsCountsByDayForYear: jest.fn(),
      getAwardsByYear: jest.fn()
    };
    
    DatabaseService.mockImplementation(() => mockDbService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations but keep the mock functions
    mockDbService.getAwardsByYear.mockReturnValue([]);
    mockDbService.getAwardCountsByYear.mockReturnValue([]);
    mockDbService.getAwardsCountsByDayForYear.mockReturnValue([]);
  });

  describe('Award Type Edge Cases', () => {
    test('should handle common award types correctly', async () => {
      const commonAward = {
        awardNum: '20265440',
        year: 2026,
        plantName: 'Common Award Type Example',
        awardType: 'HCC',
        description: 'Most common type of award',
        grower: 'Test Grower',
        date_iso: '2026-01-06'
      };

      mockDbService.getAwardsByYear.mockReturnValue([commonAward]);

      const response = await request(app)
        .get('/api/awards/2026/20265440')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.awardType).toBe('HCC');
      expect(response.body.data.awardNum).toBe('20265440');
    });

    test('should handle Synsw details award type', async () => {
      const synswAward = {
        awardNum: '20194718',
        year: 2019,
        plantName: 'Synsepallum Award Example', 
        awardType: 'SYNSW',
        description: 'Synsepallum width measurement award',
        grower: 'Test Grower',
        date_iso: '2019-03-02',
        SYNSW: 15.2,
        SYNSL: 12.8
      };

      mockDbService.getAwardsByYear.mockReturnValue([synswAward]);

      const response = await request(app)
        .get('/api/awards/2019/20194718')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.awardType).toBe('SYNSW');
      expect(response.body.data.SYNSW).toBe(15.2);
      expect(response.body.data.SYNSL).toBe(12.8);
    });

    test('should handle display awards', async () => {
      const displayAward = {
        awardNum: '20255363',
        year: 2025,
        plantName: 'Display Award Example',
        awardType: 'DISPLAY',
        description: 'Outstanding display arrangement',
        grower: 'Test Society',
        date_iso: '2025-02-27'
      };

      mockDbService.getAwardsByYear.mockReturnValue([displayAward]);

      const response = await request(app)
        .get('/api/awards/2025/20255363')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.awardType).toBe('DISPLAY');
    });

    test('should handle species clone awards', async () => {
      const speciesCloneAward = {
        awardNum: '20255318',
        year: 2025,
        plantName: 'Species Clone Example',
        awardType: 'SPECIES_CLONE',
        description: 'Outstanding species clone',
        grower: 'Species Expert',
        date_iso: '2025-07-19',
        species: 'dendrobium nobile'
      };

      mockDbService.getAwardsByYear.mockReturnValue([speciesCloneAward]);

      const response = await request(app)
        .get('/api/awards/2025/20255318')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.species).toBe('dendrobium nobile');
    });
  });

  describe('Image Dimension Edge Cases', () => {
    test('should handle awards with long vertical images', async () => {
      const longVerticalAwards = [
        {
          awardNum: '20255362',
          year: 2025,
          plantName: 'Long Vertical Image Example 1',
          imageWidth: 800,
          imageHeight: 2400, // Very tall image
          aspectRatio: 0.33,
          thumbnail_jpeg_small: 'long_vertical_1_small.jpg',
          thumbnail_jpeg_medium: 'long_vertical_1_medium.jpg'
        },
        {
          awardNum: '20255338',
          year: 2025,
          plantName: 'Long Vertical Image Example 2', 
          imageWidth: 600,
          imageHeight: 1800, // Very tall image
          aspectRatio: 0.33,
          thumbnail_jpeg_small: 'long_vertical_2_small.jpg',
          thumbnail_jpeg_medium: 'long_vertical_2_medium.jpg'
        }
      ];

      mockDbService.getAwardsByYear.mockReturnValue(longVerticalAwards);

      // Test first long vertical image
      const response1 = await request(app)
        .get('/api/awards/2025/20255362')
        .expect(200);

      expect(response1.body.data.aspectRatio).toBeLessThan(0.5);
      expect(response1.body.data.imageHeight).toBeGreaterThan(response1.body.data.imageWidth * 2);

      // Test second long vertical image
      const response2 = await request(app)
        .get('/api/awards/2025/20255338')
        .expect(200);

      expect(response2.body.data.aspectRatio).toBeLessThan(0.5);
    });

    test('should handle awards with long horizontal images', async () => {
      const longHorizontalAward = {
        awardNum: '20215306',
        year: 2021,
        plantName: 'Long Horizontal Image Example',
        imageWidth: 3200, // Very wide image
        imageHeight: 800,
        aspectRatio: 4.0,
        thumbnail_jpeg_small: 'long_horizontal_small.jpg',
        thumbnail_jpeg_medium: 'long_horizontal_medium.jpg',
        date_iso: '2021-04-17'
      };

      mockDbService.getAwardsByYear.mockReturnValue([longHorizontalAward]);

      const response = await request(app)
        .get('/api/awards/2021/20215306')
        .expect(200);

      expect(response.body.data.aspectRatio).toBeGreaterThan(3);
      expect(response.body.data.imageWidth).toBeGreaterThan(response.body.data.imageHeight * 3);
    });

    test('should ensure thumbnail generation for extreme aspect ratios', async () => {
      const extremeAspectAward = {
        awardNum: 'EXTREME001',
        year: 2024,
        plantName: 'Extreme Aspect Ratio',
        imageWidth: 4000,
        imageHeight: 500, // 8:1 aspect ratio
        aspectRatio: 8.0
      };

      mockDbService.getAwardsByYear.mockReturnValue([extremeAspectAward]);

      const response = await request(app)
        .get('/api/awards/2024/EXTREME001')
        .expect(200);

      // Should handle extreme aspect ratios without errors
      expect(response.body.success).toBe(true);
      expect(response.body.data.aspectRatio).toBe(8.0);
    });
  });

  describe('Award Description Edge Cases', () => {
    test('should handle award descriptions with award number mentions', async () => {
      const awardWithReferences = {
        awardNum: '20240100',
        year: 2024,
        plantName: 'Plant with Reference',
        description: 'Similar to previous award 20230085 but with improved form. Also see award 20220042 for comparison.',
        grower: 'Test Grower'
      };

      mockDbService.getAwardsByYear.mockReturnValue([awardWithReferences]);

      const response = await request(app)
        .get('/api/awards/2024/20240100')
        .expect(200);

      expect(response.body.data.description).toContain('20230085');
      expect(response.body.data.description).toContain('20220042');
      
      // Could potentially test if hyperlinks are generated in the future
      // This tests that award number references are preserved
    });

    test('should handle very long descriptions', async () => {
      const longDescription = 'This is a very long award description '.repeat(50) + 
        'with award reference 20230001 in the middle ' + 
        'and more text after '.repeat(25);

      const awardWithLongDescription = {
        awardNum: '20240200', 
        year: 2024,
        plantName: 'Plant with Long Description',
        description: longDescription,
        grower: 'Verbose Grower'
      };

      mockDbService.getAwardsByYear.mockReturnValue([awardWithLongDescription]);

      const response = await request(app)
        .get('/api/awards/2024/20240200')
        .expect(200);

      expect(response.body.data.description.length).toBeGreaterThan(1000);
      expect(response.body.data.description).toContain('20230001');
    });

    test('should handle special characters in descriptions', async () => {
      const specialCharDescription = 'Award for Orchid "Special Name" with émojis 🌸🌺 and symbols ® © ™ and quotes "test" & \'single\'';

      const specialCharAward = {
        awardNum: '20240300',
        year: 2024, 
        plantName: 'Plant with Special Characters',
        description: specialCharDescription,
        grower: 'International Grower 中文'
      };

      mockDbService.getAwardsByYear.mockReturnValue([specialCharAward]);

      const response = await request(app)
        .get('/api/awards/2024/20240300')
        .expect(200);

      expect(response.body.data.description).toContain('🌸🌺');
      expect(response.body.data.description).toContain('®');
      expect(response.body.data.grower).toContain('中文');
    });
  });

  describe('Measurement Edge Cases', () => {
    test('should handle awards with all measurement fields', async () => {
      const fullMeasurementAward = {
        awardNum: '20240400',
        year: 2024,
        plantName: 'Fully Measured Plant',
        NS: 12.5, NSV: 8.2, DSW: 15.3, DSL: 18.7,
        PETW: 6.8, PETL: 7.9, LSW: 4.2, LSL: 5.1,
        LIPW: 3.6, LIPL: 4.3, SYNSW: 14.2, SYNSL: 16.8,
        PCHW: 2.1, PCHL: 2.8
      };

      mockDbService.getAwardsByYear.mockReturnValue([fullMeasurementAward]);

      const response = await request(app)
        .get('/api/awards/2024/20240400')
        .expect(200);

      expect(response.body.data.NS).toBe(12.5);
      expect(response.body.data.PCHL).toBe(2.8);
      expect(Object.keys(response.body.data).filter(k => k.match(/^[A-Z]{2,5}$/)).length).toBeGreaterThan(10);
    });

    test('should handle awards with no measurements', async () => {
      const noMeasurementAward = {
        awardNum: '20240500',
        year: 2024,
        plantName: 'Display Award - No Measurements',
        awardType: 'DISPLAY',
        NS: null, NSV: null, DSW: null, DSL: null,
        PETW: null, PETL: null, LSW: null, LSL: null
      };

      mockDbService.getAwardsByYear.mockReturnValue([noMeasurementAward]);

      const response = await request(app)
        .get('/api/awards/2024/20240500')
        .expect(200);

      expect(response.body.data.NS).toBeNull();
      expect(response.body.data.awardType).toBe('DISPLAY');
    });

  });

  describe('Data Quality and Validation', () => {
    test('should handle missing required fields gracefully', async () => {
      const incompleteAward = {
        awardNum: '20240800',
        year: 2024
        // Missing plantName, grower, etc.
      };

      mockDbService.getAwardsByYear.mockReturnValue([incompleteAward]);

      const response = await request(app)
        .get('/api/awards/2024/20240800')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.awardNum).toBe('20240800');
    });

  });
});