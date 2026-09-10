import { defineConfig } from "@playwright/test";

/**
 * One browser, one journey. The point of this suite is not coverage, it is a
 * guard on the path an owner actually walks: see where orders came from, open
 * a request, give it an owner, and move the lead along.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3199",
    trace: "off",
  },
  webServer: {
    command: "npm run dev -- --port 3199",
    url: "http://localhost:3199/dashboard",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
