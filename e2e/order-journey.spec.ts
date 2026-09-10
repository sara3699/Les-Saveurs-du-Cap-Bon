import { expect, test } from "@playwright/test";

/**
 * The journey an owner walks on the first morning: see which platform the
 * orders came from, open a request, give it an owner, then move the lead along.
 *
 * The screens are in French, so the assertions read the French wording. Brand
 * names (WhatsApp, Instagram, Facebook, Google) and people's names are the same
 * in both languages and are asserted as they are.
 */

/**
 * Every screen sits behind the démonstration sign-in, so each test enters as the
 * owner first. Sarra is the owner and sees everything, which is what these
 * journeys check.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/connexion");
  await page.getByRole("button", { name: "Entrer comme Sarra" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("the dashboard names every platform the orders came from", async ({ page }) => {
  await page.goto("/dashboard");

  const panel = page.locator("section", { hasText: "D'où viennent vos commandes" }).first();
  await expect(panel).toBeVisible();

  for (const platform of ["Site web", "WhatsApp", "Instagram", "Facebook", "Google", "Manuel"]) {
    await expect(panel.getByText(platform, { exact: true }).first()).toBeVisible();
  }

  // The failure this product exists to prevent, in either language.
  for (const vague of ["Online", "Other", "Unknown", "En ligne", "Autre", "Inconnu"]) {
    await expect(page.getByText(vague, { exact: true })).toHaveCount(0);
  }
});

test("orders keep the platform they arrived on when filtered and opened", async ({ page }) => {
  await page.goto("/orders?source=whatsapp&period=30");

  const rows = page.locator("table tbody tr");
  await expect(rows.first()).toBeVisible();
  const count = await rows.count();
  expect(count).toBeGreaterThan(3);

  for (let i = 0; i < Math.min(count, 8); i++) {
    await expect(rows.nth(i)).toContainText("WhatsApp");
  }

  await rows.first().getByRole("link").first().click();
  await expect(page.getByText("D'où vient cette commande")).toBeVisible();
  await expect(page.getByText("Compte connecté")).toBeVisible();
  await expect(page.getByText("WhatsApp Business Les Saveurs").first()).toBeVisible();
});

test("a conversation can be opened and given an owner", async ({ page }) => {
  await page.goto("/inbox");

  await page.getByRole("link", { name: /Rania Trabelsi/ }).first().click();
  await expect(page.getByRole("heading", { name: "Rania Trabelsi" })).toBeVisible();
  await expect(
    page.getByText("Bonjour, est-ce que la creme de pistache est toujours disponible ?"),
  ).toBeVisible();

  await page.getByLabel("Attribuer à").selectOption({ label: "Khaled Mansouri" });
  await expect(page.getByRole("status")).toContainText("Attribué à Khaled Mansouri");
  await expect(page.getByText("Responsable : Khaled Mansouri")).toBeVisible();
});

test("a channel that is not connected cannot be replied to", async ({ page }) => {
  await page.goto("/inbox?c=cv_02");

  await expect(page.getByRole("heading", { name: "Yosr Mahfoudh" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Envoyer" })).toBeDisabled();
  await expect(
    page.getByText(/Le compte professionnel Instagram n'est pas connecté/),
  ).toBeVisible();
});

test("dashboard shows team call conversion", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByText("Conversion des appels en commandes")).toBeVisible();
  await expect(page.getByText("Appels reçus", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Clients gagnés", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Commandes passées", { exact: true }).first()).toBeVisible();
});

test("products page uses the Les Saveurs demo catalog", async ({ page }) => {
  await page.goto("/products");

  await expect(page.getByText("Creme de pistache", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/signaux publics visibles sur Instagram/)).toBeVisible();
});

test("a lead can be moved a stage and the move can be undone", async ({ page }) => {
  await page.goto("/pipeline");

  const card = page.locator("article").filter({ hasText: "Rania Trabelsi" }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText("WhatsApp");

  await page.getByRole("button", { name: "Faire passer Rania Trabelsi a Devis" }).click();

  const receipt = page.getByRole("status").filter({ hasText: "passe de Qualifié" });
  await expect(receipt).toContainText("Rania Trabelsi passe de Qualifié a Devis");
  await expect(receipt).toContainText("garde pour cette visite seulement");

  await receipt.getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByRole("button", { name: "Faire passer Rania Trabelsi a Devis" })).toBeVisible();
});

test("a call can be recorded by hand and undone", async ({ page }) => {
  await page.goto("/team");

  const panel = page
    .locator("section")
    .filter({ hasText: "Performance de conversion des appels" })
    .first();
  await expect(panel.getByText("100").first()).toBeVisible();

  await panel.getByLabel("Qui a pris l'appel").selectOption({ label: "Sarra" });
  await panel.getByRole("button", { name: "Ajouter cet appel" }).click();

  await expect(panel.getByText("1 appel ajouté sur cette visite")).toBeVisible();
  await expect(panel.getByText("Rien n'est enregistré.")).toBeVisible();
  await expect(panel.getByText("101").first()).toBeVisible();

  await panel.getByRole("button", { name: "Annuler le dernier" }).click();
  await expect(panel.getByText("100").first()).toBeVisible();
});


test("the workspace cannot be opened without choosing a person", async ({ context }) => {
  const fresh = await context.browser()!.newContext();
  const page = await fresh.newPage();

  await page.goto("http://localhost:3199/orders");
  await expect(page).toHaveURL(/\/connexion/);
  await expect(page.getByText("Démonstration, aucun mot de passe et aucun compte réel")).toBeVisible();

  await fresh.close();
});

test("an agent does not see the shop figures the owner sees", async ({ context }) => {
  const fresh = await context.browser()!.newContext();
  const page = await fresh.newPage();

  await page.goto("http://localhost:3199/connexion");
  await page.getByRole("button", { name: "Entrer comme Mouna" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const nav = page.getByRole("navigation", { name: "Navigation principale", exact: true });
  await expect(nav.getByRole("link", { name: "Boîte de réception" })).toBeVisible();
  for (const hidden of ["Gestion du budget", "Statistiques", "Paramètres", "Équipe"]) {
    await expect(nav.getByRole("link", { name: hidden })).toHaveCount(0);
  }

  await page.goto("http://localhost:3199/dashboard");
  await expect(page.getByText("Mouna Sassi").first()).toBeVisible();

  await fresh.close();
});
