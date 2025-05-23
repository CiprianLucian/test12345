module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js', '**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'index.js',
    '!init-db.js',
    '!seed-data.js',
    '!seed-sick-leave.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/jest.config.js',
    '!**/db/**',
    '!**/public/**'
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 25,
      lines: 25,
      statements: 25
    }
  },
  testPathIgnorePatterns: ['/node_modules/'],
  moduleFileExtensions: ['js', 'json', 'node'],
  verbose: true
}; 