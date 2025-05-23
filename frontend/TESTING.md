# Frontend Testing Guide

This document provides information about the testing setup for the AIM Possible frontend application.

## Running Tests

You can run the tests using the following npm commands:

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch
```

## Testing Stack

The frontend uses the following testing tools:

- **Jest**: Test runner and assertion library
- **Testing Library**: For rendering React components in tests
- **Vitest**: Modern testing framework compatible with Vite
- **JSDOM**: Browser-like environment for running tests

## Test Structure

Tests are organized by feature and placed close to the code they test:

- `src/components/__tests__/`: Component tests 
- `src/services/__tests__/`: API service tests
- `src/utils/__tests__/`: Utility function tests
- `src/tests/`: Integration tests

## Testing Strategy

The frontend tests follow these principles:

1. **Component Testing**: Test React components in isolation, focusing on user interactions and rendered output.
2. **API Service Testing**: Test API calls with mocked responses to ensure correct data handling.
3. **Utility Testing**: Test pure utility functions with various inputs to ensure correct output.
4. **User-Focused Testing**: Tests are written from the user's perspective, focusing on what the user sees and does.

## Key Areas Covered by Tests

1. **Sick Leave Form**: Tests for form submission, validation, and error handling.
2. **Employee History**: Tests for displaying and filtering sick leave history.
3. **API Services**: Tests for all API communication with the backend.
4. **Utility Functions**: Tests for date formatting, working days calculation, and display helpers.

## Writing New Tests

When adding new features, follow these guidelines for testing:

1. **Component Tests**:
   - Test that components render correctly
   - Test user interactions (clicks, form inputs, etc.)
   - Test state changes and conditional rendering

2. **Service Tests**:
   - Mock API responses
   - Test success and error scenarios
   - Verify correct URL and payload construction

3. **Utility Tests**:
   - Test with various inputs, including edge cases
   - Test with invalid inputs to ensure graceful handling

## Mock Strategy

Tests use the following mocking approaches:

- **API Mocks**: Services are mocked using Vitest's `vi.mock()`
- **Fetch Mock**: The global `fetch` function is mocked for API tests
- **Component Mocks**: React Router is mocked using `MemoryRouter`

## Coverage

The test coverage targets are:
- Functions: 80%
- Branches: 75%
- Lines: 80%
- Statements: 80%

## Debugging Tests

If you encounter test failures:

1. Check the error message for specific assertion failures
2. Use `console.log` in tests to debug values
3. Run specific tests with `npm test -- -t "test name"`
4. Use `screen.debug()` to see the rendered HTML in component tests 