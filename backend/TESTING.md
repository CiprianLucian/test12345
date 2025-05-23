# Testing the AIM Possible Backend

This document describes how to run tests for the AIM Possible backend and provides an overview of the testing strategy.

## Running Tests Locally

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Steps to Run Tests

1. Install dependencies if you haven't already:
   ```bash
   npm install
   ```

2. Run the tests:
   ```bash
   npm test
   ```

3. To run tests with watch mode (tests will rerun when files change):
   ```bash
   npm run test:watch
   ```

4. To generate a coverage report:
   ```bash
   npm run test:coverage
   ```
   The coverage report will be available in the `coverage` directory.

## Testing Strategy

The tests for the AIM Possible backend follow these principles:

1. **Isolation**: Each test runs in isolation with its own test database to prevent interference between tests.

2. **End-to-End API Testing**: The tests simulate HTTP requests to the API endpoints and verify the responses.

3. **Database Verification**: When appropriate, tests verify that the database state has been updated correctly.

4. **Coverage Targets**: The test coverage targets are set to 70% for lines, statements, functions, and branches.

## Test Organization

Tests are organized by feature:

- **Health Check**: Tests that the API is running correctly
- **Employees API**: Tests for employee-related endpoints
- **Items API**: Tests for general items endpoints
- **Sick Leave Management**: Tests for sick leave request functionality
- **Asset Bookings**: Tests for booking assets like rooms or equipment
- **Education Activities**: Tests for education and social activities

## Adding New Tests

When adding new features, please follow these guidelines for adding tests:

1. Create a test file for the new feature in the `tests` directory
2. Follow the existing patterns for setting up test databases
3. Write tests for each new endpoint or functionality
4. Run the tests to verify that they pass
5. Check that the overall coverage meets the targets

## Troubleshooting

If you encounter issues with the tests:

- Make sure all dependencies are installed
- Verify that no tests are running simultaneously (which could cause port conflicts)
- Check that the database paths in the tests don't conflict with each other
- Look for leftover test database files that might not have been cleaned up properly 