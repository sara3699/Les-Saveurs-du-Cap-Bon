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
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const body = `${negative ? "-" : ""}${grouped},${millimes}`;
  return withCurrency ? `${body} TND` : body;
}

/** Compact form for tiles where the millimes are noise: 62 480 TND. */
export function formatTNDCompact(amount: number): string {
  const grouped = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped} TND`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)} percent`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Relative timestamps are rendered on the server and passed down as strings, so
 * a client component never recomputes them and never mismatches on hydration.
 * Future times read as "in 4h", because a task due later today is not "just now".
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  if (diff < 0) return `in ${spanLabel(-diff)}`;
  if (diff < MINUTE) return "just now";
  if (diff < 2 * DAY) {
    if (diff < DAY) return spanLabel(diff);
    return "yesterday";
  }
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d`;
  return formatDate(iso);
}

function spanLabel(ms: number): string {
  if (ms < MINUTE) return "a moment";
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)}m`;
  if (ms < DAY) return `${Math.floor(ms / HOUR)}h`;
  return `${Math.floor(ms / DAY)}d`;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
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
 * "5h ago" while that is still meaningful, the date once it is not. Saying
 * "29 August 2026 ago" is the bug this exists to prevent.
 */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  if (diff < 0) return `in ${spanLabel(-diff)}`;
  if (diff < MINUTE) return "just now";
  if (diff < 7 * DAY) return `${spanLabel(diff)} ago`;
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
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}, ${formatClock(iso)}`;
}

/** Overdue is a state the owner acts on, so it is computed in one place. */
export function isOverdue(iso: string, now: Date = new Date()): boolean {
  return new Date(iso).getTime() < now.getTime();
}
