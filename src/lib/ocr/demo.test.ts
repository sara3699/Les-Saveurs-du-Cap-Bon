import { describe, expect, it } from "vitest";
import { extractReceipt } from "@/lib/receipts/extract";
import { checkTotals } from "@/lib/receipts/totals";
import { demoOcr, demoReceiptText } from "./demo";
import { ocrIsDemo, ocrProvider } from "./index";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const WHEN = new Date("2026-03-04T10:00:00Z");

describe("the demonstration reader", () => {
  it("answers the same way for the same file, every time", () => {
    const first = demoReceiptText(HASH_A, WHEN);
    const second = demoReceiptText(HASH_A, WHEN);
    expect(first.text).toBe(second.text);
    expect(first.confidence).toBe(second.confidence);
  });

  it("answers differently for a different file", () => {
    expect(demoReceiptText(HASH_A, WHEN).text).not.toBe(demoReceiptText(HASH_B, WHEN).text);
  });

  it("says on the receipt itself that nothing was really read", () => {
    expect(demoReceiptText(HASH_A, WHEN).text).toContain("Données d'exemple");
  });

  it("names no real company, and no tax number that could belong to one", () => {
    for (let seed = 0; seed < 40; seed += 1) {
      const { text } = demoReceiptText(`${seed}`.padStart(64, "0"), WHEN);
      const taxLine = text.split("\n").find((line) => line.startsWith("Matricule fiscal"));
      expect(taxLine).toMatch(/9999/);
      expect(text).toMatch(/exemple/i);
    }
  });

  it("marks itself as a demonstration on every answer", async () => {
    const result = await demoOcr.extract({
      bytes: new Uint8Array(8),
      mime: "image/jpeg",
      fileName: "recu.jpg",
      fileHash: HASH_A,
    });
    expect(result.demo).toBe(true);
    expect(result.provider).toBe("demo");
  });

  it("takes every format, HEIC included, because it never opens the file", () => {
    for (const mime of ["image/jpeg", "image/png", "image/heic", "application/pdf"]) {
      expect(demoOcr.accepts(mime)).toBe(true);
    }
  });
});

describe("the demonstration reader against the real pipeline", () => {
  it("produces receipts the real extractor can actually read", () => {
    let readable = 0;
    for (let seed = 0; seed < 30; seed += 1) {
      const { text } = demoReceiptText(`${seed}`.padStart(64, "f"), WHEN);
      const extracted = extractReceipt(text);
      if (
        extracted.merchant_name &&
        extracted.purchase_date &&
        extracted.total_amount !== null &&
        extracted.items.length > 0
      ) {
        readable += 1;
      }
    }
    // Not all of them: about one in six is deliberately smudged, so the low-confidence
    // and error states are visible in the demonstration rather than only described.
    expect(readable).toBeGreaterThanOrEqual(20);
  });

  it("produces receipts that add up, when they were not smudged", () => {
    const { text, confidence } = demoReceiptText("c".repeat(64), WHEN);
    if (confidence < 0.7) return;
    const extracted = extractReceipt(text);
    const check = checkTotals({
      subtotal: extracted.subtotal,
      discount: extracted.discount,
      taxAmount: extracted.tax_amount,
      tipAmount: extracted.tip_amount,
      totalAmount: extracted.total_amount,
    });
    expect(check.balanced).toBe(true);
  });
});

describe("choosing a reader", () => {
  it("uses the demonstration reader when nothing is configured", () => {
    delete process.env.OCR_PROVIDER;
    delete process.env.GOOGLE_VISION_API_KEY;
    expect(ocrProvider().name).toBe("demo");
    expect(ocrIsDemo()).toBe(true);
  });

  it("does not use a live reader when the key is missing, whatever the setting says", () => {
    process.env.OCR_PROVIDER = "google";
    delete process.env.GOOGLE_VISION_API_KEY;
    expect(ocrProvider().name).toBe("demo");
    expect(ocrIsDemo()).toBe(true);
    delete process.env.OCR_PROVIDER;
  });

  it("uses the live reader only when both are set", () => {
    process.env.OCR_PROVIDER = "google";
    process.env.GOOGLE_VISION_API_KEY = "not-a-real-key";
    expect(ocrProvider().name).toBe("google-vision");
    expect(ocrIsDemo()).toBe(false);
    delete process.env.OCR_PROVIDER;
    delete process.env.GOOGLE_VISION_API_KEY;
  });
});
