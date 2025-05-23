# AIM Possible Backend Testing

This directory contains unit tests for the AIM Possible backend API. The tests use Jest as the testing framework and Supertest for making HTTP requests.

## Test Structure

The tests are organized by feature:

- `health.test.js` - Tests for the health check endpoint
- `employees.test.js` - Tests for employee-related endpoints
- `items.test.js` - Tests for items-related endpoints
- `sick-leave.test.js` - Tests for sick leave management
- `asset-bookings.test.js` - Tests for asset booking functionality
- `education-activities.test.js` - Tests for education activities

Each test file follows a similar structure:
1. Setup a test database
2. Create necessary tables and seed test data
3. Run tests against specific endpoints
4. Clean up after tests complete

## Running Tests

You can run the tests using npm:

```bash
# Run all tests
npm test

# Run tests with watch mode (tests rerun when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Database Handling

Tests use isolated SQLite or JSON databases to avoid affecting production data. Each test suite:

1. Creates a temporary test database file
2. Sets up necessary tables and seed data
3. Configures the app to use the test database
4. Cleans up the database file after tests complete

## Adding New Tests

When adding new tests:

1. Create a new file named `feature-name.test.js`
2. Set up the test database with tables and data needed
3. Write tests for each endpoint
4. Make sure to properly clean up after tests

## Test Coverage

The test coverage report shows which parts of the code are covered by tests. To generate a coverage report, run:

```bash
npm run test:coverage
```

The coverage report will be available in the `coverage` directory. 