module.exports = {
  preset: 'ts-jest',
  testTimeout: 20000,
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/test/fixtures'],
  coveragePathIgnorePatterns: ['<rootDir>/test/'],
};
