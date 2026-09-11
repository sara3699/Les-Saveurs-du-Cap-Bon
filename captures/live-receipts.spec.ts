import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

/**
 * Receipts, against the deployed site rather than a local server.
 *
 * This exists for one thing that cannot be checked any other way. Reading a QR code out
 * of a PDF needs two WebAssembly files on the server, nothing imports them, so nothing
 * traces them automatically, and `next.config.ts` names them by hand. If that naming is
 * wrong the build still succeeds, the screens still work, and every PDF quietly reports
 * no code. Only a real deployment can tell you.
 *
 * The code in this fixture is drawn as vector shapes, so it is invisible to anything
 * that only pulls pictures out of a PDF. Seeing it in the box means the page was really
 * drawn on the server, which means both files arrived.
 *
 * It files a receipt in the live demonstration shop and clears it away afterwards.
 */
const LIVE = "https://omnishop-ten.vercel.app";
const OWNER = { email: "sarra@saveurs-demo.tn", password: "kQ7-marsa-91" };
const MARK = "test-live-";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const at = line.indexOf("=");
      return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
    }),
);

test.afterAll(async () => {
  const owner = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  await owner.auth.signInWithPassword(OWNER);
  const { data } = await owner.from("receipts").select("id, file_path").like("file_name", `${MARK}%`);
  const rows = (data ?? []) as { id: string; file_path: string }[];
  if (rows.length === 0) return;
  await owner.storage.from("receipts").remove(rows.map((row) => row.file_path));
  await owner.from("receipts").delete().in("id", rows.map((row) => row.id));
  console.log(`Cleared ${rows.length} receipts filed against the deployed site.`);
});

test("the deployed site reads a QR code drawn inside a PDF", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.goto(`${LIVE}/connexion`, { waitUntil: "networkidle" });
  await page.getByLabel("Adresse e-mail").fill(OWNER.email);
  await page.getByLabel("Mot de passe").fill(OWNER.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });

  await page.goto(`${LIVE}/receipts`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Reçus et dépenses" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Dépenses vérifiées")).toBeVisible();
  await page.screenshot({ path: ".captures/live-receipts.png", fullPage: true });

  // Unique bytes, because the same file cannot be filed twice. A comment past %%EOF
  // changes the fingerprint and leaves the document itself untouched.
  const stamp = `${MARK}${Date.now()}`;
  const pdf = Buffer.concat([
    readFileSync("e2e/fixtures/recu-qr-vectoriel.pdf"),
    Buffer.from(`%${stamp}\n`, "latin1"),
  ]);

  await page.goto(`${LIVE}/receipts/nouveau`, { waitUntil: "networkidle" });
  await page.locator('input[type="file"]').setInputFiles({
    name: `${stamp}.pdf`,
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await page.getByRole("button", { name: "Envoyer et lire le reçu" }).click();

  await expect(page).toHaveURL(/\/receipts\/[0-9a-f-]{36}/, { timeout: 120_000 });
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("textbox", { name: "Numéro du reçu", exact: true })).toHaveValue(
    "FAC-2026-00412",
    { timeout: 30_000 },
  );
  await page.screenshot({ path: ".captures/live-receipt-review.png", fullPage: true });
});
