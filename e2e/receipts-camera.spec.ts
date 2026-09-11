import { expect, test } from "@playwright/test";
import { OWNER } from "./accounts";

/**
 * The camera, driven by a fake one.
 *
 * Chromium accepts a raw Y4M file in place of a webcam, so the whole live path runs for
 * real: permission, the video element, frames pulled off it, the reader, and the still
 * frame that becomes the receipt. Live scanning is the headline action of this feature
 * and this is the only way to exercise it without a physical phone.
 *
 * It lives in its own file because `launchOptions` forces a new worker and Playwright
 * only accepts it at the top level. Keeping it separate also leaves the no-camera
 * fallback test in `receipts.spec.ts` running on a browser that really has no camera,
 * which is the point of that one.
 */
test.use({
  permissions: ["camera"],
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--use-file-for-fake-video-capture=e2e/fixtures/camera-qr.y4m",
    ],
  },
});

test("the camera finds a code and keeps that frame as the photograph", async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(OWNER.email);
  await page.getByLabel("Mot de passe").fill(OWNER.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  await page.goto("/receipts/nouveau");
  await page.getByRole("button", { name: "Scanner avec la caméra" }).click();

  // The camera opened rather than falling back to the file picker.
  await expect(page.getByRole("button", { name: "Prendre la photo" })).toBeEnabled({
    timeout: 30_000,
  });

  // Read off the live frames, before any photograph is taken.
  await expect(page.getByText(/Code QR trouvé/)).toBeVisible({ timeout: 30_000 });

  // The frame that held the code becomes the receipt, so nobody has to aim twice.
  await page.getByRole("button", { name: "Prendre la photo" }).click();
  await expect(page.getByText("Contenu du code QR")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("FAC-2026-00412")).toBeVisible();
  await expect(page.getByText(/code QR lu/)).toBeVisible();
});
