# 🧪 Testing Guide

## Quick Start

```bash
# Run all tests
npm run test

# Run tests with UI (interactive)
npm run test:ui

# Run specific test categories
npm run test:smoke      # Critical functionality
npm run test:regression # Full regression suite

# View test dashboard
npm run test:dashboard  # Opens at http://localhost:8080
```

## Test Structure

- **Setup**: Authentication & data preparation
- **Core Tests**: Critical user journeys (auth, transactions, budgets)
- **Feature Tests**: Assets, liabilities, entities, reports
- **Performance**: Load time and responsiveness checks
- **Security**: Data isolation and access control

## Test Categories

- `@smoke`: Critical functionality tests
- `@critical`: Core business logic tests  
- `@regression`: Full feature coverage
- `@performance`: Speed and load tests
- `@security`: Data protection tests

## Dashboard Features

- Real-time test results visualization
- Historical test trends
- Coverage reports
- Performance metrics
- Failure analysis with screenshots

## Adding New Tests

1. Create test files in `tests/e2e/`
2. Use `TestHelpers` class for common operations
3. Add appropriate test tags (`@smoke`, `@critical`, etc.)
4. Include screenshot captures for debugging

The comprehensive test suite ensures regression detection and maintains app quality across all features.