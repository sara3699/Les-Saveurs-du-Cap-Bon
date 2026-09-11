import { describe, expect, it } from "vitest";
import { LOW_CONFIDENCE } from "@/lib/domain/receipts";
import { extractReceipt } from "./extract";
import { parseQrPayload } from "./qr";

const FRENCH_RECEIPT = `COMPTOIR EXEMPLE
12 rue de l'Exemple, 8000 Nabeul
Matricule fiscal : 9999101A/M/000
--------------------------------
Facture N° 2412
Date : 04/03/2026    14:35
--------------------------------
3 x Pistaches décortiquées, kg   144,000
1 x Miel de romarin, pot 1 kg   38,000
--------------------------------
SOUS-TOTAL HT        182,000
TVA 19%              34,580
TOTAL TTC            216,580
Règlement : Carte bancaire
Carte **** **** **** 4242
--------------------------------
Merci de votre confiance`;

const ENGLISH_RECEIPT = `GREEN GROCER EXEMPLE
44 Market Street
Invoice No 8871
Date: March 12, 2026  09:15
2 x Almonds, kg   65.00
SUBTOTAL   65.00
VAT 20%   13.00
TOTAL   78.00
Paid by card`;

describe("extractReceipt on a French receipt", () => {
  const result = extractReceipt(FRENCH_RECEIPT);

  it("finds who it is from", () => {
    expect(result.merchant_name).toBe("COMPTOIR EXEMPLE");
    expect(result.merchant_address).toContain("Nabeul");
    expect(result.tax_identifier).toBe("9999101A/M/000");
  });

  it("finds when and which receipt", () => {
    expect(result.purchase_date).toBe("2026-03-04");
    expect(result.purchase_time).toBe("14:35");
    expect(result.receipt_number).toBe("2412");
  });

  it("tells the total from the sous-total", () => {
    expect(result.total_amount).toBe(216.58);
    expect(result.subtotal).toBe(182);
    expect(result.tax_amount).toBe(34.58);
  });

  it("keeps four digits of the card and no more", () => {
    expect(result.card_last_four).toBe("4242");
    expect(result.payment_method).toBe("Carte bancaire");
  });

  it("reads the articles and not the totals", () => {
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({ quantity: 3, total_amount: 144 });
    expect(result.items[0].description).toContain("Pistaches");
    expect(result.items.map((item) => item.description).join(" ")).not.toMatch(/TVA|TOTAL/i);
  });

  it("reports a confidence for every field it found", () => {
    expect(result.fields.length).toBeGreaterThan(6);
    for (const field of result.fields) {
      expect(field.confidence).toBeGreaterThan(0);
      expect(field.confidence).toBeLessThanOrEqual(1);
      expect(field.normalized_value).not.toBeNull();
    }
    expect(result.confidence).toBeGreaterThan(0.5);
  });
});

describe("extractReceipt on an English receipt", () => {
  const result = extractReceipt(ENGLISH_RECEIPT);

  it("reads the month name and the dot decimal", () => {
    expect(result.purchase_date).toBe("2026-03-12");
    expect(result.total_amount).toBe(78);
    expect(result.subtotal).toBe(65);
    expect(result.tax_amount).toBe(13);
  });
});

describe("extractReceipt when there is nothing to read", () => {
  it("returns nulls and a confidence of zero rather than guesses", () => {
    const result = extractReceipt("");
    expect(result.total_amount).toBeNull();
    expect(result.merchant_name).toBeNull();
    expect(result.items).toEqual([]);
    expect(result.fields).toEqual([]);
    expect(result.confidence).toBe(0);
  });

  it("reports a low confidence when only one thing was recognised", () => {
    const result = extractReceipt("COMPTOIR EXEMPLE");
    expect(result.merchant_name).toBe("COMPTOIR EXEMPLE");
    expect(result.confidence).toBeLessThan(0.3);
  });
});

describe("extractReceipt with a QR code as well", () => {
  it("lets the till's own code overrule the photograph", () => {
    const qr = parseQrPayload(
      JSON.stringify({ merchant: "Comptoir Exemple SARL", total: "220,000", currency: "TND" }),
    );
    const result = extractReceipt(FRENCH_RECEIPT, qr);
    expect(result.merchant_name).toBe("Comptoir Exemple SARL");
    expect(result.total_amount).toBe(220);
    expect(result.currency).toBe("TND");
  });

  it("takes nothing from a QR code that carries no fields, such as a bare address", () => {
    const qr = parseQrPayload("https://verif.example.tn/r/1");
    const result = extractReceipt(FRENCH_RECEIPT, qr);
    expect(result.merchant_name).toBe("COMPTOIR EXEMPLE");
    expect(result.total_amount).toBe(216.58);
  });

  it("uses a code the parser flagged, and marks it as needing a second look", () => {
    const qr = parseQrPayload("FAC-2026-00412");
    const result = extractReceipt(FRENCH_RECEIPT, qr);
    // The printed code wins over the number read off creased paper...
    expect(result.receipt_number).toBe("FAC-2026-00412");
    // ...but it arrives wanting confirmation rather than pretending to be certain.
    const field = result.fields.find((entry) => entry.field_name === "receipt_number");
    expect(field?.confidence).toBe(0.5);
    expect(field?.confidence).toBeLessThan(LOW_CONFIDENCE);
  });
});
