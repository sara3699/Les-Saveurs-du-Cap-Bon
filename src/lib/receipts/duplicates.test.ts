import { describe, expect, it } from "vitest";
import { findDuplicates, type ReceiptFingerprint } from "./duplicates";

const base: ReceiptFingerprint = {
  id: "new",
  fileHash: "aaaa",
  merchantName: "Comptoir Exemple",
  receiptNumber: "2412-A",
  purchaseDate: "2026-03-04",
  totalAmount: 216.58,
  currency: "TND",
};

const onFile: ReceiptFingerprint = { ...base, id: "old", fileHash: "bbbb" };

describe("findDuplicates", () => {
  it("finds nothing in an empty drawer", () => {
    expect(findDuplicates(base, [])).toEqual([]);
  });

  it("calls the same file certain", () => {
    const found = findDuplicates(base, [{ ...onFile, fileHash: "aaaa" }]);
    expect(found[0].strength).toBe("certain");
    expect(found[0].reason).toMatch(/exactement le même fichier/);
  });

  it("calls the same supplier and number likely, whatever the spelling", () => {
    const found = findDuplicates(base, [
      { ...onFile, merchantName: "COMPTOIR EXEMPLE", receiptNumber: " 2412/a " },
    ]);
    expect(found[0].strength).toBe("likely");
    expect(found[0].reason).toMatch(/même numéro de reçu/);
  });

  it("calls the same supplier, day and amount likely", () => {
    const found = findDuplicates(base, [{ ...onFile, receiptNumber: "9999" }]);
    expect(found[0].strength).toBe("likely");
    expect(found[0].reason).toMatch(/même date et même montant/);
  });

  it("calls the same supplier and amount on another day only possible", () => {
    const found = findDuplicates(base, [
      { ...onFile, receiptNumber: "9999", purchaseDate: "2026-02-11" },
    ]);
    expect(found[0].strength).toBe("possible");
  });

  it("does not warn about a different supplier with the same total", () => {
    const found = findDuplicates(base, [
      { ...onFile, merchantName: "Transport Exemple", receiptNumber: "9999" },
    ]);
    expect(found).toEqual([]);
  });

  it("does not warn about the same amount in another currency", () => {
    const found = findDuplicates(base, [
      { ...onFile, receiptNumber: "9999", currency: "EUR", purchaseDate: "2026-02-11" },
    ]);
    expect(found).toEqual([]);
  });

  it("never reports the receipt against itself", () => {
    expect(findDuplicates(base, [base])).toEqual([]);
  });

  it("puts the strongest signal first and keeps the list short", () => {
    const many: ReceiptFingerprint[] = [
      { ...onFile, id: "p", receiptNumber: "9", purchaseDate: "2026-01-01" },
      { ...onFile, id: "l", receiptNumber: "9" },
      { ...onFile, id: "c", fileHash: "aaaa", receiptNumber: "9" },
    ];
    const found = findDuplicates(base, many);
    expect(found.map((entry) => entry.strength)).toEqual(["certain", "likely", "possible"]);
    expect(found.length).toBeLessThanOrEqual(5);
  });
});
