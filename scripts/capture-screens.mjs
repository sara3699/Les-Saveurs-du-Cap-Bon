import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const SCREENS = [
  ["01-dashboard", "/dashboard"],
  ["02-products", "/products"],
  ["03-upsells", "/upsells"],
  ["04-statistics", "/statistics"],
  ["05-calculator", "/calculator"],
  ["06-budget", "/budget"],
  ["07-team", "/team"],
  ["08-store", "/store"],
  ["09-contacts", "/contacts"],
  ["10-contact-detail", "/contacts/ct_rania"],
  ["11-pipeline", "/pipeline"],
  ["12-tasks", "/tasks"],
  ["13-settings", "/settings"],
];

const base = process.env.BASE_URL ?? "http://localhost:3199";
const out = ".captures";
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 2,
});

for (const [name, route] of SCREENS) {
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  console.log("captured", name, route);
}

await browser.close();
