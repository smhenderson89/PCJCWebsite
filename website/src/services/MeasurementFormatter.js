// Utility function for formatting measurement data
class MeasurementFormatter {
  static measurementFields = [
    'NS', 'NSV', 'DSW', 'DSL', 'PETW', 'PETL', 
    'LSW', 'LSL', 'LIPW', 'LIPL', 'SYNSW', 'SYNSL', 
    'PCHW', 'PCHL'
  ];

  /**
   * Format measurement values to 1 decimal place
   * @param {Object} award - Award object from database
   * @returns {Object} - Award object with formatted measurements
   */
  static formatAwardMeasurements(award) {
    const formatted = { ...award };
    
    this.measurementFields.forEach(field => {
      if (formatted[field] !== null && formatted[field] !== undefined) {
        formatted[field] = Math.round(formatted[field] * 10) / 10;
      }
    });
    
    return formatted;
  }

  /**
   * Format an array of awards
   * @param {Array} awards - Array of award objects
   * @returns {Array} - Array of awards with formatted measurements
   */
  static formatAwardsArray(awards) {
    return awards.map(award => this.formatAwardMeasurements(award));
  }

  /**
   * Alternative formatting using parseFloat and toFixed
   * @param {Object} award - Award object from database
   * @returns {Object} - Award object with formatted measurements as strings
   */
  static formatAwardMeasurementsAsStrings(award) {
    const formatted = { ...award };
    
    this.measurementFields.forEach(field => {
      if (formatted[field] !== null && formatted[field] !== undefined) {
        formatted[field] = parseFloat(formatted[field]).toFixed(1);
      }
    });
    
    return formatted;
  }
}

module.exports = MeasurementFormatter;