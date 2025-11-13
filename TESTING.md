# Testing Guide

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

## Test Structure

```
backend/tests/
├── setup.js              # Test setup and teardown
├── auth.test.js          # Authentication tests
├── wallet.test.js        # Wallet operation tests
├── commission.test.js    # Commission service tests
├── walletGenerator.test.js # Wallet generation tests
└── integration/          # Integration tests
    └── transaction.test.js
```

## Writing Tests

### Unit Tests
Test individual functions and services in isolation.

### Integration Tests
Test complete flows (e.g., create wallet → get balance → send transaction).

### Test Database
Uses MongoDB Memory Server for isolated testing.

## Coverage Requirements

Maintain at least 70% coverage for:
- Branches
- Functions
- Lines
- Statements

## Best Practices

1. Use descriptive test names
2. Test both success and failure cases
3. Mock external dependencies
4. Clean up after tests
5. Use beforeEach/afterEach appropriately
6. Test edge cases

## Example Test

```javascript
describe('Feature', () => {
  describe('Scenario', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = 'test';

      // Act
      const result = await functionUnderTest(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```