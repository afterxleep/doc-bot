export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000
};