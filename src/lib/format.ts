/**
 * Tunisian dinar carries three decimals, and is written with a space between
 * thousands and a comma before the millimes: 1 240,000 TND. Intl gets this
 * right for ar-TN but renders Arabic-Indic digits, so the grouping is done by
 * hand to keep English digits everywhere in the interface.
 */
export function formatTND(amount: number, options: { withCurrency?: boolean } = {}): string {
  const { withCurrency = true } = options;
  const negative = amount < 0;
  const fixed = Math.abs(amount).toFixed(3);
  const [whole, millimes] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const body = `${negative ? "-" : ""}${grouped},${millimes}`;
  return withCurrency ? `${body} TND` : body;
}

/** Compact form for tiles where the millimes are noise: 62 480 TND. */
export function formatTNDCompact(amount: number): string {
  const grouped = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped} TND`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)} pour cent`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Relative timestamps are rendered on the server and passed down as strings, so
 * a client component never recomputes them and never mismatches on hydration.
 * Future times read as "dans 4h", because a task due later today is not "à l'instant".
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  if (diff < 0) return `dans ${spanLabel(-diff)}`;
  if (diff < MINUTE) return "à l'instant";
  if (diff < 2 * DAY) {
    if (diff < DAY) return spanLabel(diff);
    return "hier";
  }
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d`;
  return formatDate(iso);
}

function spanLabel(ms: number): string {
  if (ms < MINUTE) return "un instant";
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)}m`;
  if (ms < DAY) return `${Math.floor(ms / HOUR)}h`;
  return `${Math.floor(ms / DAY)}d`;
}

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/**
 * Short forms are written out rather than sliced, because "juin" and "juillet"
 * share their first three letters and a message stamp has to tell them apart.
 */
const MONTHS_SHORT = [
  "janv", "févr", "mars", "avr", "mai", "juin",
  "juil", "août", "sept", "oct", "nov", "déc",
];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatClock(iso)}`;
}

export function formatClock(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * "il y a 5h" while that is still meaningful, the date once it is not. Saying
 * "il y a 29 aout 2026" is the bug this exists to prevent.
 */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  if (diff < 0) return `dans ${spanLabel(-diff)}`;
  if (diff < MINUTE) return "à l'instant";
  if (diff < 7 * DAY) return `il y a ${spanLabel(diff)}`;
  return formatDate(iso);
}

/** A message stamp: the clock for today, the date as well for anything older. */
export function formatStamp(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) return formatClock(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${formatClock(iso)}`;
}

/** Overdue is a state the owner acts on, so it is computed in one place. */
export function isOverdue(iso: string, now: Date = new Date()): boolean {
  return new Date(iso).getTime() < now.getTime();
}
