// backend/jest.config.js
export default {
  testEnvironment: 'node',
  // We use pure ESM in this project; no transpilation needed.
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/tests/**/*.test.js'],
  coverageProvider: 'v8',
  verbose: true,
}