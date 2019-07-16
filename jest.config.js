// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "build/coverage",

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    "/node_modules/"
  ],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    "text",
    "lcov",
  ],

  // Make calling deprecated APIs throw helpful error messages
  errorOnDeprecated: true,

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: [
    "node_modules"
  ],

  // An array of file extensions your modules use
  moduleFileExtensions: [
    "js",
  ],

  // Automatically reset mock state between every test
  resetMocks: true,

  // Reset the module registry before running each individual test
  resetModules: true,

  // Automatically restore mock state between every test
  restoreMocks: true,

  // The test environment that will be used for testing
  testEnvironment: "jest-environment-jsdom",

  // Adds a location field to test results
  testLocationInResults: true,

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/test/js/**/*.js",
  ],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    "/node_modules/"
  ],

};
