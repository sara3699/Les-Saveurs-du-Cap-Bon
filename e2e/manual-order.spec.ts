import { expect, test } from "@playwright/test";

/**
 * The order taken on the telephone. This is the screen the shop uses most, so it is
 * worth checking that it saves, that it refuses an empty order, and that a visit
 * through the demonstration door cannot write.
 */
async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

test("an order taken by hand is saved and appears in the list as Manuel", async ({ page }) => {
  await signIn(page, "sarra@saveurs-demo.tn", "kQ7-marsa-91");

  await page.goto("/orders");
  await page.getByRole("link", { name: "Nouvelle commande" }).first().click();
  await expect(page.getByRole("heading", { name: "Nouvelle commande" })).toBeVisible();

  // A customer already on file, found by name.
  await page.getByLabel("Chercher un client").fill("Rania");
  await page.getByRole("button", { name: /Rania Trabelsi/ }).first().click();

  // One article from the catalogue. Choosing it fills the name and the price.
  await page.getByLabel("Produit du catalogue").first().selectOption({ label: "Coffret gourmand" });
  await page.getByLabel("Quantité").first().fill("2");
  await expect(page.getByLabel("Nom de l'article").first()).toHaveValue("Coffret gourmand");

  await page.getByRole("button", { name: "Enregistrer la commande" }).click();

  const confirmation = page.getByText(/CMD-\d+/).first();
  await expect(confirmation).toBeVisible({ timeout: 20_000 });
  const reference = (await confirmation.innerText()).match(/CMD-\d+/)?.[0] ?? "";
  expect(reference).toMatch(/^CMD-/);

  await page.goto(`/orders?q=${reference}&period=90`);
  const row = page.locator("table tbody tr").filter({ hasText: reference }).first();
  await expect(row).toBeVisible();
  await expect(row).toContainText("Manuel");
  await expect(row).toContainText("Rania Trabelsi");
});

test("the demonstration door can fill the form in but not save it", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByText("Ou entrer en démonstration").click();
  await page.getByRole("button", { name: /Sarra/ }).first().click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  await page.goto("/orders/nouvelle");
  await expect(page.getByRole("heading", { name: "Nouvelle commande" })).toBeVisible();
  await expect(page.getByLabel("Chercher un client")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enregistrer la commande" })).toBeDisabled();
  await expect(page.getByText(/rien enregistrer/)).toBeVisible();
});
