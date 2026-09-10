import { test } from "@playwright/test";

const SCREENS: [string, string][] = [
  ["01-dashboard", "/dashboard"],
  ["02-produits", "/products"],
  ["03-commandes", "/orders"],
  ["04-boite-de-reception", "/inbox"],
  ["05-equipe", "/team"],
  ["06-statistiques", "/statistics"],
  ["07-pipeline", "/pipeline"],
  ["08-taches", "/tasks"],
  ["09-contacts", "/contacts"],
  ["10-integrations", "/integrations"],
  ["11-boutique", "/store"],
  ["12-parametres", "/settings"],
];

test("capture every screen", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 1100 });

  await page.goto("/connexion", { waitUntil: "networkidle" });
  await page.screenshot({ path: ".captures/00-connexion.png", fullPage: true });

  await page.getByRole("button", { name: "Entrer comme Sarra" }).click();
  await page.waitForURL(/\/dashboard/);

  for (const [name, route] of SCREENS) {
    await page.goto(route, { waitUntil: "networkidle" });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `.captures/${name}.png`, fullPage: true });
  }
});
