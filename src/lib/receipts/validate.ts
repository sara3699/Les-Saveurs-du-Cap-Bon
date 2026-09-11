import type { ReceiptFieldName } from "@/lib/domain/receipts";
import { LOW_CONFIDENCE } from "@/lib/domain/receipts";
import type { Extraction } from "./extract";
import { checkTotals } from "./totals";

/**
 * Deciding whether a reading is good enough to hand to a person as a receipt.
 *
 * The rule this file exists to enforce: **a reading that cannot be trusted is refused,
 * not repaired.** Nothing here fills a gap with a plausible value. A receipt whose total
 * could not be read comes back rejected with the word "total" in a list, and the file is
 * kept so somebody can open it and type what it says.
 *
 * Refused is not lost. The receipt, its file and everything that was read stay exactly
 * where they are, in the "Erreur" state, with the reasons attached. The only thing
 * rejection changes is that nobody is invited to believe it.
 */

/** A machine name, so a screen and an export can both key off it. */
export type RejectionCode =
  | "unreadable"
  | "merchant_missing"
  | "total_missing"
  | "date_missing"
  | "currency_unknown"
  | "totals_conflict";

export interface Rejection {
  code: RejectionCode;
  /** French, short, and safe to print on a dashboard. */
  message: string;
}

export interface ReceiptVerdict {
  status: "extracted" | "rejected";
  reasons: Rejection[];
  /** The required fields that were not found, by their own names. */
  missingFields: ReceiptFieldName[];
  /** Zero to one, across the whole reading. */
  confidence: number;
}

/**
 * What a receipt has to carry before anyone is asked to believe it.
 *
 * Currency is required by the specification and is deliberately not in this list. A
 * Tunisian till roll prices in dinars and prints no currency code at all, so requiring
 * one would reject nearly every real receipt this shop handles. Instead the shop's own
 * currency stands in, which is a known fact about the shop rather than a guess about the
 * receipt, and the review screen shows it in an editable box like everything else.
 * `currency_unknown` still exists below for a receipt that names a currency nobody can
 * make sense of.
 */
const REQUIRED: { field: ReceiptFieldName; code: RejectionCode; message: string }[] = [
  {
    field: "merchant_name",
    code: "merchant_missing",
    message: "Le fournisseur n'a pas été trouvé sur le reçu.",
  },
  {
    field: "total_amount",
    code: "total_missing",
    message: "Le total n'a pas été trouvé, ou n'est pas un montant lisible.",
  },
  {
    field: "purchase_date",
    code: "date_missing",
    message: "La date d'achat n'a pas été trouvée, ou n'est pas une date valide.",
  },
];

/**
 * Below this there is not enough text on the page to have read a receipt. A blurred
 * photograph, a photograph of a table, or a file the reader opened and found nothing in
 * all land here.
 */
const ENOUGH_TEXT = 40;

export interface VerdictInput {
  extraction: Extraction;
  /** What the reader returned, so an empty or shredded page can be told apart from a bad parse. */
  rawText: string;
  /** The shop's own currency, used when the receipt names none. */
  fallbackCurrency: string;
}

export function judgeExtraction({
  extraction,
  rawText,
  fallbackCurrency,
}: VerdictInput): ReceiptVerdict {
  const reasons: Rejection[] = [];
  const missingFields: ReceiptFieldName[] = [];
  const confidence = Number((extraction.confidence ?? 0).toFixed(3));

  const readable = (rawText ?? "").trim().length >= ENOUGH_TEXT;
  if (!readable) {
    reasons.push({
      code: "unreadable",
      message:
        "Le reçu n'a pas pu être lu : la photo est trop floue, trop sombre, ou ne montre pas un reçu.",
    });
  }

  for (const rule of REQUIRED) {
    const value = extraction[rule.field as keyof Extraction];
    const absent = value === null || value === undefined || value === "";
    if (!absent) continue;
    missingFields.push(rule.field);
    // A page nobody could read is one reason, not four. Listing every missing field on
    // top of it tells a person nothing they can act on.
    if (readable) reasons.push({ code: rule.code, message: rule.message });
  }

  // Only a currency that was read and makes no sense counts against the receipt. One
  // that was never printed is answered by the shop's own.
  const currency = extraction.currency ?? fallbackCurrency;
  if (!/^[A-Z]{3}$/.test(currency)) {
    reasons.push({
      code: "currency_unknown",
      message: "La devise du reçu n'a pas pu être déterminée.",
    });
    missingFields.push("currency");
  }

  // Arithmetic alone never rejects a receipt. Real ones round, and a shopkeeper holding
  // the paper is the better authority. It rejects only when the sums disagree AND the
  // reading was already shaky, which together mean the figures were probably misread.
  const totals = checkTotals({
    subtotal: extraction.subtotal,
    discount: extraction.discount,
    taxAmount: extraction.tax_amount,
    tipAmount: extraction.tip_amount,
    totalAmount: extraction.total_amount,
  });
  if (!totals.balanced && confidence < LOW_CONFIDENCE) {
    reasons.push({
      code: "totals_conflict",
      message: "Les montants ne s'additionnent pas et la lecture est peu sûre.",
    });
  }

  return {
    status: reasons.length === 0 ? "extracted" : "rejected",
    reasons,
    missingFields,
    confidence,
  };
}

/** The label a screen prints above the list of reasons. */
export function rejectionHeadline(verdict: ReceiptVerdict): string {
  if (verdict.status === "extracted") return "";
  return verdict.reasons.length === 1
    ? "Ce reçu n'a pas pu être lu de façon fiable"
    : `Ce reçu n'a pas pu être lu de façon fiable, pour ${verdict.reasons.length} raisons`;
}

/**
 * The note kept with the receipt. Deliberately made of our own sentences and field
 * names: nothing read off the page is echoed back into it, so nothing a stranger printed
 * can travel into a log, an export or a screen through this route.
 */
export function rejectionNote(verdict: ReceiptVerdict): string {
  const details = verdict.reasons.map((reason) => reason.message).join(" ");
  return `Receipt could not be reliably parsed. ${details}`.trim().slice(0, 500);
}
