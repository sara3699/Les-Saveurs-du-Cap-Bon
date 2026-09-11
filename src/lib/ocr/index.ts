import { demoOcr } from "./demo";
import { googleOcr } from "./google";
import type { OcrProvider } from "./types";

/**
 * One decision, made once, the same shape as `getRepositories()`.
 *
 * With a reader configured, receipts are read by it. Without one, they are read by the
 * demonstration reader and every screen says so. There is no third state and no silent
 * fallback that would let a demonstration figure pass for a real one.
 *
 * Both values are server-only. Neither is prefixed NEXT_PUBLIC_, so neither reaches the
 * browser, and `ocrIsDemo()` is what a screen asks instead of asking for the key.
 */
export function ocrProvider(): OcrProvider {
  const chosen = process.env.OCR_PROVIDER?.trim().toLowerCase();
  const key = process.env.GOOGLE_VISION_API_KEY?.trim();

  if (chosen === "google" && key) return googleOcr(key);
  return demoOcr;
}

export function ocrIsDemo(): boolean {
  return ocrProvider().demo;
}

/** What the screens print when no reader is configured. */
export const DEMO_OCR_NOTICE =
  "Mode démonstration : aucun service de lecture n'est configuré, les montants proposés sont inventés à partir du fichier et ne sont pas lus dessus. Corrigez-les avant d'enregistrer.";

export type { OcrProvider, OcrRequest, OcrResult } from "./types";
export { OcrUnavailable } from "./types";
