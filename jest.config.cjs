module.exports = {
  testEnvironment: "jest-environment-jsdom",
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.test.{js,ts,jsx,tsx}",
    "!src/**/__tests__/*",
    "!src/**/__mocks__/*",
  ],
};
