# Testing Documentation  

## Overview

Comprehensive testing suite for the PCJC Orchid Awards website, covering unit tests, integration tests, database tests, and edge case scenarios.

## Test Structure

### 📁 Test Organization
```
test/
├── setup.js                    # Global test configuration
├── unit/                       # Unit tests (isolated function testing)
│   ├── services/               # Service layer tests
│   │   ├── AwardServices.test.js
│   │   └── MeasurementFormatter.test.js
│   └── controllers/            # Controller tests
│       └── AwardsController.test.js
├── integration/                # API endpoint tests
│   └── awards-api.test.js
├── database/                   # Database integration tests
│   └── award-database.test.js
└── edge-cases/                 # Specific edge case scenarios
    └── award-scenarios.test.js
```

## 🚀 Running Tests

### All Tests
```bash
pnpm test
```

### Test Categories
```bash
# Unit tests only
pnpm run test:unit

# Integration tests only  
pnpm run test:integration

# Watch mode (runs tests on file changes)
pnpm run test:watch
```

### Specific Test Files
```bash
# Run specific test file
npx jest test/unit/services/MeasurementFormatter.test.js

# Run tests matching pattern
npx jest --testNamePattern="should format measurements"
```

## 📋 Test Categories

### Common Issues
1. **Database Path Issues**: Ensure test database is created in correct location
2. **Mock Setup**: Clear mocks between tests with `jest.clearAllMocks()`
3. **Async Handling**: Use `async/await` for all database operations

### Debug Commands
```bash
# Run single test with verbose output
npx jest test/unit/services/MeasurementFormatter.test.js --verbose

# Run tests in watch mode for development
npx jest --watch
```

## 🎯 Testing Best Practices

### Unit Tests
- Test one function/method per test suite
- Mock external dependencies
- Test both success and error scenarios
- Include edge cases and boundary conditions

### Integration Tests  
- Test complete request/response cycles
- Validate JSON response structure
- Test error handling and status codes
- Include performance testing for large datasets

### Database Tests
- Use isolated test database
- Clean up after tests (temporary files)
- Test data integrity and schema compliance
- Include performance benchmarks

### Edge Case Tests
- Based on real-world documented scenarios
- Test extreme values and special cases
- Validate handling of unusual data formats
- Ensure backward compatibility

## 🚦 Continuous Integration

### Pre-commit Checks
```bash
# Run all tests before committing
pnpm test

# Check that tests pass in production mode
NODE_ENV=production pnpm test
```

### Performance Benchmarks
- Unit tests: < 1 second per suite
- Integration tests: < 5 seconds per suite  
- Database tests: < 10 seconds per suite
- All tests: < 30 seconds total

## 📝 Adding New Tests

### When to Add Tests
- New API endpoints
- New service methods
- Bug fixes (add regression test)
- New edge cases discovered

### Test File Naming
- Unit tests: `*.test.js` in appropriate `unit/` subdirectory
- Integration tests: `*-api.test.js` in `integration/` 
- Database tests: `*-database.test.js` in `database/`
- Edge cases: `*-scenarios.test.js` in `edge-cases/`

### Template Structure
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  describe('specific functionality', () => {
    test('should handle normal case', () => {
      // Test implementation
    });

    test('should handle error case', () => {
      // Error handling test
    });
  });
});
```

This testing framework ensures robust quality assurance for the orchid awards website with comprehensive coverage of functionality, edge cases, and performance scenarios.