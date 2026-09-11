/**
 * Reading a QR code without obeying it.
 *
 * A QR code on a receipt is a string a stranger printed. It is data, never an
 * instruction. So this file does four things and refuses to do a fifth:
 *
 *  - it caps the length and rejects control characters, so nothing can smuggle a
 *    terminal escape or a null byte through;
 *  - it accepts only https, and only to a public host, so a payload cannot point at
 *    anything on the machine running this or on the network behind it;
 *  - it maps the shapes we recognise onto receipt fields, and flags everything else
 *    for a person to look at rather than guessing;
 *  - it keeps the raw string exactly as scanned, separate from anything parsed.
 *
 * What it will not do is open the URL, fetch it, or hand it to anything that might.
 * Remote verification against a tax authority is not built. The address is stored and
 * shown as text, and that is the whole of it.
 */

/** A QR code cannot hold more than about 2 953 bytes. Anything longer is not one. */
export const MAX_QR_LENGTH = 4096;

export type QrKind =
  | "json"
  | "url"
  | "receipt_number"
  | "tax_identifier"
  | "payment_reference"
  | "text"
  | "unsupported";

export interface QrFields {
  merchant_name?: string;
  receipt_number?: string;
  tax_identifier?: string;
  purchase_date?: string;
  currency?: string;
  total_amount?: string;
  tax_amount?: string;
}

export interface ParsedQr {
  kind: QrKind;
  /** Exactly what was scanned, capped and stripped of control characters. */
  raw: string;
  /** Only ever an https address to a public host. Never opened, never fetched. */
  verificationUrl: string | null;
  fields: QrFields;
  /** True when a person should look at this before it is believed. */
  needsReview: boolean;
  /** Why, in French, for the review screen. Null when nothing needs saying. */
  reason: string | null;
}

/**
 * Control characters have no business on a receipt and are the usual way a payload
 * tries to become something other than text. Tab, newline and carriage return stay.
 */
function stripControl(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
}

/**
 * Text on its way to a screen. React escapes what it renders, so this is a second
 * layer rather than the only one: it caps the length and removes the characters that
 * would make a log or a CSV misbehave.
 */
export function sanitizeForDisplay(value: string | null | undefined, max = 500): string {
  if (!value) return "";
  return stripControl(value).replace(/\s+/g, " ").trim().slice(0, max);
}

const PRIVATE_HOST =
  /^(localhost|.*\.local|.*\.internal|.*\.localhost|metadata\.google\.internal)$/i;

/**
 * Addresses that point back inside. A verification URL is never fetched by this
 * product, but it is stored, and a stored address that someone later decides to open
 * should already have been refused here rather than at that later point.
 */
function pointsInward(host: string): boolean {
  const name = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (PRIVATE_HOST.test(name)) return true;
  if (name === "::1" || name.startsWith("fc") || name.startsWith("fd")) return true;

  const ipv4 = name.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  if (a >= 224) return true;
  return false;
}

export interface UrlCheck {
  url: string | null;
  reason: string | null;
}

/**
 * The only shape of address this product will keep: https, no credentials in it, the
 * standard port, and a host that is not on a private network.
 */
export function checkVerificationUrl(candidate: string): UrlCheck {
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { url: null, reason: "L'adresse du code QR n'est pas une adresse valide." };
  }
  if (parsed.protocol !== "https:") {
    return {
      url: null,
      reason: `Le code QR pointe vers une adresse en ${parsed.protocol.replace(":", "")}, qui n'est pas acceptée. Seul https l'est.`,
    };
  }
  if (parsed.username || parsed.password) {
    return { url: null, reason: "L'adresse du code QR contient un identifiant, elle est refusée." };
  }
  if (parsed.port && parsed.port !== "443") {
    return { url: null, reason: "L'adresse du code QR utilise un port inhabituel, elle est refusée." };
  }
  if (pointsInward(parsed.hostname)) {
    return { url: null, reason: "L'adresse du code QR pointe vers un réseau privé, elle est refusée." };
  }
  if (parsed.href.length > 2000) {
    return { url: null, reason: "L'adresse du code QR est trop longue." };
  }
  return { url: parsed.href, reason: null };
}

/** Key spellings seen on French, English and Tunisian receipts, mapped to our fields. */
const JSON_KEYS: { field: keyof QrFields; names: string[] }[] = [
  { field: "merchant_name", names: ["merchant", "seller", "vendor", "store", "shop", "fournisseur", "commercant", "vendeur", "nom", "name", "raison_sociale"] },
  { field: "receipt_number", names: ["receipt", "receipt_number", "invoice", "invoice_number", "number", "num", "numero", "facture", "ticket", "ref", "reference"] },
  { field: "tax_identifier", names: ["tax_id", "taxid", "vat", "vat_number", "matricule", "matricule_fiscal", "mf", "nif", "tin"] },
  { field: "purchase_date", names: ["date", "purchase_date", "datetime", "issued", "issue_date", "created"] },
  { field: "currency", names: ["currency", "devise", "cur"] },
  { field: "total_amount", names: ["total", "amount", "montant", "grand_total", "ttc", "total_ttc"] },
  { field: "tax_amount", names: ["tax", "tva", "vat_amount", "tax_amount", "montant_tva"] },
];

function readJsonFields(value: Record<string, unknown>): QrFields {
  const lower = new Map<string, unknown>();
  for (const [key, raw] of Object.entries(value)) {
    lower.set(key.toLowerCase().replace(/[\s-]+/g, "_"), raw);
  }
  const fields: QrFields = {};
  for (const { field, names } of JSON_KEYS) {
    for (const name of names) {
      const found = lower.get(name);
      if (found === undefined || found === null) continue;
      if (typeof found === "object") continue;
      const text = sanitizeForDisplay(String(found), 200);
      if (text !== "") {
        fields[field] = text;
        break;
      }
    }
  }
  return fields;
}

/** A Tunisian matricule fiscal: seven digits, three letters, three digits. */
const TAX_ID = /^\d{7}\s*\/?\s*[A-Z]\s*\/?\s*[A-Z]\s*\/?\s*[A-Z]?\s*\/?\s*\d{3}$/i;
const PAYMENT_REFERENCE = /^(ref|reference|pmt|payment|txn|trx|transaction)\s*[:#=-]\s*(\S{4,60})$/i;
const RECEIPT_LIKE = /^[A-Z0-9][A-Z0-9/\\_.-]{3,40}$/i;

/**
 * The one entry point. Everything that reaches the database from a QR code passes
 * through here first.
 */
export function parseQrPayload(input: unknown): ParsedQr {
  if (typeof input !== "string") {
    return {
      kind: "unsupported",
      raw: "",
      verificationUrl: null,
      fields: {},
      needsReview: true,
      reason: "Le code QR n'a pas pu être lu comme du texte.",
    };
  }

  if (input.length > MAX_QR_LENGTH) {
    return {
      kind: "unsupported",
      raw: stripControl(input).slice(0, MAX_QR_LENGTH),
      verificationUrl: null,
      fields: {},
      needsReview: true,
      reason: "Le contenu du code QR est trop long pour être un reçu. Il est conservé tel quel, sans être interprété.",
    };
  }

  const raw = stripControl(input).trim();
  if (raw === "") {
    return {
      kind: "unsupported",
      raw: "",
      verificationUrl: null,
      fields: {},
      needsReview: true,
      reason: "Le code QR est vide.",
    };
  }

  if (raw.startsWith("{") || raw.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(raw);
      const object = Array.isArray(parsed) ? parsed[0] : parsed;
      if (object && typeof object === "object") {
        const fields = readJsonFields(object as Record<string, unknown>);
        const found = Object.keys(fields).length;
        return {
          kind: "json",
          raw,
          verificationUrl: null,
          fields,
          needsReview: found === 0,
          reason: found === 0
            ? "Le code QR contient des données structurées, mais aucun champ reconnu. À saisir à la main."
            : null,
        };
      }
    } catch {
      // Falls through to the text handling below.
    }
    return {
      kind: "unsupported",
      raw,
      verificationUrl: null,
      fields: {},
      needsReview: true,
      reason: "Le code QR ressemble à des données structurées mais n'a pas pu être lu. Il est conservé tel quel.",
    };
  }

  // Before the scheme check below, because "REF: 88213" reads as a scheme and is not one.
  const payment = raw.match(PAYMENT_REFERENCE);
  if (payment) {
    return {
      kind: "payment_reference",
      raw,
      verificationUrl: null,
      fields: { receipt_number: payment[2] },
      needsReview: true,
      reason: "Le code QR contient une référence de paiement. Vérifiez qu'elle correspond bien au reçu.",
    };
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    const check = checkVerificationUrl(raw);
    if (check.url) {
      return {
        kind: "url",
        raw,
        verificationUrl: check.url,
        fields: {},
        needsReview: true,
        reason: "Le code QR contient une adresse de vérification. Elle est conservée mais n'est jamais ouverte automatiquement.",
      };
    }
    return {
      kind: "unsupported",
      raw,
      verificationUrl: null,
      fields: {},
      needsReview: true,
      reason: check.reason,
    };
  }

  if (TAX_ID.test(raw)) {
    return {
      kind: "tax_identifier",
      raw,
      verificationUrl: null,
      fields: { tax_identifier: raw.toUpperCase().replace(/\s+/g, "") },
      needsReview: false,
      reason: null,
    };
  }

  if (RECEIPT_LIKE.test(raw) && /\d/.test(raw)) {
    return {
      kind: "receipt_number",
      raw,
      verificationUrl: null,
      fields: { receipt_number: raw },
      needsReview: true,
      reason: "Le code QR contient une seule référence. Elle a été placée dans le numéro du reçu, à confirmer.",
    };
  }

  return {
    kind: "text",
    raw,
    verificationUrl: null,
    fields: {},
    needsReview: true,
    reason: "Le contenu du code QR n'a pas été reconnu. Il est conservé tel quel et les champs sont à saisir à la main.",
  };
}
