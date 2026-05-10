import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/src/__tests__/e2e/",
    "/src/__tests__/smoke/",
    "/src/__tests__/system/",
    "/src/__tests__/acceptance/",
    "/src/__tests__/usability/",
    "/src/__tests__/security/",
  ],
};

export default config;
