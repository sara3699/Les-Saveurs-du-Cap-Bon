import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { AGENT, OWNER } from "./accounts";

/**
 * Photographing a receipt into the shop's accounts.
 *
 * These run against the real demonstration database, so everything they file is
 * cleared away again afterwards. Each upload carries unique bytes, because the same
 * file cannot be filed twice and a fixed fixture would only work once.
 */

// Read from the working directory, because Playwright compiles this to CommonJS and
// import.meta is not available there. It always runs from the project root.
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const at = line.indexOf("=");
      return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
    }),
);

const MARK = "test-e2e-";

async function signIn(page: Page, who: { email: string; password: string }) {
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(who.email);
  await page.getByLabel("Mot de passe").fill(who.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

/** A PDF receipt whose bytes differ every run, so its fingerprint is new every run. */
function receiptPdf(stamp: string): Buffer {
  const lines = [
    "COMPTOIR EXEMPLE, GROS",
    "12 rue de l'Exemple, 8000 Nabeul",
    "Matricule fiscal : 9999101A/M/000",
    "--------------------------------",
    `Facture N ${stamp.slice(-6)}`,
    "Date : 04/03/2026    14:35",
    "--------------------------------",
    "3 x Pistaches decortiquees, kg   144,000",
    "1 x Miel de romarin, pot 1 kg   38,000",
    "--------------------------------",
    "SOUS-TOTAL HT        182,000",
    "TVA 19%              34,580",
    "TOTAL TTC            216,580",
    "Reglement : Carte bancaire",
    "Carte **** **** **** 4242",
    "--------------------------------",
    `Donnees de test ${stamp}`,
  ];
  const height = 48 + lines.length * 12;
  const body = [
    "BT",
    "/F1 8 Tf",
    ...lines.map((line, index) => `1 0 0 1 16 ${height - 26 - index * 12} Tm (${line}) Tj`),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 ${height}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`,
    `<< /Length ${body.length} >>\nstream\n${body}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
  ];
  let file = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(file.length);
    file += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefAt = file.length;
  file += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) file += `${String(offset).padStart(10, "0")} 00000 n \n`;
  file += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.from(file, "latin1");
}

test.afterAll(async () => {
  const owner = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  await owner.auth.signInWithPassword(OWNER);
  const { data } = await owner
    .from("receipts")
    .select("id, file_path")
    .like("file_name", `${MARK}%`);
  const rows = (data ?? []) as { id: string; file_path: string }[];
  if (rows.length === 0) return;
  await owner.storage.from("receipts").remove(rows.map((row) => row.file_path));
  await owner
    .from("receipts")
    .delete()
    .in("id", rows.map((row) => row.id));
  console.log(`Cleared ${rows.length} receipts filed by the tests.`);
});

test("a receipt is uploaded, read, corrected, verified, and lands in the totals", async ({ page }) => {
  await signIn(page, OWNER);

  const stamp = `${MARK}${Date.now()}`;
  await page.goto("/receipts/nouveau");
  await expect(page.getByRole("heading", { name: "Scanner un reçu" })).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: `${stamp}.pdf`,
    mimeType: "application/pdf",
    buffer: receiptPdf(stamp),
  });

  await expect(page.getByRole("button", { name: "Envoyer et lire le reçu" })).toBeVisible();
  await page.getByRole("button", { name: "Envoyer et lire le reçu" }).click();

  // The review screen, reached by itself once the reading is done.
  await expect(page).toHaveURL(/\/receipts\/[0-9a-f-]{36}/, { timeout: 45_000 });
  await page.waitForLoadState("networkidle");

  // The demonstration reader invents its figures, so what matters is that the pipeline
  // filled the form at all and that the reading is labelled as a demonstration.
  await expect(page.getByText(/Mode démonstration/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Les montants" })).toBeVisible();

  // Correcting a field is the whole point of this screen.
  const supplier = page.getByRole("textbox", { name: "Fournisseur", exact: true });
  await supplier.fill("Comptoir Exemple, corrigé");
  await page.getByRole("textbox", { name: "Total", exact: true }).fill("216.58");

  await page.getByRole("button", { name: "Confirmer et enregistrer" }).click();
  await expect(page.getByText("Reçu vérifié. Il compte maintenant dans les dépenses.")).toBeVisible({
    timeout: 20_000,
  });
  await page.waitForLoadState("networkidle");

  // What was typed survived the round trip, rather than only appearing to.
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Fournisseur", exact: true })).toHaveValue(
    "Comptoir Exemple, corrigé",
  );
  await expect(page.getByText("Corrigé à la main").first()).toBeVisible();

  await page.goto("/receipts?q=corrig%C3%A9");
  // Named, because the supplier panel on the same screen is a table too and its rows
  // carry the same supplier name.
  const row = page
    .getByRole("table", { name: "Les reçus" })
    .locator("tbody tr")
    .filter({ hasText: "Comptoir Exemple, corrigé" })
    .first();
  await expect(row).toBeVisible();
  await expect(row).toContainText("Vérifié");
});

test("a QR code on a photograph is read in the browser and shown before anything is sent", async ({
  page,
}) => {
  await signIn(page, OWNER);
  await page.goto("/receipts/nouveau");

  await page.locator('input[type="file"]').setInputFiles("e2e/fixtures/recu-qr.png");

  await expect(page.getByText("Contenu du code QR")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("FAC-2026-00412")).toBeVisible();
  await expect(page.getByText(/Conservé tel quel/)).toBeVisible();
});

test("a QR code drawn inside a PDF is read by the server and lands in a field", async ({ page }) => {
  // This one does more than the others: it uploads, and then the server draws the PDF
  // page and reads it. The default thirty seconds is not enough, especially on the first
  // run after a change, when the route is still being compiled.
  test.setTimeout(150_000);
  await signIn(page, OWNER);

  // The fixture's bytes are fixed, and the same file cannot be filed twice, so a comment
  // is appended past %%EOF. Readers stop at %%EOF, so the document is unchanged and its
  // fingerprint is new.
  const stamp = `${MARK}${Date.now()}`;
  const pdf = Buffer.concat([
    readFileSync("e2e/fixtures/recu-qr-vectoriel.pdf"),
    Buffer.from(`%${stamp}\n`, "latin1"),
  ]);

  await page.goto("/receipts/nouveau");
  await page.locator('input[type="file"]').setInputFiles({
    name: `${stamp}.pdf`,
    mimeType: "application/pdf",
    buffer: pdf,
  });

  // The browser cannot read a code inside a PDF, and says so rather than staying silent.
  await expect(page.getByText(/navigateur ne sait pas lire un code QR/)).toBeVisible();
  await expect(page.getByText("Contenu du code QR")).toHaveCount(0);

  await page.getByRole("button", { name: "Envoyer et lire le reçu" }).click();
  await expect(page).toHaveURL(/\/receipts\/[0-9a-f-]{36}/, { timeout: 60_000 });
  await page.waitForLoadState("networkidle");

  // This code is drawn as vector shapes, so there is no picture inside the PDF to pull
  // out. Only a reader that actually draws the page finds it. Seeing it in the box is
  // the proof that the server did.
  await expect(page.getByRole("textbox", { name: "Numéro du reçu", exact: true })).toHaveValue(
    "FAC-2026-00412",
  );
  await expect(page.getByText(/À relire/).first()).toBeVisible();
});

test("a file that is not what its name says is refused, in French", async ({ page }) => {
  await signIn(page, OWNER);
  await page.goto("/receipts/nouveau");

  await page.locator('input[type="file"]').setInputFiles("e2e/fixtures/pas-une-image.jpg");
  await page.getByRole("button", { name: "Envoyer et lire le reçu" }).click();

  await expect(page.getByText(/n'est pas une image ni un PDF lisible/)).toBeVisible({
    timeout: 20_000,
  });
});

test("a refused reading keeps the receipt and says what is missing", async ({ page }) => {
  await signIn(page, OWNER);

  await page.goto("/receipts?statut=error");
  const row = page.getByRole("table", { name: "Les reçus" }).locator("tbody tr").first();
  await expect(row).toBeVisible();
  await expect(row).toContainText("Erreur");
  await row.getByRole("link").first().click();

  // Refused, with reasons a person can act on rather than one technical sentence.
  await expect(page.getByText(/n'a pas pu être lu de façon fiable/)).toBeVisible();
  await expect(page.getByText(/À compléter :/)).toBeVisible();
  await expect(page.getByText(/Fournisseur, Total, Date d'achat/)).toBeVisible();

  // Nothing was thrown away: the file is still there and the form is still editable.
  await expect(page.getByText(/Rien n'a été perdu/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "L'original" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Relire le fichier" })).toBeEnabled();

  // And it counts towards nothing.
  await page.goto("/receipts");
  await expect(page.getByText("Dépenses vérifiées")).toBeVisible();
});

test("an agent files receipts but is shown no figures at all", async ({ page }) => {
  await signIn(page, AGENT);

  await page.goto("/receipts");
  await expect(page.getByRole("heading", { name: "Mes reçus" })).toBeVisible();
  await expect(page.getByText(/visibles que par la propriétaire/)).toBeVisible();
  await expect(page.getByText("Dépenses vérifiées")).toHaveCount(0);
  await expect(page.getByText("TVA totale")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Exporter en CSV" })).toHaveCount(0);

  // Scanning is open to them, because the team files the receipts.
  await page.getByRole("link", { name: "Scanner un reçu" }).first().click();
  await expect(page.getByRole("heading", { name: "Scanner un reçu" })).toBeVisible();
});

test("the demonstration door can look at a receipt and cannot change it", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByText("Ou entrer en démonstration").click();
  await page.getByRole("button", { name: /Sarra/ }).first().click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  await page.goto("/receipts");
  await expect(page.getByRole("heading", { name: "Reçus et dépenses" })).toBeVisible();

  await page.goto("/receipts/nouveau");
  await expect(page.getByText(/rien enregistrer/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Choisir un fichier" })).toHaveCount(0);
});

test("on a phone with no camera, the upload path is offered instead", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await signIn(page, OWNER);
  await page.goto("/receipts/nouveau");

  await page.getByRole("button", { name: "Scanner avec la caméra" }).click();

  // Headless Chromium has no camera, so whichever way it refuses, the way out is the same.
  await expect(
    page
      .getByRole("button", { name: "Déposer un fichier à la place" })
      .or(page.getByText(/Aucune caméra utilisable/))
      .first(),
  ).toBeVisible({ timeout: 20_000 });
});
