import { expect, test } from "@playwright/test";
import { OWNER } from "../e2e/accounts";

const LIVE = "https://omnishop-ten.vercel.app";

test("the deployed site signs in and reads the database", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.goto(`${LIVE}/connexion`, { waitUntil: "networkidle" });
  await page.screenshot({ path: ".captures/live-connexion.png", fullPage: true });

  await page.getByLabel("Adresse e-mail").fill(OWNER.email);
  await page.getByLabel("Mot de passe").fill(OWNER.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });

  // Figures only exist if the deployed site really reached the database.
  const panel = page.locator("section").filter({ hasText: "D'où viennent vos commandes" }).first();
  await expect(panel).toBeVisible({ timeout: 30_000 });
  for (const platform of ["Site web", "WhatsApp", "Instagram", "Facebook", "Google", "Manuel"]) {
    await expect(panel.getByText(platform, { exact: true }).first()).toBeVisible();
  }
  await page.screenshot({ path: ".captures/live-dashboard.png", fullPage: true });
});
