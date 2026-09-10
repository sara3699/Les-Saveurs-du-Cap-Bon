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
/**
 * Every screen sits behind the sign in. These journeys use the owner's real
 * account, because a signed in visit is the one that writes to the database, and
 * writing is what most of these journeys check.
 */
async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

test.beforeEach(async ({ page }) => {
  await signIn(page, "sarra@saveurs-demo.tn", "kQ7-marsa-91");
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
  await expect(page.getByRole("listitem").filter({ hasText: /./ }).first()).toBeVisible();

  await page.getByLabel("Attribuer à").selectOption({ label: "Khaled Mansouri" });
  await expect(page.getByRole("status")).toContainText("Attribué à Khaled Mansouri");
  await expect(page.getByText("Responsable : Khaled Mansouri")).toBeVisible();
});

test("a channel that is not connected cannot be replied to", async ({ page }) => {
  await page.goto("/inbox");
  await page.getByRole("link", { name: /Yosr Mahfoudh/ }).first().click();

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

  await expect(page.getByText("Crème de pistache", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/signaux publics visibles sur Instagram/)).toBeVisible();
});

test("a lead can be moved a stage and the move can be undone", async ({ page }) => {
  await page.goto("/pipeline");

  const card = page.locator("article").filter({ hasText: "Rania Trabelsi" }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText("WhatsApp");

  // Which column she starts in is whatever the shop last left her in, so the test
  // takes the move button that is actually offered rather than naming a stage.
  const moveRight = page.getByRole("button", { name: /^Faire passer Rania Trabelsi à / });
  const label = (await moveRight.getAttribute("aria-label")) ?? "";
  await moveRight.click();

  const receipt = page.getByRole("status").filter({ hasText: "Rania Trabelsi passe de" });
  await expect(receipt).toContainText("enregistré");

  // Undo writes the return move, so the board and the database agree again and the
  // same button is offered once more.
  await receipt.getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByRole("button", { name: label })).toBeVisible();
  await page.waitForLoadState("networkidle");
});

test("a call can be recorded by hand and undone", async ({ page }) => {
  await page.goto("/team");

  const panel = page
    .locator("section")
    .filter({ hasText: "Performance de conversion des appels" })
    .first();

  // A signed in visit writes to the database, so the starting figure is whatever
  // the shop has recorded so far, not a number this test can hard code.
  const tile = panel
    .locator("div")
    .filter({ has: page.getByText("Appels reçus", { exact: true }) })
    .filter({ hasText: /total de l/ })
    .last();
  const before = Number((await tile.innerText()).match(/\d+/)?.[0] ?? "0");
  expect(before).toBeGreaterThan(0);

  await panel.getByLabel("Qui a pris l'appel").selectOption({ label: "Sarra" });
  await panel.getByRole("button", { name: "Ajouter cet appel" }).click();

  await expect(panel.getByText(/1 appel enregistré/)).toBeVisible();
  await expect(panel.getByText(/^Chaque appel est écrit dans la base de données/)).toBeVisible();
  await expect(tile).toContainText(String(before + 1));

  // Undo removes the row it just wrote, so the shop is left exactly as it was.
  await panel.getByRole("button", { name: "Annuler le dernier" }).click();
  await expect(tile).toContainText(String(before));
  await page.waitForLoadState("networkidle");
});

test("the workspace cannot be opened without choosing a person", async ({ context }) => {
  const fresh = await context.browser()!.newContext();
  const page = await fresh.newPage();

  await page.goto("http://localhost:3199/orders");
  await expect(page).toHaveURL(/\/connexion/);
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();

  await fresh.close();
});

test("an agent does not see the shop figures the owner sees", async ({ context }) => {
  const fresh = await context.browser()!.newContext();
  const page = await fresh.newPage();

  await page.goto("http://localhost:3199/connexion");
  await page.getByLabel("Adresse e-mail").fill("mouna@saveurs-demo.tn");
  await page.getByLabel("Mot de passe").fill("pT9-korba-52");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  const nav = page.getByRole("navigation", { name: "Navigation principale", exact: true });
  await expect(nav.getByRole("link", { name: "Boîte de réception" })).toBeVisible();
  for (const hidden of ["Gestion du budget", "Statistiques", "Paramètres", "Équipe"]) {
    await expect(nav.getByRole("link", { name: hidden })).toHaveCount(0);
  }

  await page.goto("http://localhost:3199/dashboard");
  await expect(page.getByText("Mouna Sassi").first()).toBeVisible();

  await fresh.close();
});
