import { defineConfig, devices } from "@playwright/test";

const recorder = process.env.ANALYTICS_CLICKHOUSE_URL;

export default defineConfig({
  testDir: "e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  webServer: recorder
    ? {
        command: "node e2e/recorder.mts",
        url: recorder,
        reuseExistingServer: true,
      }
    : undefined,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: process.env.CI ? "on-first-retry" : "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      grepInvert: /@mobile/,
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
      grep: /@mobile|@responsive/,
    },
  ],
});
