export default {
  testEnvironment: "jest-environment-jsdom",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
  },
    transformIgnorePatterns: [
    "/node_modules/(?!@babel)"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/build/",
    "<rootDir>/dist/"
  ],



  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
   setupFiles: ['./jest.setup.js'],
};
