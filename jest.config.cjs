// jest.config.js
module.exports = {
  testEnvironment: "jest-environment-jsdom", // For React components
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest", // Transform JSX/TSX
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(js|ts)x?$", // Test file pattern
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"], // Optional setup file
  moduleNameMapper: {
  "^@/(.*)$": "<rootDir>/src/$1"
},
}
