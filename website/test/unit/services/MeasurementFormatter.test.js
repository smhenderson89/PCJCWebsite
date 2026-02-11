const MeasurementFormatter = require('../../../src/services/MeasurementFormatter');

describe('MeasurementFormatter', () => {
  describe('measurementFields', () => {
    test('should contain all expected measurement fields', () => {
      const expectedFields = [
        'NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 
        'LSW', 'LSL', 'LIPW', 'LIPL', 'SYNSW', 'SYNSL', 
        'PCHW', 'PCHL'
      ];
      
      expect(MeasurementFormatter.measurementFields).toEqual(expectedFields);
    });
  });

  describe('formatAwardMeasurements', () => {
    test('should format valid measurement values to 1 decimal place', () => {
      const award = {
        awardNum: 'TEST001',
        plantName: 'Test Orchid',
        NS: 5.456,
        DSW: 3.234,
        PETL: 2.789,
        nonMeasurementField: 'unchanged'
      };

      const result = MeasurementFormatter.formatAwardMeasurements(award);

      expect(result.NS).toBe(5.5);
      expect(result.DSW).toBe(3.2);
      expect(result.PETL).toBe(2.8);
      expect(result.nonMeasurementField).toBe('unchanged');
      expect(result.awardNum).toBe('TEST001');
    });

    test('should handle null and undefined values', () => {
      const award = {
        awardNum: 'TEST002',
        NS: null,
        DSW: undefined,
        PETL: 2.5
      };

      const result = MeasurementFormatter.formatAwardMeasurements(award);

      expect(result.NS).toBeNull();
      expect(result.DSW).toBeUndefined();
      expect(result.PETL).toBe(2.5);
    });

    test('should handle edge case values', () => {
      const award = {
        NS: 0,
        DSW: 0.05,
        PETL: 10.999,
        LSW: -1.5
      };

      const result = MeasurementFormatter.formatAwardMeasurements(award);

      expect(result.NS).toBe(0);
      expect(result.DSW).toBe(0.1); // 0.05 rounds to 0.1
      expect(result.PETL).toBe(11.0); // 10.999 rounds to 11.0
      expect(result.LSW).toBe(-1.5);
    });

    test('should not modify original award object', () => {
      const award = {
        NS: 5.456,
        DSW: 3.234
      };
      const originalAward = { ...award };

      const result = MeasurementFormatter.formatAwardMeasurements(award);

      expect(award).toEqual(originalAward); // Original unchanged
      expect(result.NS).toBe(5.5); // Result is formatted
    });

    test('should handle awards with no measurement fields', () => {
      const award = {
        awardNum: 'TEST003',
        plantName: 'Test Orchid',
        grower: 'Test Grower'
      };

      const result = MeasurementFormatter.formatAwardMeasurements(award);

      expect(result).toEqual(award);
    });
  });

  describe('formatAwardsArray', () => {
    test('should format multiple awards correctly', () => {
      const awards = [
        { awardNum: 'TEST001', NS: 3.456, DSW: 2.234 },
        { awardNum: 'TEST002', PETL: 1.789, LSW: 4.567 },
        { awardNum: 'TEST003', plantName: 'No measurements' }
      ];

      const result = MeasurementFormatter.formatAwardsArray(awards);

      expect(result).toHaveLength(3);
      expect(result[0].NS).toBe(3.5);
      expect(result[0].DSW).toBe(2.2);
      expect(result[1].PETL).toBe(1.8);
      expect(result[1].LSW).toBe(4.6);
      expect(result[2].plantName).toBe('No measurements');
    });

    test('should handle empty array', () => {
      const awards = [];
      const result = MeasurementFormatter.formatAwardsArray(awards);
      
      expect(result).toEqual([]);
    });

    test('should not modify original awards array', () => {
      const awards = [{ NS: 3.456 }];
      const originalAwards = JSON.parse(JSON.stringify(awards));

      const result = MeasurementFormatter.formatAwardsArray(awards);

      expect(awards).toEqual(originalAwards);
      expect(result[0].NS).toBe(3.5);
    });
  });

  describe('formatAwardMeasurementsAsStrings', () => {
    test('should format measurements as string with 1 decimal place', () => {
      const award = {
        NS: 5.456,
        DSW: 3.0,
        PETL: 2.789
      };

      const result = MeasurementFormatter.formatAwardMeasurementsAsStrings(award);

      expect(result.NS).toBe('5.5');
      expect(result.DSW).toBe('3.0');
      expect(result.PETL).toBe('2.8');
      expect(typeof result.NS).toBe('string');
    });

    test('should handle null and undefined values with string formatting', () => {
      const award = {
        NS: null,
        DSW: undefined,
        PETL: 2.5
      };

      const result = MeasurementFormatter.formatAwardMeasurementsAsStrings(award);

      expect(result.NS).toBeNull();
      expect(result.DSW).toBeUndefined();
      expect(result.PETL).toBe('2.5');
    });

    test('should format zero as string', () => {
      const award = { NS: 0 };
      const result = MeasurementFormatter.formatAwardMeasurementsAsStrings(award);
      
      expect(result.NS).toBe('0.0');
    });
  });
});