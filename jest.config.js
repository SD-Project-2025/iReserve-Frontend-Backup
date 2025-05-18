export default {
  testEnvironment: "jest-environment-jsdom",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
  },

  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
   setupFiles: ['./jest.setup.js'],
};

// jest.config.js
// Compare this snippet from babel.config.cjs:
  // transformIgnorePatterns: [
  //   "/node_modules/(?!@babel)"
  // ],
