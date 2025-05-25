import { m } from "framer-motion";
import { createDefaultPreset } from "ts-jest";


const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
const config = {
  testEnvironment: "jest-environment-jsdom",
  transform: {
    ...tsJestTransformCfg,
  },
  
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  
  setupFiles: ['./jest.setup.ts'],

  collectCoverage: true,
  coverageDirectory: "coverage",
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
  },
};

export default config;
