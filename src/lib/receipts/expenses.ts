import {
  EXPENSE_CATEGORY_SHORT,
  countsTowardsTotals,
  type ExpenseCategory,
  type Receipt,
} from "@/lib/domain/receipts";

/**
 * The figures on the expenses screen.
 *
 * One rule runs through all of it: **only a verified receipt counts**. A receipt the
 * machine read but nobody confirmed is visible, and is counted in "à vérifier", and is
 * worth nothing in any total. That is the whole reason the review step exists, and a
 * total that quietly included unconfirmed receipts would undo it.
 */

export interface ExpenseSummary {
  /** Verified receipts only. */
  total: number;
  taxTotal: number;
  verifiedCount: number;
  /** Every receipt in view, whatever its state. */
  receiptCount: number;
  awaitingCount: number;
  errorCount: number;
  draftCount: number;
  archivedCount: number;
  /** Verified total divided by verified count. Zero when there are none. */
  average: number;
}

export function summarizeExpenses(receipts: Receipt[]): ExpenseSummary {
  const verified = receipts.filter(countsTowardsTotals);
  const total = verified.reduce((sum, receipt) => sum + (receipt.totalAmount ?? 0), 0);
  const taxTotal = verified.reduce((sum, receipt) => sum + (receipt.taxAmount ?? 0), 0);
  const count = (status: Receipt["status"]) =>
    receipts.filter((receipt) => receipt.status === status).length;

  return {
    total: round(total),
    taxTotal: round(taxTotal),
    verifiedCount: verified.length,
    receiptCount: receipts.length,
    awaitingCount: count("to_verify"),
    errorCount: count("error"),
    draftCount: count("draft"),
    archivedCount: count("archived"),
    average: verified.length === 0 ? 0 : round(total / verified.length),
  };
}

function round(value: number): number {
  return Number(value.toFixed(3));
}

export interface CategoryRow {
  category: ExpenseCategory;
  label: string;
  total: number;
  count: number;
  /** Of the verified total, as a percentage. Zero when nothing is verified. */
  share: number;
}

export function expensesByCategory(receipts: Receipt[]): CategoryRow[] {
  const verified = receipts.filter(countsTowardsTotals);
  const total = verified.reduce((sum, receipt) => sum + (receipt.totalAmount ?? 0), 0);
  const buckets = new Map<ExpenseCategory, { total: number; count: number }>();

  for (const receipt of verified) {
    const bucket = buckets.get(receipt.category) ?? { total: 0, count: 0 };
    bucket.total += receipt.totalAmount ?? 0;
    bucket.count += 1;
    buckets.set(receipt.category, bucket);
  }

  return [...buckets.entries()]
    .map(([category, bucket]) => ({
      category,
      label: EXPENSE_CATEGORY_SHORT[category],
      total: round(bucket.total),
      count: bucket.count,
      share: total === 0 ? 0 : Number(((bucket.total / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.total - a.total);
}

export interface SupplierRow {
  /** The normalised key, which is what a filter link uses. */
  key: string;
  /** The name as it was last printed, which is what a person reads. */
  name: string;
  total: number;
  count: number;
  lastPurchaseDate: string | null;
}

export function expensesBySupplier(receipts: Receipt[]): SupplierRow[] {
  const verified = receipts.filter(countsTowardsTotals);
  const buckets = new Map<string, SupplierRow>();

  for (const receipt of verified) {
    const key = receipt.merchantKey ?? "";
    if (key === "") continue;
    const bucket = buckets.get(key) ?? {
      key,
      name: receipt.merchantName ?? key,
      total: 0,
      count: 0,
      lastPurchaseDate: null,
    };
    bucket.total += receipt.totalAmount ?? 0;
    bucket.count += 1;
    if (receipt.purchaseDate && (!bucket.lastPurchaseDate || receipt.purchaseDate > bucket.lastPurchaseDate)) {
      bucket.lastPurchaseDate = receipt.purchaseDate;
      bucket.name = receipt.merchantName ?? bucket.name;
    }
    buckets.set(key, bucket);
  }

  return [...buckets.values()]
    .map((row) => ({ ...row, total: round(row.total) }))
    .sort((a, b) => b.total - a.total);
}

export interface MonthBar {
  /** YYYY-MM. */
  month: string;
  label: string;
  total: number;
  count: number;
}

const MONTHS_SHORT = [
  "janv", "févr", "mars", "avr", "mai", "juin",
  "juil", "août", "sept", "oct", "nov", "déc",
];

/**
 * The last N months, including the empty ones. A gap in the middle of a chart is a
 * month where nothing was spent, and leaving it out would draw a different shape.
 */
export function expensesOverTime(receipts: Receipt[], months: number, now: Date): MonthBar[] {
  const bars: MonthBar[] = [];
  for (let back = months - 1; back >= 0; back -= 1) {
    const when = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    const month = `${when.getUTCFullYear()}-${String(when.getUTCMonth() + 1).padStart(2, "0")}`;
    bars.push({
      month,
      label: `${MONTHS_SHORT[when.getUTCMonth()]} ${String(when.getUTCFullYear()).slice(2)}`,
      total: 0,
      count: 0,
    });
  }

  const byMonth = new Map(bars.map((bar) => [bar.month, bar]));
  for (const receipt of receipts.filter(countsTowardsTotals)) {
    if (!receipt.purchaseDate) continue;
    const bar = byMonth.get(receipt.purchaseDate.slice(0, 7));
    if (!bar) continue;
    bar.total += receipt.totalAmount ?? 0;
    bar.count += 1;
  }

  return bars.map((bar) => ({ ...bar, total: round(bar.total) }));
}

/** Every supplier seen, for the filter list, whether or not their receipts are verified. */
export function supplierOptions(receipts: Receipt[]): { key: string; name: string }[] {
  const names = new Map<string, string>();
  for (const receipt of receipts) {
    if (!receipt.merchantKey) continue;
    if (!names.has(receipt.merchantKey)) {
      names.set(receipt.merchantKey, receipt.merchantName ?? receipt.merchantKey);
    }
  }
  return [...names.entries()]
    .map(([key, name]) => ({ key, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/**
 * The rows an export carries. Built here rather than in the route so the file and the
 * screen are the same data, and so it can be tested without a request.
 */
export function exportRows(receipts: Receipt[]): Record<string, string>[] {
  return receipts.map((receipt) => ({
    statut: receipt.status,
    date: receipt.purchaseDate ?? "",
    heure: receipt.purchaseTime ?? "",
    fournisseur: receipt.merchantName ?? "",
    matricule_fiscal: receipt.taxIdentifier ?? "",
    numero: receipt.receiptNumber ?? "",
    categorie: EXPENSE_CATEGORY_SHORT[receipt.category],
    devise: receipt.currency,
    sous_total: receipt.subtotal === null ? "" : receipt.subtotal.toFixed(3),
    remise: receipt.discount === null ? "" : receipt.discount.toFixed(3),
    tva: receipt.taxAmount === null ? "" : receipt.taxAmount.toFixed(3),
    pourboire: receipt.tipAmount === null ? "" : receipt.tipAmount.toFixed(3),
    total: receipt.totalAmount === null ? "" : receipt.totalAmount.toFixed(3),
    paiement: receipt.paymentMethod ?? "",
    depose_par: receipt.uploadedByName ?? "",
    verifie_par: receipt.verifiedByName ?? "",
    verifie_le: receipt.verifiedAt ?? "",
    lecture: receipt.extractionProvider ?? "",
    confiance: receipt.extractionConfidence === null ? "" : receipt.extractionConfidence.toFixed(2),
  }));
}

/**
 * A separator, a quote, a newline or a leading = in a cell are all ways a spreadsheet
 * reads a value as something other than the text it is. Every one of them is handled
 * here, once.
 */
export function toCsv(rows: Record<string, string>[]): string {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]);
  const cell = (value: string) => {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const lines = [columns.join(";")];
  for (const row of rows) {
    lines.push(columns.map((column) => cell(row[column] ?? "")).join(";"));
  }
  // A byte order mark, because Excel in French otherwise reads accents as mojibake.
  return `﻿${lines.join("\r\n")}\r\n`;
}
