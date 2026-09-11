import { describe, expect, it } from "vitest";
import {
  normalizeAmount,
  normalizeCardLastFour,
  normalizeCurrency,
  normalizeDate,
  normalizeMerchant,
  normalizePaymentMethod,
  normalizeReceiptNumber,
  normalizeTaxIdentifier,
  normalizeTime,
} from "./normalize";

describe("normalizeMerchant", () => {
  it("collapses two spellings of one supplier onto the same key", () => {
    expect(normalizeMerchant("Café des Délices")).toBe("cafe des delices");
    expect(normalizeMerchant("CAFE DES DELICES")).toBe("cafe des delices");
    expect(normalizeMerchant("  café   des  délices!  ")).toBe("cafe des delices");
  });

  it("matches what the database computes for the same names", () => {
    // These pairs were run through public.normalize_merchant on 2026-09-10 and are the
    // guard against this copy and that one drifting apart.
    expect(normalizeMerchant("Café des Délices, S.A.R.L.")).toBe("cafe des delices s a r l");
    expect(normalizeMerchant("CAFE DES DELICES SARL")).toBe("cafe des delices sarl");
  });

  it("returns nothing for a name with no letters or digits in it", () => {
    expect(normalizeMerchant("---")).toBeNull();
    expect(normalizeMerchant("")).toBeNull();
    expect(normalizeMerchant(null)).toBeNull();
  });
});

describe("normalizeAmount", () => {
  it("reads a Tunisian receipt, where the comma is the decimal", () => {
    expect(normalizeAmount("1 234,567")).toBe(1234.567);
    expect(normalizeAmount("12,500")).toBe(12.5);
    expect(normalizeAmount("42,300 TND")).toBe(42.3);
  });

  it("reads both ways round when a receipt uses the other convention", () => {
    expect(normalizeAmount("1,234.56")).toBe(1234.56);
    expect(normalizeAmount("1.234,56")).toBe(1234.56);
  });

  it("keeps a plain number plain", () => {
    expect(normalizeAmount("12500")).toBe(12500);
    expect(normalizeAmount(42.3)).toBe(42.3);
  });

  it("treats a separator followed by too many digits as grouping", () => {
    expect(normalizeAmount("1,234567")).toBe(1234567);
  });

  it("reads a refund as a negative", () => {
    expect(normalizeAmount("-12,500")).toBe(-12.5);
    expect(normalizeAmount("(12,500)")).toBe(-12.5);
  });

  it("gives up rather than guessing", () => {
    expect(normalizeAmount("")).toBeNull();
    expect(normalizeAmount("TOTAL")).toBeNull();
    expect(normalizeAmount(null)).toBeNull();
    expect(normalizeAmount(Number.NaN)).toBeNull();
  });
});

describe("normalizeDate", () => {
  it("reads the day first, the way Tunisia writes it", () => {
    expect(normalizeDate("04/03/2026")).toBe("2026-03-04");
    expect(normalizeDate("12-03-26")).toBe("2026-03-12");
  });

  it("falls back to month first only when day first cannot be a date", () => {
    expect(normalizeDate("12/25/2026")).toBe("2026-12-25");
  });

  it("reads an ISO stamp as written", () => {
    expect(normalizeDate("2026-03-04")).toBe("2026-03-04");
    expect(normalizeDate("Date : 2026-03-04 14:35")).toBe("2026-03-04");
  });

  it("reads month names in French and English", () => {
    expect(normalizeDate("4 mars 2026")).toBe("2026-03-04");
    expect(normalizeDate("1er février 2026")).toBe("2026-02-01");
    expect(normalizeDate("March 12, 2026")).toBe("2026-03-12");
  });

  it("refuses a day that does not exist", () => {
    expect(normalizeDate("31/02/2026")).toBeNull();
    expect(normalizeDate("pas une date")).toBeNull();
  });
});

describe("normalizeTime", () => {
  it("reads the shapes a till prints", () => {
    expect(normalizeTime("14:35")).toBe("14:35");
    expect(normalizeTime("14h35")).toBe("14:35");
    expect(normalizeTime("09:05:41")).toBe("09:05");
  });

  it("reads a twelve hour clock", () => {
    expect(normalizeTime("2:35 PM")).toBe("14:35");
    expect(normalizeTime("12:05 AM")).toBe("00:05");
    expect(normalizeTime("12:05 PM")).toBe("12:05");
  });

  it("refuses an impossible clock", () => {
    expect(normalizeTime("25:00")).toBeNull();
    expect(normalizeTime("14:75")).toBeNull();
    expect(normalizeTime("plus tard")).toBeNull();
  });
});

describe("normalizeCurrency", () => {
  it("recognises the dinar however it is written", () => {
    expect(normalizeCurrency("TND")).toBe("TND");
    expect(normalizeCurrency("42,300 DT")).toBe("TND");
    expect(normalizeCurrency("dinars")).toBe("TND");
  });

  it("recognises the other currencies a supplier might bill in", () => {
    expect(normalizeCurrency("€")).toBe("EUR");
    expect(normalizeCurrency("120 EUR")).toBe("EUR");
    expect(normalizeCurrency("USD")).toBe("USD");
  });

  it("does not turn a stray three letter word into a currency", () => {
    expect(normalizeCurrency("TOT")).toBeNull();
    expect(normalizeCurrency("")).toBeNull();
  });
});

describe("normalizeCardLastFour", () => {
  it("keeps four digits and only four", () => {
    expect(normalizeCardLastFour("**** **** **** 4242")).toBe("4242");
    expect(normalizeCardLastFour("4242")).toBe("4242");
  });

  it("never lets a whole card number through", () => {
    const whole = "4111 1111 1111 1111";
    expect(normalizeCardLastFour(whole)).toBe("1111");
    expect(normalizeCardLastFour(whole)).toHaveLength(4);
  });

  it("returns nothing when there is nothing to keep", () => {
    expect(normalizeCardLastFour("carte")).toBeNull();
    expect(normalizeCardLastFour("12")).toBeNull();
  });
});

describe("normalizePaymentMethod", () => {
  it("names the method in French whichever language the receipt used", () => {
    expect(normalizePaymentMethod("Règlement : especes")).toBe("Espèces");
    expect(normalizePaymentMethod("PAID BY CARD")).toBe("Carte bancaire");
    expect(normalizePaymentMethod("virement bancaire")).toBe("Virement");
  });

  it("keeps an unrecognised method rather than dropping it", () => {
    expect(normalizePaymentMethod("bon d'achat")).toBe("bon d'achat");
  });
});

describe("normalizeTaxIdentifier and normalizeReceiptNumber", () => {
  it("tidies a matricule fiscal without inventing one", () => {
    expect(normalizeTaxIdentifier(" 1284567 a / m / 000 ")).toBe("1284567A/M/000");
    expect(normalizeTaxIdentifier("aucun")).toBeNull();
  });

  it("drops the label in front of a receipt number", () => {
    expect(normalizeReceiptNumber("Facture N° 2412")).toBe("2412");
    expect(normalizeReceiptNumber("Ticket: A-4471")).toBe("A-4471");
    expect(normalizeReceiptNumber("facture")).toBeNull();
  });
});
