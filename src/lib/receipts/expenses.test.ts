import { describe, expect, it } from "vitest";
import type { Receipt } from "@/lib/domain/receipts";
import {
  exportRows,
  expensesByCategory,
  expensesBySupplier,
  expensesOverTime,
  summarizeExpenses,
  supplierOptions,
  toCsv,
} from "./expenses";
import { parseReceiptFilter, withFilter } from "./filters";

function receipt(over: Partial<Receipt>): Receipt {
  return {
    id: "r1",
    status: "verified",
    sourceType: "upload",
    uploadedById: "m1",
    uploadedByName: "Sarra",
    merchantName: "Comptoir Exemple",
    merchantKey: "comptoir exemple",
    merchantAddress: null,
    taxIdentifier: null,
    receiptNumber: null,
    purchaseDate: "2026-03-04",
    purchaseTime: null,
    currency: "TND",
    subtotal: null,
    discount: null,
    taxAmount: 19,
    tipAmount: null,
    totalAmount: 119,
    paymentMethod: null,
    cardLastFour: null,
    category: "supplies",
    qrPayload: null,
    qrKind: null,
    verificationUrl: null,
    extractionProvider: "demo",
    extractionConfidence: 0.9,
    extractionError: null,
    rejectionReasons: [],
    missingFields: [],
    fileName: "recu.pdf",
    fileMime: "application/pdf",
    fileSize: 1000,
    note: null,
    createdAt: "2026-03-04T10:00:00.000Z",
    processedAt: null,
    verifiedAt: null,
    verifiedByName: null,
    items: [],
    fields: [],
    ...over,
  };
}

const MIXED: Receipt[] = [
  receipt({ id: "a", totalAmount: 100, taxAmount: 19 }),
  receipt({ id: "b", totalAmount: 50, taxAmount: 9.5, category: "transport", merchantKey: "transport exemple", merchantName: "Transport Exemple" }),
  receipt({ id: "c", status: "to_verify", totalAmount: 999, taxAmount: 190 }),
  receipt({ id: "d", status: "error", totalAmount: null, taxAmount: null }),
  receipt({ id: "e", status: "draft", totalAmount: 777 }),
  receipt({ id: "f", status: "archived", totalAmount: 555 }),
];

describe("summarizeExpenses", () => {
  const summary = summarizeExpenses(MIXED);

  it("counts only what a person has verified", () => {
    expect(summary.total).toBe(150);
    expect(summary.taxTotal).toBe(28.5);
    expect(summary.verifiedCount).toBe(2);
  });

  it("leaves an unverified receipt out of the total but not out of sight", () => {
    expect(summary.receiptCount).toBe(6);
    expect(summary.awaitingCount).toBe(1);
    expect(summary.errorCount).toBe(1);
    expect(summary.draftCount).toBe(1);
    expect(summary.archivedCount).toBe(1);
  });

  it("leaves an archived receipt out of the total", () => {
    expect(summary.total).not.toBe(705);
  });

  it("says zero rather than dividing by nothing", () => {
    const empty = summarizeExpenses([]);
    expect(empty.total).toBe(0);
    expect(empty.average).toBe(0);
    expect(empty.receiptCount).toBe(0);
  });

  it("averages over the verified receipts only", () => {
    expect(summary.average).toBe(75);
  });
});

describe("expensesByCategory", () => {
  const rows = expensesByCategory(MIXED);

  it("groups the verified receipts, largest first", () => {
    expect(rows.map((row) => row.category)).toEqual(["supplies", "transport"]);
    expect(rows[0].total).toBe(100);
    expect(rows[0].label).toBe("Fournitures");
  });

  it("works out each share of the verified total", () => {
    expect(rows[0].share).toBeCloseTo(66.7, 1);
    expect(rows[1].share).toBeCloseTo(33.3, 1);
  });

  it("returns nothing rather than a row of zeroes", () => {
    expect(expensesByCategory([])).toEqual([]);
  });
});

describe("expensesBySupplier", () => {
  it("groups on the normalised key, not the printed name", () => {
    const rows = expensesBySupplier([
      receipt({ id: "a", merchantName: "Comptoir Exemple", merchantKey: "comptoir exemple", totalAmount: 100 }),
      receipt({ id: "b", merchantName: "COMPTOIR EXEMPLE", merchantKey: "comptoir exemple", totalAmount: 40, purchaseDate: "2026-04-01" }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].total).toBe(140);
    expect(rows[0].count).toBe(2);
    // The most recent spelling is the one a person reads.
    expect(rows[0].name).toBe("COMPTOIR EXEMPLE");
    expect(rows[0].lastPurchaseDate).toBe("2026-04-01");
  });

  it("skips a receipt whose supplier is not filled in yet", () => {
    expect(expensesBySupplier([receipt({ merchantKey: null, merchantName: null })])).toEqual([]);
  });
});

describe("expensesOverTime", () => {
  const now = new Date("2026-03-15T00:00:00Z");
  const bars = expensesOverTime(MIXED, 4, now);

  it("returns one bar a month, empty months included", () => {
    expect(bars).toHaveLength(4);
    expect(bars.map((bar) => bar.month)).toEqual(["2025-12", "2026-01", "2026-02", "2026-03"]);
    expect(bars[0].total).toBe(0);
  });

  it("puts the verified receipts in the month they were bought", () => {
    const march = bars.at(-1)!;
    expect(march.total).toBe(150);
    expect(march.count).toBe(2);
    expect(march.label).toBe("mars 26");
  });
});

describe("supplierOptions", () => {
  it("lists every supplier seen, verified or not, in French alphabetical order", () => {
    const options = supplierOptions(MIXED);
    expect(options.map((option) => option.name)).toEqual(["Comptoir Exemple", "Transport Exemple"]);
  });
});

describe("the export", () => {
  it("carries a row per receipt with the amounts written out to the millime", () => {
    const rows = exportRows([receipt({ totalAmount: 119, taxAmount: 19 })]);
    expect(rows).toHaveLength(1);
    expect(rows[0].total).toBe("119.000");
    expect(rows[0].tva).toBe("19.000");
    expect(rows[0].fournisseur).toBe("Comptoir Exemple");
  });

  it("leaves an empty cell empty rather than writing a zero", () => {
    const rows = exportRows([receipt({ totalAmount: null, taxAmount: null })]);
    expect(rows[0].total).toBe("");
    expect(rows[0].tva).toBe("");
  });

  it("stops a cell from being read as a spreadsheet formula", () => {
    const csv = toCsv([{ fournisseur: "=1+1", note: 'il a dit "oui"' }]);
    expect(csv).toContain(`"'=1+1"`);
    expect(csv).toContain(`"il a dit ""oui"""`);
  });

  it("starts with a byte order mark so French accents survive Excel", () => {
    const csv = toCsv([{ fournisseur: "Café" }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("Café");
  });

  it("returns nothing at all for nothing at all", () => {
    expect(toCsv([])).toBe("");
  });
});

describe("reading the filters out of the address bar", () => {
  it("keeps what it recognises and drops what it does not", () => {
    const view = parseReceiptFilter({
      statut: "verified,inventé",
      categorie: ["transport"],
      q: " pistaches ",
      du: "2026-01-01",
      au: "2026-03-31",
    });
    expect(view.statuses).toEqual(["verified"]);
    expect(view.categories).toEqual(["transport"]);
    expect(view.search).toBe("pistaches");
    expect(view.from).toBe("2026-01-01");
    expect(view.active).toBe(true);
  });

  it("turns a range typed the wrong way round the right way round", () => {
    const view = parseReceiptFilter({ du: "2026-03-31", au: "2026-01-01" });
    expect(view.from).toBe("2026-01-01");
    expect(view.to).toBe("2026-03-31");
  });

  it("ignores a date that is not a date", () => {
    const view = parseReceiptFilter({ du: "hier" });
    expect(view.from).toBeUndefined();
    expect(view.active).toBe(false);
  });

  it("says nothing is filtered when nothing is", () => {
    const view = parseReceiptFilter({});
    expect(view.active).toBe(false);
    expect(view.statuses).toBeUndefined();
  });

  it("changes one thing and keeps the rest", () => {
    const view = parseReceiptFilter({ statut: "verified", q: "pistaches" });
    expect(withFilter(view.raw, { statut: ["error"] })).toBe("?statut=error&q=pistaches");
    expect(withFilter(view.raw, { q: "" })).toBe("?statut=verified");
  });
});
