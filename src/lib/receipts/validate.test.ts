import { describe, expect, it } from "vitest";
import type { Extraction } from "./extract";
import { extractReceipt } from "./extract";
import { judgeExtraction, rejectionNote } from "./validate";

const GOOD_RECEIPT = `COMPTOIR EXEMPLE
12 rue de l'Exemple, 8000 Nabeul
Facture N 2412
Date : 04/03/2026    14:35
3 x Pistaches, kg   144,000
SOUS-TOTAL HT        182,000
TVA 19%              34,580
TOTAL TTC            216,580`;

function judge(rawText: string, over: Partial<Extraction> = {}) {
  const extraction = { ...extractReceipt(rawText), ...over };
  return judgeExtraction({ extraction, rawText, fallbackCurrency: "TND" });
}

describe("a receipt that reads cleanly", () => {
  const verdict = judge(GOOD_RECEIPT);

  it("is accepted", () => {
    expect(verdict.status).toBe("extracted");
    expect(verdict.reasons).toEqual([]);
    expect(verdict.missingFields).toEqual([]);
  });

  it("carries a confidence for the whole reading", () => {
    expect(verdict.confidence).toBeGreaterThan(0);
    expect(verdict.confidence).toBeLessThanOrEqual(1);
  });
});

describe("what gets a receipt rejected", () => {
  it("refuses one with no supplier, and names the field", () => {
    const verdict = judge(GOOD_RECEIPT, { merchant_name: null });
    expect(verdict.status).toBe("rejected");
    expect(verdict.missingFields).toContain("merchant_name");
    expect(verdict.reasons.map((r) => r.code)).toContain("merchant_missing");
  });

  it("refuses one with no total", () => {
    const verdict = judge(GOOD_RECEIPT, { total_amount: null });
    expect(verdict.status).toBe("rejected");
    expect(verdict.missingFields).toContain("total_amount");
  });

  it("refuses one with no date", () => {
    const verdict = judge(GOOD_RECEIPT, { purchase_date: null });
    expect(verdict.status).toBe("rejected");
    expect(verdict.missingFields).toContain("purchase_date");
  });

  it("refuses a page it could not read, and says that once rather than listing every field", () => {
    const verdict = judge("...");
    expect(verdict.status).toBe("rejected");
    expect(verdict.reasons.map((r) => r.code)).toEqual(["unreadable"]);
    // The fields are still reported, because the review screen highlights them.
    expect(verdict.missingFields.length).toBeGreaterThan(0);
  });

  it("refuses a currency nobody can make sense of", () => {
    const verdict = judgeExtraction({
      extraction: { ...extractReceipt(GOOD_RECEIPT), currency: "dinars?" },
      rawText: GOOD_RECEIPT,
      fallbackCurrency: "TND",
    });
    expect(verdict.reasons.map((r) => r.code)).toContain("currency_unknown");
  });
});

describe("what does not get a receipt rejected", () => {
  it("accepts a receipt that names no currency, using the shop's own", () => {
    const verdict = judge(GOOD_RECEIPT, { currency: null });
    expect(verdict.status).toBe("extracted");
    expect(verdict.reasons).toEqual([]);
  });

  it("accepts sums that do not add up when the reading was otherwise confident", () => {
    const verdict = judge(GOOD_RECEIPT, { total_amount: 999, confidence: 0.95 });
    expect(verdict.status).toBe("extracted");
  });

  it("refuses sums that do not add up only when the reading was also shaky", () => {
    const verdict = judge(GOOD_RECEIPT, { total_amount: 999, confidence: 0.2 });
    expect(verdict.status).toBe("rejected");
    expect(verdict.reasons.map((r) => r.code)).toContain("totals_conflict");
  });
});

describe("the note kept with a rejected receipt", () => {
  it("opens with the agreed sentence and adds the detail", () => {
    const verdict = judge(GOOD_RECEIPT, { merchant_name: null });
    const note = rejectionNote(verdict);
    expect(note).toMatch(/^Receipt could not be reliably parsed\./);
    expect(note).toMatch(/fournisseur/);
  });

  it("never echoes anything read off the page back into itself", () => {
    const nasty = `<script>alert(1)</script>
Date : 04/03/2026
TOTAL TTC 216,580`;
    const verdict = judge(nasty, { merchant_name: "<script>alert(1)</script>", total_amount: null });
    const note = rejectionNote(verdict);
    expect(note).not.toContain("<script>");
    expect(note).not.toContain("alert");
  });

  it("stays short enough for a dashboard", () => {
    const verdict = judge("...");
    expect(rejectionNote(verdict).length).toBeLessThanOrEqual(500);
  });
});
