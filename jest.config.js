/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html'],
};
