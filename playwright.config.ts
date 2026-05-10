import { defineConfig } from "@playwright/test";

export default defineConfig({
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "smoke",
      testDir: "./src/__tests__/smoke",
    },
    {
      name: "e2e",
      testDir: "./src/__tests__/e2e",
    },
    {
      name: "system",
      testDir: "./src/__tests__/system",
    },
    {
      name: "acceptance",
      testDir: "./src/__tests__/acceptance",
    },
    {
      name: "usability",
      testDir: "./src/__tests__/usability",
    },
    {
      name: "security",
      testDir: "./src/__tests__/security",
      testMatch: "*.spec.ts",
    },
  ],
});
