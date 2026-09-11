import { expect, test } from "@playwright/test";
import { OWNER } from "../e2e/accounts";

test("capture the manual order screen", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1240, height: 1100 });
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(OWNER.email);
  await page.getByLabel("Mot de passe").fill(OWNER.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

  await page.goto("/orders/nouvelle", { waitUntil: "networkidle" });
  await page.getByLabel("Chercher un client").fill("Rania");
  await page.getByRole("button", { name: /Rania Trabelsi/ }).first().click();
  await page.getByLabel("Produit du catalogue").first().selectOption({ label: "Coffret gourmand" });
  await page.getByLabel("Quantité").first().fill("2");
  await page.waitForTimeout(300);
  await page.screenshot({ path: ".captures/manual-order.png", fullPage: true });
});
