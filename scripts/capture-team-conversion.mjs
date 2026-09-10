import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });
await page.goto(`${process.env.BASE_URL ?? "http://localhost:3199"}/team`, { waitUntil: "networkidle" });
const card = page.locator("section").filter({ hasText: "Call conversion performance" }).first();
await card.screenshot({ path: ".captures/team-conversion.png" });
await browser.close();
console.log("done");
