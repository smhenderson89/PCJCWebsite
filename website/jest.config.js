module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  // Module paths
  moduleDirectories: ['node_modules', 'src'],
  
  // Test timeout (30 seconds for integration tests)
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Don't transform node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!(es6-module-that-needs-transform)/)'
  ]
};