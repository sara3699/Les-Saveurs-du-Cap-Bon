import {
  EXPENSE_CATEGORY_ORDER,
  RECEIPT_STATUS_ORDER,
  type ExpenseCategory,
  type ReceiptStatus,
} from "@/lib/domain/receipts";
import type { ReceiptFilter } from "@/lib/repositories/types";

/**
 * The address bar is the filter state.
 *
 * One reader, used by the screen and by the export, so a downloaded file always holds
 * exactly what was on the screen it was downloaded from. Keys are French because they
 * show up in the address bar and the owner reads them.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

function one(params: SearchParams, key: string): string | undefined {
  const value = params[key];
  const text = Array.isArray(value) ? value[0] : value;
  const trimmed = text?.trim();
  return trimmed === "" ? undefined : trimmed;
}

function many(params: SearchParams, key: string): string[] {
  const value = params[key];
  if (value === undefined) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.flatMap((entry) => entry.split(",")).map((entry) => entry.trim()).filter(Boolean);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface ReceiptView extends ReceiptFilter {
  /** What the boxes on the screen should show, after everything invalid was dropped. */
  raw: {
    statut: string[];
    categorie: string[];
    fournisseur: string;
    q: string;
    du: string;
    au: string;
  };
  /** True when anything at all is narrowing the list. */
  active: boolean;
}

export function parseReceiptFilter(params: SearchParams): ReceiptView {
  const statuses = many(params, "statut").filter((value): value is ReceiptStatus =>
    RECEIPT_STATUS_ORDER.includes(value as ReceiptStatus),
  );
  const categories = many(params, "categorie").filter((value): value is ExpenseCategory =>
    EXPENSE_CATEGORY_ORDER.includes(value as ExpenseCategory),
  );
  const merchantKey = one(params, "fournisseur");
  const search = one(params, "q");
  const from = one(params, "du");
  const to = one(params, "au");

  const validFrom = from && ISO_DATE.test(from) ? from : undefined;
  const validTo = to && ISO_DATE.test(to) ? to : undefined;
  // A range the wrong way round is a typing slip, not a request for nothing.
  const [start, end] =
    validFrom && validTo && validFrom > validTo ? [validTo, validFrom] : [validFrom, validTo];

  return {
    statuses: statuses.length ? statuses : undefined,
    categories: categories.length ? categories : undefined,
    merchantKey,
    search,
    from: start,
    to: end,
    raw: {
      statut: statuses,
      categorie: categories,
      fournisseur: merchantKey ?? "",
      q: search ?? "",
      du: start ?? "",
      au: end ?? "",
    },
    active: Boolean(
      statuses.length || categories.length || merchantKey || search || start || end,
    ),
  };
}

/** Rebuilds the address bar with one thing changed, keeping everything else. */
export function withFilter(
  current: ReceiptView["raw"],
  change: Partial<ReceiptView["raw"]>,
): string {
  const next = { ...current, ...change };
  const query = new URLSearchParams();
  if (next.statut.length) query.set("statut", next.statut.join(","));
  if (next.categorie.length) query.set("categorie", next.categorie.join(","));
  if (next.fournisseur) query.set("fournisseur", next.fournisseur);
  if (next.q) query.set("q", next.q);
  if (next.du) query.set("du", next.du);
  if (next.au) query.set("au", next.au);
  const text = query.toString();
  return text === "" ? "" : `?${text}`;
}
