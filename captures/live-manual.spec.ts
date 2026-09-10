import { expect, test } from "@playwright/test";
const LIVE = "https://omnishop-ten.vercel.app";

test("the deployed site can take an order by hand", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(`${LIVE}/connexion`);
  await page.getByLabel("Adresse e-mail").fill("sarra@saveurs-demo.tn");
  await page.getByLabel("Mot de passe").fill("kQ7-marsa-91");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });

  await page.goto(`${LIVE}/orders/nouvelle`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Nouvelle commande" })).toBeVisible();
  await page.getByLabel("Chercher un client").fill("Rania");
  await page.getByRole("button", { name: /Rania Trabelsi/ }).first().click();
  await page.getByLabel("Produit du catalogue").first().selectOption({ label: "Coffret gourmand" });
  await page.getByRole("button", { name: "Enregistrer la commande" }).click();
  await expect(page.getByText(/CMD-\d+/).first()).toBeVisible({ timeout: 60_000 });
});
