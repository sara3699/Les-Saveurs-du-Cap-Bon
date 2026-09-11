import type { ReceiptFieldName } from "@/lib/domain/receipts";
import type { ParsedQr, QrFields } from "./qr";
import {
  normalizeAmount,
  normalizeCardLastFour,
  normalizeCurrency,
  normalizeDate,
  normalizePaymentMethod,
  normalizeReceiptNumber,
  normalizeTaxIdentifier,
  normalizeTime,
} from "./normalize";

/**
 * Turning a page of receipt text into fields.
 *
 * This is deliberately ours rather than the OCR provider's. A provider returns text;
 * what "TOTAL TTC" means, and that "NET À PAYER" beats "SOUS-TOTAL" when both appear,
 * is knowledge about French and Tunisian receipts that belongs in a file with tests
 * next to it, not inside a vendor we might swap out next year.
 *
 * Every field comes back with a confidence, and the confidence is honest: a value
 * found next to the word that names it scores higher than one inferred from position.
 * Nothing here is ever treated as final. A person confirms it on the review screen.
 */

export interface ExtractionField {
  field_name: ReceiptFieldName;
  raw_value: string | null;
  normalized_value: string | null;
  confidence: number;
}

export interface ExtractionItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  confidence: number;
}

export interface Extraction {
  merchant_name: string | null;
  merchant_address: string | null;
  tax_identifier: string | null;
  receipt_number: string | null;
  purchase_date: string | null;
  purchase_time: string | null;
  currency: string | null;
  subtotal: number | null;
  discount: number | null;
  tax_amount: number | null;
  tip_amount: number | null;
  total_amount: number | null;
  payment_method: string | null;
  card_last_four: string | null;
  items: ExtractionItem[];
  fields: ExtractionField[];
  /** The average of what was found, weighted by how much of a receipt was recognised. */
  confidence: number;
}

/** A run of digits with the usual separators, sitting at the end of a line. */
const TRAILING_AMOUNT = /(-?[\d][\d\s.,']*)\s*(?:TND|DT|EUR|€|USD|\$|MAD)?\s*$/i;

const TOTAL_WORDS = /\b(total\s*(?:ttc|à\s*payer|a\s*payer|général|general)?|net\s*à?\s*payer|net\s*a\s*payer|grand\s*total|montant\s*(?:ttc|dû|du|total))\b/i;
const SUBTOTAL_WORDS = /\b(sous[\s-]*total|total\s*h\.?t\.?|hors\s*taxes?|subtotal|sub[\s-]total)\b/i;
const TAX_WORDS = /\b(t\.?v\.?a\.?|vat|taxe?s?)\b/i;
const DISCOUNT_WORDS = /\b(remise|réduction|reduction|rabais|discount|promo)\b/i;
const TIP_WORDS = /\b(pourboire|tip|service)\b/i;
const CHANGE_WORDS = /\b(rendu|monnaie|change|reçu|recu|espèces\s*reçues)\b/i;
const TAX_ID_WORDS = /\b(matricule\s*fiscal|matricule|m\.?\s?f\.?|tax\s*id|vat\s*(?:no|n°|number)|identifiant\s*fiscal|nif)\b/i;
const NUMBER_WORDS = /\b(ticket|re[çc]u|facture|invoice|bon|n[°ºo]|no\.?|num[ée]ro)\b/i;
const ADDRESS_WORDS = /\b(rue|avenue|av\.|bd|boulevard|route|imm\.|immeuble|cité|cite|street|road|km\b|\d{4}\s+\p{Lu})/iu;

/** Lines that are never a purchased article, however much they look like one. */
const NOT_AN_ITEM =
  /\b(total|sous[\s-]*total|t\.?v\.?a\.?|vat|taxe|remise|rabais|discount|pourboire|service|rendu|monnaie|change|esp[èe]ces|carte|ch[èe]que|virement|merci|thank|caisse|caissier|ticket|facture|matricule|date|heure|tel\b|t[ée]l\.|adresse)\b/i;

function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line !== "");
}

function amountOnLine(line: string): { value: number; raw: string } | null {
  const match = line.match(TRAILING_AMOUNT);
  if (!match) return null;
  const raw = match[1].trim();
  if (!/\d/.test(raw)) return null;
  const value = normalizeAmount(raw);
  return value === null ? null : { value, raw };
}

interface Found<T> {
  value: T;
  raw: string;
  confidence: number;
}

/** The last line naming this thing wins: a till prints the real total at the bottom. */
function findLabelled(
  source: string[],
  words: RegExp,
  exclude?: RegExp,
): Found<number> | null {
  let best: Found<number> | null = null;
  for (const line of source) {
    if (!words.test(line)) continue;
    if (exclude?.test(line)) continue;
    const amount = amountOnLine(line);
    if (!amount) continue;
    // A label and its number on the same line is the strongest signal a receipt gives.
    best = { value: amount.value, raw: line, confidence: 0.92 };
  }
  return best;
}

function findMerchant(source: string[]): Found<string> | null {
  // A till prints who it belongs to first, above the address and before any number.
  for (const [index, line] of source.slice(0, 5).entries()) {
    if (line.length < 3 || line.length > 60) continue;
    if (/\d{3,}/.test(line)) continue;
    if (ADDRESS_WORDS.test(line)) continue;
    if (NOT_AN_ITEM.test(line)) continue;
    if (!/\p{L}/u.test(line)) continue;
    return { value: line.slice(0, 120), raw: line, confidence: index === 0 ? 0.78 : 0.62 };
  }
  return null;
}

function findAddress(source: string[]): Found<string> | null {
  for (const line of source.slice(0, 8)) {
    if (ADDRESS_WORDS.test(line) && line.length <= 120) {
      return { value: line, raw: line, confidence: 0.6 };
    }
  }
  return null;
}

function findByWords(source: string[], words: RegExp): Found<string> | null {
  for (const line of source) {
    if (words.test(line)) return { value: line, raw: line, confidence: 0.85 };
  }
  return null;
}

function findDate(source: string[]): Found<string> | null {
  for (const line of source) {
    const value = normalizeDate(line);
    if (value) {
      // A line that says so is worth more than a stray number that parsed.
      const named = /\b(date|le)\b/i.test(line);
      return { value, raw: line, confidence: named ? 0.9 : 0.78 };
    }
  }
  return null;
}

function findCardLastFour(source: string[]): Found<string> | null {
  for (const line of source) {
    const masked = line.match(/(?:[*xX•#]{2,}[\s-]*)(\d{4})\b/);
    if (masked) return { value: masked[1], raw: line, confidence: 0.9 };
  }
  for (const line of source) {
    if (!/\bcarte|card\b/i.test(line)) continue;
    const tail = normalizeCardLastFour(line);
    if (tail) return { value: tail, raw: line, confidence: 0.55 };
  }
  return null;
}

function findItems(source: string[]): ExtractionItem[] {
  const items: ExtractionItem[] = [];
  for (const line of source) {
    if (NOT_AN_ITEM.test(line)) continue;
    // A stamp and a postcode both end in digits, and neither is something anyone bought.
    if (normalizeDate(line) !== null) continue;
    if (ADDRESS_WORDS.test(line)) continue;
    const amount = amountOnLine(line);
    if (!amount) continue;

    const head = line.slice(0, line.lastIndexOf(amount.raw)).trim().replace(/[.\s]+$/, "");
    if (head === "" || !/\p{L}/u.test(head)) continue;

    // "2 x Pain complet" or "2 Pain complet"
    const counted = head.match(/^(\d+(?:[.,]\d+)?)\s*(?:[xX*]\s*)?(.+)$/);
    let quantity = 1;
    let description = head;
    let confidence = 0.6;
    if (counted && /\p{L}/u.test(counted[2])) {
      const parsed = normalizeAmount(counted[1]);
      if (parsed !== null && parsed > 0 && parsed < 1000) {
        quantity = parsed;
        description = counted[2].trim();
        confidence = 0.75;
      }
    }
    if (description.length < 2) continue;

    items.push({
      description: description.slice(0, 200),
      quantity,
      unit_price: quantity > 0 ? Number((amount.value / quantity).toFixed(3)) : amount.value,
      total_amount: amount.value,
      confidence,
    });
  }
  return items.slice(0, 60);
}

function field(
  name: ReceiptFieldName,
  found: Found<string | number> | null,
  normalized: string | null,
): ExtractionField | null {
  if (!found || normalized === null) return null;
  return {
    field_name: name,
    raw_value: found.raw.slice(0, 500),
    normalized_value: normalized.slice(0, 500),
    confidence: Number(found.confidence.toFixed(3)),
  };
}

/**
 * Read a receipt.
 *
 * When a QR code was scanned as well, what it says wins over what the text seems to
 * say, because a code printed by the till is a better witness than a photograph of ink.
 * A QR code whose own parser flagged it for review does not get that privilege.
 */
export function extractReceipt(rawText: string, qr?: ParsedQr | null): Extraction {
  const source = lines(rawText ?? "");
  const fields: ExtractionField[] = [];

  const merchant = findMerchant(source);
  const address = findAddress(source);
  const taxIdLine = findByWords(source, TAX_ID_WORDS);
  const numberLine = findByWords(source, NUMBER_WORDS);
  const date = findDate(source);
  const card = findCardLastFour(source);

  const total = findLabelled(source, TOTAL_WORDS, SUBTOTAL_WORDS);
  const subtotal = findLabelled(source, SUBTOTAL_WORDS);
  const tax = findLabelled(source, TAX_WORDS, CHANGE_WORDS);
  const discount = findLabelled(source, DISCOUNT_WORDS);
  const tip = findLabelled(source, TIP_WORDS);

  const timeLine = source.find((line) => normalizeTime(line) !== null) ?? null;
  const paymentLine = source.find((line) => {
    const method = normalizePaymentMethod(line);
    return method !== null && /esp|carte|card|ch[èe]que|virement|cash|mobile|livraison/i.test(line);
  }) ?? null;
  const currencyLine = source.find((line) => normalizeCurrency(line) !== null) ?? null;

  const value = {
    merchant_name: merchant?.value ?? null,
    merchant_address: address?.value ?? null,
    tax_identifier: taxIdLine ? normalizeTaxIdentifier(taxIdLine.value.replace(TAX_ID_WORDS, "")) : null,
    receipt_number: numberLine ? normalizeReceiptNumber(numberLine.value.replace(NUMBER_WORDS, "")) : null,
    purchase_date: date?.value ?? null,
    purchase_time: timeLine ? normalizeTime(timeLine) : null,
    currency: currencyLine ? normalizeCurrency(currencyLine) : null,
    subtotal: subtotal?.value ?? null,
    discount: discount?.value ?? null,
    tax_amount: tax?.value ?? null,
    tip_amount: tip?.value ?? null,
    total_amount: total?.value ?? null,
    payment_method: paymentLine ? normalizePaymentMethod(paymentLine) : null,
    card_last_four: card?.value ?? null,
  };

  // A till's own code beats a photograph of its ink, even when the parser wants a person
  // to confirm it. A code that says FAC-2026-00412 is a better witness than OCR on a
  // creased receipt either way; what "needs review" changes is the confidence it carries
  // onto the screen, not whether it is worth putting in the box. The alternative was a
  // parser that says a value "has been placed in the receipt number" and an extractor
  // that quietly drops it.
  if (qr) {
    const fromQr = qr.fields;
    if (fromQr.merchant_name) value.merchant_name = fromQr.merchant_name;
    if (fromQr.receipt_number) value.receipt_number = normalizeReceiptNumber(fromQr.receipt_number);
    if (fromQr.tax_identifier) value.tax_identifier = normalizeTaxIdentifier(fromQr.tax_identifier);
    if (fromQr.purchase_date) value.purchase_date = normalizeDate(fromQr.purchase_date) ?? value.purchase_date;
    if (fromQr.currency) value.currency = normalizeCurrency(fromQr.currency) ?? value.currency;
    if (fromQr.total_amount) value.total_amount = normalizeAmount(fromQr.total_amount) ?? value.total_amount;
    if (fromQr.tax_amount) value.tax_amount = normalizeAmount(fromQr.tax_amount) ?? value.tax_amount;
  }

  // Read off a printed code, so high; halved when the parser wants it confirmed, which
  // puts it under LOW_CONFIDENCE and marks the field "À relire" on the review screen.
  const qrCertainty = qr ? (qr.needsReview ? 0.5 : 0.95) : 0;
  const put = (
    name: ReceiptFieldName,
    found: Found<string | number> | null,
    normalized: string | number | null,
    fromQr: boolean,
  ) => {
    if (normalized === null) return;
    const carrier = fromQr
      ? { value: normalized, raw: qr?.raw ?? "", confidence: qrCertainty }
      : found;
    const entry = field(name, carrier, String(normalized));
    if (entry) fields.push(entry);
  };

  const qrHas = (key: keyof QrFields) => Boolean(qrCertainty && qr?.fields[key]);

  put("merchant_name", merchant, value.merchant_name, qrHas("merchant_name"));
  put("merchant_address", address, value.merchant_address, false);
  put("tax_identifier", taxIdLine, value.tax_identifier, qrHas("tax_identifier"));
  put("receipt_number", numberLine, value.receipt_number, qrHas("receipt_number"));
  put("purchase_date", date, value.purchase_date, qrHas("purchase_date"));
  put("purchase_time", timeLine ? { value: timeLine, raw: timeLine, confidence: 0.75 } : null, value.purchase_time, false);
  put("currency", currencyLine ? { value: currencyLine, raw: currencyLine, confidence: 0.8 } : null, value.currency, qrHas("currency"));
  put("subtotal", subtotal, value.subtotal, false);
  put("discount", discount, value.discount, false);
  put("tax_amount", tax, value.tax_amount, qrHas("tax_amount"));
  put("tip_amount", tip, value.tip_amount, false);
  put("total_amount", total, value.total_amount, qrHas("total_amount"));
  put("payment_method", paymentLine ? { value: paymentLine, raw: paymentLine, confidence: 0.7 } : null, value.payment_method, false);
  put("card_last_four", card, value.card_last_four, false);

  const items = findItems(source);

  // The overall figure answers "how much of a receipt did we actually recognise", so a
  // page where only the merchant was found does not report itself as a confident read.
  const KEY_FIELDS = 6;
  const keyFound = [
    value.merchant_name,
    value.purchase_date,
    value.total_amount,
    value.tax_amount,
    value.receipt_number,
    items.length > 0 ? "items" : null,
  ].filter((entry) => entry !== null).length;
  const averageConfidence =
    fields.length === 0 ? 0 : fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length;
  const confidence = Number((averageConfidence * (keyFound / KEY_FIELDS)).toFixed(3));

  return { ...value, items, fields, confidence };
}
