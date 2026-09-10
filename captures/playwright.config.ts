import { defineConfig } from "@playwright/test";

/** Screenshots for review. Separate from the journey suite so it never runs by accident. */
export default defineConfig({
  testDir: ".",
  timeout: 180_000,
  reporter: [["line"]],
  use: { baseURL: "http://localhost:3199", deviceScaleFactor: 2 },
  webServer: {
    command: "npm run dev -- --port 3199",
    url: "http://localhost:3199/connexion",
    reuseExistingServer: true,
    cwd: "..",
    timeout: 120_000,
  },
});
