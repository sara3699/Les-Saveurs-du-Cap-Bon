import { test } from "@playwright/test";

test("capture the sign in screen", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto("/connexion", { waitUntil: "networkidle" });
  await page.screenshot({ path: ".captures/00-connexion.png", fullPage: true });
  await page.getByText("Ou entrer en démonstration").click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: ".captures/00-connexion-ouvert.png", fullPage: true });
});
