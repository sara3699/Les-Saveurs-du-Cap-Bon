/**
 * Turning what is printed on a receipt into something the database can hold.
 *
 * None of this guesses quietly. Every function returns null when it cannot be sure,
 * and a null arrives on the review screen as an empty box with a warning next to it,
 * which is a better outcome than a confident wrong number in the shop's accounts.
 */

/**
 * The key two spellings of one supplier collapse onto.
 *
 * This mirrors `public.normalize_merchant` in the database, which is the one that
 * actually fills the column. This copy exists so the duplicate warning can be worked
 * out before a receipt is saved, and `normalize.test.ts` checks the two agree on the
 * cases that matter.
 */
const ACCENTS = "àâäáãåÀÂÄÁÃÅçÇèéêëÈÉÊËìíîïÌÍÎÏñÑòóôöõÒÓÔÖÕùúûüÙÚÛÜýÿÝ";
const PLAIN = "aaaaaaAAAAAAcCeeeeEEEEiiiiIIIInNoooooOOOOOuuuuUUUUyyY";

export function normalizeMerchant(value: string | null | undefined): string | null {
  if (!value) return null;
  let folded = "";
  for (const char of value) {
    const at = ACCENTS.indexOf(char);
    folded += at === -1 ? char : PLAIN[at];
  }
  const key = folded
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return key === "" ? null : key;
}

/**
 * A number as a till prints it.
 *
 * The rule: whichever of a comma or a full stop appears last is the decimal separator,
 * and everything else is grouping. That reads "1 234,567", "1,234.56" and "1.234,56"
 * correctly, and it reads the Tunisian "12,500" as twelve dinars five hundred millimes
 * rather than twelve thousand five hundred, which is what a dinar receipt means.
 *
 * The cost is that "1.234" meaning one thousand two hundred and thirty four comes back
 * as 1.234. That is why the review screen shows every amount for correction.
 */
export function normalizeAmount(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;

  const negative = /^[\s(]*-|\)\s*$/.test(raw);
  // Keep only what can be part of a number. Currency words and symbols go.
  const cleaned = raw.replace(/[^0-9.,]/g, "");
  if (cleaned === "" || !/[0-9]/.test(cleaned)) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalAt = Math.max(lastComma, lastDot);

  let whole: string;
  let fraction: string;
  if (decimalAt === -1) {
    whole = cleaned;
    fraction = "";
  } else {
    whole = cleaned.slice(0, decimalAt);
    fraction = cleaned.slice(decimalAt + 1);
    // A separator followed by more digits than any currency uses was grouping after
    // all: "1,234567" is not a fraction of a dinar.
    if (!/^\d{1,4}$/.test(fraction)) {
      whole = cleaned;
      fraction = "";
    }
  }

  const digits = whole.replace(/[^0-9]/g, "");
  if (digits === "" && fraction === "") return null;
  const value = Number(`${digits === "" ? "0" : digits}.${fraction === "" ? "0" : fraction}`);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

const MONTHS_FR: Record<string, number> = {
  janvier: 1, janv: 1, jan: 1,
  fevrier: 2, fevr: 2, fev: 2,
  mars: 3,
  avril: 4, avr: 4,
  mai: 5,
  juin: 6,
  juillet: 7, juil: 7,
  aout: 8,
  septembre: 9, sept: 9, sep: 9,
  octobre: 10, oct: 10,
  novembre: 11, nov: 11,
  decembre: 12, dec: 12,
};

const MONTHS_EN: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sept: 9, sep: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

function monthFromWord(word: string): number | null {
  const key = normalizeMerchant(word) ?? "";
  return MONTHS_FR[key] ?? MONTHS_EN[key] ?? null;
}

function iso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const made = new Date(Date.UTC(year, month - 1, day));
  // Rejects 31 February rather than letting it roll into March.
  if (made.getUTCMonth() !== month - 1 || made.getUTCDate() !== day) return null;
  return `${year.toString().padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function fullYear(value: number): number {
  if (value >= 1000) return value;
  // A till printing two digits means this century. A receipt from 1998 is not a
  // business expense anyone is filing today.
  return value >= 70 ? 1900 + value : 2000 + value;
}

/**
 * A date as a receipt prints it, returned as YYYY-MM-DD.
 *
 * Day comes first when both readings are possible, because this shop and its suppliers
 * are in Tunisia and write 04/03 for the fourth of March. Month-first is used only when
 * day-first cannot be a real date, which is what makes 12/25/2026 still readable.
 */
export function normalizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const text = raw.trim();
  if (text === "") return null;

  const isoMatch = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    return iso(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const worded = text.match(/(\d{1,2})(?:er)?[\s-]+([\p{L}.]+)[\s-]+(\d{2,4})/u);
  if (worded) {
    const month = monthFromWord(worded[2]);
    if (month) return iso(fullYear(Number(worded[3])), month, Number(worded[1]));
  }

  // "March 12, 2026"
  const wordedFirst = text.match(/([\p{L}.]+)[\s-]+(\d{1,2})(?:st|nd|rd|th)?,?[\s-]+(\d{2,4})/u);
  if (wordedFirst) {
    const month = monthFromWord(wordedFirst[1]);
    if (month) return iso(fullYear(Number(wordedFirst[3])), month, Number(wordedFirst[2]));
  }

  const numeric = text.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (numeric) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    const year = fullYear(Number(numeric[3]));
    return iso(year, second, first) ?? iso(year, first, second);
  }

  // A compact stamp, 20260312 or 12032026.
  const compact = text.match(/\b(\d{8})\b/);
  if (compact) {
    const d = compact[1];
    return (
      iso(Number(d.slice(0, 4)), Number(d.slice(4, 6)), Number(d.slice(6, 8))) ??
      iso(Number(d.slice(4, 8)), Number(d.slice(2, 4)), Number(d.slice(0, 2)))
    );
  }

  return null;
}

/** A clock reading, returned as HH:MM. "14h35", "2:35 PM" and "14:35:02" all work. */
export function normalizeTime(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/(\d{1,2})\s*[:hH.]\s*(\d{2})(?:\s*[:.]\s*\d{2})?/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59) return null;

  const meridiem = raw.match(/\b([ap])\.?\s?m\.?\b/i);
  if (meridiem) {
    const isAfternoon = meridiem[1].toLowerCase() === "p";
    if (hour === 12) hour = isAfternoon ? 12 : 0;
    else if (isAfternoon) hour += 12;
  }
  if (hour > 23) return null;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * What the money is. Tunisian receipts write the dinar half a dozen ways, so the
 * common ones are listed rather than guessed at.
 */
const CURRENCY_WORDS: { pattern: RegExp; code: string }[] = [
  { pattern: /\b(tnd|dt|tt?d)\b|dinars?|دينار|د\.?ت/i, code: "TND" },
  { pattern: /\beur\b|€|euros?/i, code: "EUR" },
  { pattern: /\busd\b|\bus\$|dollars?/i, code: "USD" },
  { pattern: /\bgbp\b|£/i, code: "GBP" },
  { pattern: /\bchf\b/i, code: "CHF" },
  { pattern: /\bmad\b|dirhams?/i, code: "MAD" },
  { pattern: /\bdzd\b/i, code: "DZD" },
  { pattern: /\blyd\b/i, code: "LYD" },
];

export function normalizeCurrency(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const text = raw.trim();
  if (/^[A-Za-z]{3}$/.test(text)) {
    const upper = text.toUpperCase();
    // Only accept a bare three-letter code when it is one we actually recognise, so a
    // stray word on a receipt does not become a currency.
    if (CURRENCY_WORDS.some((c) => c.code === upper)) return upper;
  }
  for (const { pattern, code } of CURRENCY_WORDS) {
    if (pattern.test(text)) return code;
  }
  return null;
}

/**
 * At most four digits, and only ever the last four.
 *
 * If a receipt prints a whole card number, this is the function that makes sure the
 * whole number does not travel any further. It never returns more than four digits.
 */
export function normalizeCardLastFour(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return null;
  return digits.slice(-4);
}

const PAYMENT_WORDS: { pattern: RegExp; label: string }[] = [
  { pattern: /esp[eè]ces?|cash|comptant|نقدا/i, label: "Espèces" },
  { pattern: /carte|card|cb\b|visa|mastercard|ماستركارد/i, label: "Carte bancaire" },
  { pattern: /ch[eè]que|cheque|check/i, label: "Chèque" },
  { pattern: /virement|transfer|wire/i, label: "Virement" },
  { pattern: /livraison|contre.?remboursement|cod\b/i, label: "À la livraison" },
  { pattern: /mobile|d17|flouci|paypal|wallet/i, label: "Paiement mobile" },
];

export function normalizePaymentMethod(raw: string | null | undefined): string | null {
  if (!raw) return null;
  for (const { pattern, label } of PAYMENT_WORDS) {
    if (pattern.test(raw)) return label;
  }
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed.slice(0, 60);
}

/** A Tunisian matricule fiscal, or any other tax number, without its spacing noise. */
export function normalizeTaxIdentifier(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9/.-]/g, "")
    .replace(/^[/.-]+|[/.-]+$/g, "");
  if (cleaned.length < 4 || !/\d/.test(cleaned)) return null;
  return cleaned.slice(0, 40);
}

/** A receipt or invoice number, kept as printed minus the label in front of it. */
export function normalizeReceiptNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Repeated, because a till prints "Facture N° 2412" and both words are labels.
  const cleaned = raw
    .replace(/^(?:\s*(?:n[°º]|n[o]\.?|num[eé]ro|ticket|re[çc]u|facture|invoice|receipt)\s*[:.#-]?\s*)+/i, "")
    .trim();
  if (cleaned === "" || !/[0-9]/.test(cleaned)) return null;
  return cleaned.slice(0, 60);
}
