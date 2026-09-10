import { expect, test } from "@playwright/test";

test("capture the website connector card", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1300, height: 1100 });
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill("sarra@saveurs-demo.tn");
  await page.getByLabel("Mot de passe").fill("kQ7-marsa-91");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

  await page.goto("/integrations", { waitUntil: "networkidle" });
  const card = page.locator("section").filter({ hasText: "Formulaire du site" }).first();
  await expect(card).toBeVisible();
  await card.screenshot({ path: ".captures/connector-website.png" });
});
